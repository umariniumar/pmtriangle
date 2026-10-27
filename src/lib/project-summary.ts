import type { ComplexityLevel, ExperienceLevel, RevisionCount } from "@/lib/simulator";

export type ProjectScale = "ringan" | "menengah" | "besar" | "sangat_besar";

export type ProjectSummaryContext = {
  totalHours: number;
  workingDays: number;
  totalCost: number;
  bufferHours: number;
};

export type ProjectSummary = {
  scale: ProjectScale;
  scaleLabel: string;
  scaleChipClass: string;
  recommendation: string;
  watchOut: string;
  nextStep: string;
};

const COST_ATTENTION_THRESHOLD = 10_000_000;

const SCALE_LABELS: Record<ProjectScale, string> = {
  ringan: "Ringan",
  menengah: "Menengah",
  besar: "Besar",
  sangat_besar: "Sangat Besar",
};

// "besar" sengaja TIDAK memakai bg-warning/text-warning-foreground — warna
// itu sudah dipakai badge "Segera Hadir" (status rilis Pro, arti berbeda
// sama sekali). Skala proyek hanya informasi ukuran, bukan sinyal bahaya,
// jadi dipindah ke warna netral (secondary) supaya tidak tertukar makna
// dengan "Segera Hadir" di layar yang sama (lihat laporan desain, 27 Okt 2026).
const SCALE_CHIP_CLASSES: Record<ProjectScale, string> = {
  ringan: "bg-success/12 text-success",
  menengah: "bg-primary/12 text-primary",
  besar: "bg-secondary text-secondary-foreground",
  sangat_besar: "bg-destructive/12 text-destructive",
};

export function classifyProjectScale(totalHours: number): ProjectScale {
  if (totalHours <= 8) return "ringan";
  if (totalHours <= 40) return "menengah";
  if (totalHours <= 120) return "besar";
  return "sangat_besar";
}

function pickRecommendation(scale: ProjectScale, workingDays: number): string {
  if (scale === "ringan") {
    return "Masih realistis untuk dikerjakan sendiri dalam waktu singkat.";
  }

  if (scale === "menengah") {
    if (workingDays <= 5) {
      return `Dengan estimasi ${workingDays} hari kerja, proyek ini cocok dikerjakan sendiri.`;
    }
    return `Estimasi ${workingDays} hari kerja cukup panjang — bagi ke beberapa tahap agar progres mudah dipantau.`;
  }

  if (scale === "besar") {
    return `Estimasi ${workingDays} hari kerja ini sebaiknya dibagi menjadi beberapa tahap pengerjaan.`;
  }

  return "Proyek sebesar ini sebaiknya dikerjakan lebih dari satu orang.";
}

function pickWatchOut(scale: ProjectScale, bufferHours: number, totalCost: number): string {
  if (bufferHours >= 8) {
    return `Tambahkan sekitar ${bufferHours} jam cadangan di luar estimasi utama.`;
  }

  if (totalCost >= COST_ATTENTION_THRESHOLD) {
    return "Pastikan klien paham ruang lingkup sebelum mulai, agar biaya tidak membengkak.";
  }

  if (scale === "besar" || scale === "sangat_besar") {
    return "Deadline ketat bisa membuat jadwal terasa mepet — siapkan rencana cadangan.";
  }

  return `Sisihkan sekitar ${bufferHours} jam buffer waktu agar revisi tidak mengganggu jadwal.`;
}

function pickNextStep(scale: ProjectScale, workingDays: number, totalCost: number): string {
  if (scale === "ringan") {
    if (totalCost >= COST_ATTENTION_THRESHOLD) {
      return "Sepakati harga, ruang lingkup, dan tenggat waktu secara tertulis sebelum mulai.";
    }
    return "Sepakati harga dan tenggat waktu dengan klien, lalu mulai pengerjaan.";
  }

  if (scale === "menengah") {
    return `Bagi pengerjaan ke ${workingDays} hari kerja ke depan, per hari atau per minggu, sebelum mulai.`;
  }

  if (scale === "besar") {
    return "Tentukan tahap pengerjaan dan kapan setiap bagian selesai.";
  }

  return "Rencanakan siapa mengerjakan apa, lalu setujui jadwal bersama tim.";
}

export function buildProjectSummary(ctx: ProjectSummaryContext): ProjectSummary {
  const scale = classifyProjectScale(ctx.totalHours);

  return {
    scale,
    scaleLabel: SCALE_LABELS[scale],
    scaleChipClass: SCALE_CHIP_CLASSES[scale],
    recommendation: pickRecommendation(scale, ctx.workingDays),
    watchOut: pickWatchOut(scale, ctx.bufferHours, ctx.totalCost),
    nextStep: pickNextStep(scale, ctx.workingDays, ctx.totalCost),
  };
}

// ---------------------------------------------------------------------------
// Health Score & Risiko (Tugas 4) — satu-satunya tempat tabel penalti dan
// ambang risiko dihitung. simulator.ts hanya mengekstrak nilai terburuk per
// dimensi dari daftar pekerjaan lalu memanggil fungsi di bawah ini; jangan
// duplikasi tabel ini di tempat lain.

