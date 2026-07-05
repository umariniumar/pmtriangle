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

const SCALE_CHIP_CLASSES: Record<ProjectScale, string> = {
  ringan: "bg-success/12 text-success",
  menengah: "bg-primary/12 text-primary",
  besar: "bg-warning/15 text-warning-foreground",
  sangat_besar: "bg-destructive/12 text-destructive",
};

export function classifyProjectScale(totalHours: number): ProjectScale {
  if (totalHours <= 8) return "ringan";
  if (totalHours <= 40) return "menengah";
  if (totalHours <= 120) return "besar";
  return "sangat_besar";
}

function pickRecommendation(
  scale: ProjectScale,
  workingDays: number,
): string {
  if (scale === "ringan") {
    return "Masih realistis untuk dikerjakan oleh satu freelancer.";
  }

  if (scale === "menengah") {
    if (workingDays <= 5) {
      return "Cocok dikerjakan sendiri jika jadwal cukup longgar.";
    }
    return "Usahakan selesai per tahap agar progress mudah dipantau.";
  }

  if (scale === "besar") {
    return "Pertimbangkan membagi pekerjaan menjadi beberapa tahap.";
  }

  return "Proyek sebaiknya dikerjakan lebih dari satu orang.";
}

function pickWatchOut(
  scale: ProjectScale,
  bufferHours: number,
  totalCost: number,
): string {
  if (bufferHours >= 8) {
    return `Tambahkan sekitar ${bufferHours} jam cadangan di luar estimasi utama.`;
  }

  if (totalCost >= COST_ATTENTION_THRESHOLD) {
    return "Pastikan klien paham ruang lingkup sebelum mulai, agar biaya tidak membengkak.";
  }

  if (scale === "besar" || scale === "sangat_besar") {
    return "Deadline ketat bisa membuat jadwal terasa mepet — siapkan rencana cadangan.";
  }

  return "Sisihkan buffer waktu agar revisi tidak mengganggu jadwal.";
}

function pickNextStep(
  scale: ProjectScale,
  totalCost: number,
): string {
  if (scale === "ringan") {
    if (totalCost >= COST_ATTENTION_THRESHOLD) {
      return "Sepakati harga, ruang lingkup, dan tenggat waktu secara tertulis sebelum mulai.";
    }
    return "Sepakati harga dan tenggat waktu dengan klien, lalu mulai pengerjaan.";
  }

  if (scale === "menengah") {
    return "Buat urutan pekerjaan per hari atau per minggu sebelum mulai.";
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
    nextStep: pickNextStep(scale, ctx.totalCost),
  };
}