export type HealthBand = "excellent" | "healthy" | "warning" | "critical" | "high_risk";

const HEALTH_BAND_LABELS: Record<HealthBand, string> = {
  excellent: "Excellent (Sangat Baik)",
  healthy: "Healthy (Sehat)",
  warning: "Warning (Waspada)",
  critical: "Critical (Kritis)",
  high_risk: "High Risk (Risiko Tinggi)",
};

const HEALTH_BAND_CHIP_CLASSES: Record<HealthBand, string> = {
  excellent: "bg-success/12 text-success",
  healthy: "bg-primary/12 text-primary",
  warning: "bg-warning/15 text-warning-foreground",
  critical: "bg-destructive/12 text-destructive",
  high_risk: "bg-destructive/20 text-destructive",
};

function classifyHealthBand(score: number): HealthBand {
  if (score >= 90) return "excellent";
  if (score >= 75) return "healthy";
  if (score >= 60) return "warning";
  if (score >= 40) return "critical";
  return "high_risk";
}

export type HealthPenaltyKind = "complexity" | "revision" | "experience" | "deadline" | "capacity";

export type HealthPenalty = {
  kind: HealthPenaltyKind;
  amount: number;
  reason: string;
};

export type HealthScore = {
  score: number;
  band: HealthBand;
  bandLabel: string;
  bandChipClass: string;
  penalties: HealthPenalty[];
};

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type HealthInput = {
  worstComplexity: ComplexityLevel;
  worstRevisionCount: RevisionCount;
  lowestExperience: ExperienceLevel;
  workingDays: number;
  deadlineDays?: number;
};

function complexityPenalty(complexity: ComplexityLevel): HealthPenalty | null {
  if (complexity === "Sangat Tinggi") {
    return {
      kind: "complexity",
      amount: 20,
      reason: "Ada pekerjaan dengan kompleksitas Sangat Tinggi.",
    };
  }
  if (complexity === "Tinggi") {
    return { kind: "complexity", amount: 10, reason: "Ada pekerjaan dengan kompleksitas Tinggi." };
  }
  return null;
}

function revisionPenalty(revisionCount: RevisionCount): HealthPenalty | null {
  if (revisionCount === "unlimited") {
    return { kind: "revision", amount: 20, reason: "Ada pekerjaan dengan revisi tak terbatas." };
  }
  const n = Number.isFinite(revisionCount) ? revisionCount : 0;
  if (n >= 3) {
    return {
      kind: "revision",
      amount: 10,
      reason: "Ada pekerjaan dengan revisi 3 kali atau lebih.",
    };
  }
  if (n === 2)
    return { kind: "revision", amount: 5, reason: "Ada pekerjaan dengan revisi 2 kali." };
  if (n === 1)
    return { kind: "revision", amount: 2, reason: "Ada pekerjaan dengan revisi 1 kali." };
  return null;
}

function experiencePenalty(experience: ExperienceLevel): HealthPenalty | null {
  if (experience === "Pemula") {
    return { kind: "experience", amount: 15, reason: "Ada pekerjaan yang dikerjakan oleh Pemula." };
  }
  if (experience === "Junior") {
    return { kind: "experience", amount: 10, reason: "Ada pekerjaan yang dikerjakan oleh Junior." };
  }
  if (experience === "Menengah") {
    return {
      kind: "experience",
      amount: 5,
      reason: "Ada pekerjaan yang dikerjakan oleh level Menengah.",
    };
  }
  return null;
}

function deadlinePenalty(workingDays: number, deadlineDays?: number): HealthPenalty | null {
  if (deadlineDays === undefined) return null;
  if (workingDays > deadlineDays) {
    return {
      kind: "deadline",
      amount: 15,
      reason: `Estimasi hari kerja (${workingDays} hari) melebihi deadline (${deadlineDays} hari).`,
    };
  }
  if (workingDays === deadlineDays) {
    return {
      kind: "deadline",
      amount: 5,
      reason: "Estimasi hari kerja tepat sama dengan deadline — tidak ada margin.",
    };
  }
  return null;
}

function capacityPenalty(workingDays: number): HealthPenalty | null {
  if (workingDays > 40) {
    return { kind: "capacity", amount: 10, reason: "Durasi proyek lebih dari 40 hari kerja." };
  }
  if (workingDays >= 21) {
    return { kind: "capacity", amount: 5, reason: "Durasi proyek 21-40 hari kerja." };
  }
  return null;
}

// Penalti diambil dari pekerjaan TERBURUK di tiap dimensi (bukan dijumlahkan
// per pekerjaan) — proyek dengan banyak pekerjaan tidak otomatis jatuh ke nol
// hanya karena jumlahnya banyak.
export function calculateHealthScore(input: HealthInput): HealthScore {
  const penalties = [
    complexityPenalty(input.worstComplexity),
    revisionPenalty(input.worstRevisionCount),
    experiencePenalty(input.lowestExperience),
    deadlinePenalty(input.workingDays, input.deadlineDays),
    capacityPenalty(input.workingDays),
  ].filter((penalty): penalty is HealthPenalty => penalty !== null);

  const totalPenalty = penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
  const score = Math.min(100, Math.max(0, 100 - totalPenalty));
  const band = classifyHealthBand(score);

  return {
    score,
    band,
    bandLabel: HEALTH_BAND_LABELS[band],
    bandChipClass: HEALTH_BAND_CHIP_CLASSES[band],
    penalties,
  };
}

// Empat tingkat risiko baru (Tugas 4), menggantikan logika lama yang hanya
// berbasis hari kerja. "Faktor tinggi"/"faktor sedang" dihitung langsung dari
// input mentah, bukan dari daftar penalti, karena ambang batasnya sedikit
// berbeda dari tabel penalti Health Score (mis. "deadline mepet" bukan
// penalti Health Score, tapi tetap faktor risiko sedang).
export function calculateRiskLevel(input: HealthInput, health: HealthScore): RiskLevel {
  const hasDeadline = input.deadlineDays !== undefined;
  const deadlineExceeded = hasDeadline && input.workingDays > (input.deadlineDays as number);
  const deadlineOverrunDays = deadlineExceeded
    ? input.workingDays - (input.deadlineDays as number)
    : 0;
  const deadlineTight =
    hasDeadline &&
    !deadlineExceeded &&
    input.workingDays >= (input.deadlineDays as number) - 1 &&
    input.workingDays <= (input.deadlineDays as number);
  const revisionNumeric =
    typeof input.worstRevisionCount === "number" ? input.worstRevisionCount : null;

  const highFactorCount = [
    input.worstComplexity === "Sangat Tinggi",
    input.worstRevisionCount === "unlimited",
    input.lowestExperience === "Pemula",
    deadlineExceeded,
  ].filter(Boolean).length;

  const mediumFactorCount = [
    input.worstComplexity === "Tinggi",
    revisionNumeric !== null && revisionNumeric >= 3,
    input.lowestExperience === "Junior",
    deadlineTight,
    input.workingDays >= 21 && input.workingDays <= 40,
  ].filter(Boolean).length;

  if (health.score < 40 || highFactorCount >= 2 || deadlineOverrunDays >= 5) {
    return "critical";
  }
  if (highFactorCount >= 1) return "high";
  if (mediumFactorCount >= 1) return "medium";
  return "low";
}

// Urutan prioritas saat beberapa penalti sama besar — revisi dan deadline
// didahulukan karena dampaknya paling langsung terasa oleh freelancer (scope
// creep dan tenggat yang blong), sebelum faktor estimasi seperti kompleksitas
// atau pengalaman.
const INSIGHT_PRIORITY: HealthPenaltyKind[] = [
  "revision",
  "deadline",
  "complexity",
  "experience",
  "capacity",
];

// Insight utama diturunkan dari penalti terbesar, bukan kalimat generik.
export function buildHealthInsight(input: HealthInput, health: HealthScore): string {
  if (health.penalties.length === 0) {
    return "Proyek ini terlihat sehat — tidak ada faktor risiko yang menonjol. Pertimbangkan mengunci Baseline sekarang supaya perubahan berikutnya mudah dibandingkan.";
  }

  const worst = [...health.penalties].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return INSIGHT_PRIORITY.indexOf(a.kind) - INSIGHT_PRIORITY.indexOf(b.kind);
  })[0];

  switch (worst.kind) {
    case "revision": {
      if (input.worstRevisionCount === "unlimited") {
        return "Revisi tak terbatas adalah risiko terbesar pada proyek ini — pertimbangkan membatasi jumlah revisi atau menaikkan tarif untuk menutup jam tambahan yang mungkin muncul.";
      }
      return `Revisi berulang (${input.worstRevisionCount}x) adalah risiko terbesar pada proyek ini — pertimbangkan membatasi jumlah revisi atau menaikkan tarif untuk menutup jam tambahan yang mungkin muncul.`;
    }
    case "deadline": {
      if (input.deadlineDays !== undefined && input.workingDays > input.deadlineDays) {
        const overrun = input.workingDays - input.deadlineDays;
        return `Estimasi melampaui deadline ${overrun} hari kerja — pertimbangkan menambah jam fokus per hari, memangkas scope, atau menegosiasikan ulang deadline dengan klien.`;
      }
      return `Estimasi pas dengan deadline (${input.workingDays} hari kerja) — margin sangat tipis, siapkan rencana cadangan atau diskusikan kelonggaran dengan klien.`;
    }
    case "complexity":
      return `Kompleksitas ${input.worstComplexity} pada salah satu pekerjaan adalah risiko terbesar — pastikan ekspektasi klien realistis dan sisakan waktu ekstra untuk ketidakpastian teknis.`;
    case "experience":
      return `Tingkat pengalaman ${input.lowestExperience} pada salah satu pekerjaan adalah risiko terbesar — pertimbangkan menambah waktu belajar di estimasi atau meminta pendampingan dari rekan yang lebih senior.`;
    case "capacity":
      return `Durasi ${input.workingDays} hari kerja membuat kapasitas pengerjaan perlu perhatian ekstra — pertimbangkan membagi proyek menjadi tahap-tahap agar progres mudah dipantau.`;
  }
}
