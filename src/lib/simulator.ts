import { buildProjectSummary, type ProjectSummary } from "@/lib/project-summary";

export type ComplexityLevel = "Sangat Rendah" | "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";

export type ExperienceLevel = "Ahli" | "Senior" | "Menengah" | "Junior" | "Pemula";

export type RevisionCount = number | "unlimited";

export type QualityLevel = "cukup" | "standar" | "tinggi";

export interface EstimateItem {
  id: string;
  name: string;
  hours: number;
  rate: number;
  complexity?: ComplexityLevel;
  experience?: ExperienceLevel;
  revisionCount?: RevisionCount;
  quality?: QualityLevel;
}

export interface SimulateOptions {
  focusHoursPerDay?: number;
  deadlineDays?: number;
}

export interface ItemSimulation {
  id: string;
  name: string;
  baseHours: number;
  adjustedHours: number;
  rate: number;
  cost: number;
}

export interface SimulationResult {
  totalHours: number;
  baseHours: number;
  totalCost: number;
  averageRate: number;
  workingDays: number;
  durationLabel: string;
  riskLevel: "low" | "moderate" | "high";
  projectSummary: ProjectSummary;
  bufferHours: number;
  bufferReasons: string[];
  idealHours: number;
  focusHoursPerDay: number;
  items: ItemSimulation[];
}

export const DEFAULT_COMPLEXITY: ComplexityLevel = "Sedang";
export const DEFAULT_EXPERIENCE: ExperienceLevel = "Senior";
export const DEFAULT_REVISION_COUNT: RevisionCount = 0;
export const DEFAULT_QUALITY: QualityLevel = "standar";
export const DEFAULT_FOCUS_HOURS_PER_DAY = 8;

export const COMPLEXITY_MULTIPLIERS: Record<ComplexityLevel, number> = {
  "Sangat Rendah": 0.8,
  Rendah: 0.9,
  Sedang: 1.0,
  Tinggi: 1.25,
  "Sangat Tinggi": 1.5,
};

export const EXPERIENCE_MULTIPLIERS: Record<ExperienceLevel, number> = {
  Ahli: 0.85,
  Senior: 1.0,
  Menengah: 1.15,
  Junior: 1.3,
  Pemula: 1.5,
};

export const REVISION_MULTIPLIERS = {
  0: 1.0,
  1: 1.1,
  2: 1.2,
  3: 1.35,
  unlimited: 1.5,
} as const;

export const COMPLEXITY_LEVELS = Object.keys(COMPLEXITY_MULTIPLIERS) as ComplexityLevel[];
export const EXPERIENCE_LEVELS = Object.keys(EXPERIENCE_MULTIPLIERS) as ExperienceLevel[];
export const QUALITY_LEVELS: QualityLevel[] = ["cukup", "standar", "tinggi"];

// Asumsi kalender: 8 jam kerja per hari, 5 hari kerja per minggu.
// Manusia berpikir dalam hari, bukan pecahan minggu.
export const WORK_HOURS_PER_DAY = 8;
export const WORK_DAYS_PER_WEEK = 5;

function finiteNonNegative(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function resolveComplexity(item: EstimateItem): ComplexityLevel {
  return item.complexity && item.complexity in COMPLEXITY_MULTIPLIERS
    ? item.complexity
    : DEFAULT_COMPLEXITY;
}

function resolveExperience(item: EstimateItem): ExperienceLevel {
  return item.experience && item.experience in EXPERIENCE_MULTIPLIERS
    ? item.experience
    : DEFAULT_EXPERIENCE;
}

function resolveQuality(item: EstimateItem): QualityLevel {
  return item.quality && QUALITY_LEVELS.includes(item.quality) ? item.quality : DEFAULT_QUALITY;
}

function revisionMultiplier(revisionCount: EstimateItem["revisionCount"]): number {
  if (revisionCount === "unlimited") return REVISION_MULTIPLIERS.unlimited;
  const n = finiteNonNegative(revisionCount ?? DEFAULT_REVISION_COUNT);
  if (n <= 0) return REVISION_MULTIPLIERS[0];
  if (n <= 1) return REVISION_MULTIPLIERS[1];
  if (n <= 2) return REVISION_MULTIPLIERS[2];
  return REVISION_MULTIPLIERS[3];
}

export function adjustedHours(item: EstimateItem): number {
  const baseHours = finiteNonNegative(item.hours);
  if (baseHours === 0) return 0;

  const hours =
    baseHours *
    COMPLEXITY_MULTIPLIERS[resolveComplexity(item)] *
    EXPERIENCE_MULTIPLIERS[resolveExperience(item)] *
    revisionMultiplier(item.revisionCount);

  return Number.isFinite(hours) ? hours : 0;
}

// MVP ini hanya memvalidasi pasar Indonesia, jadi mata uang tunggal: Rupiah.
export function formatMoney(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `Rp${Math.round(safe).toLocaleString("id-ID")}`;
}

export function itemCost(item: EstimateItem): number {
  return adjustedHours(item) * finiteNonNegative(item.rate);
}

function formatHourCount(hours: number): string {
  const rounded = Math.round(hours * 100) / 100;
  return Number.isInteger(rounded)
    ? rounded.toLocaleString("id-ID")
    : rounded.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

// Menerjemahkan total jam menjadi satuan waktu yang natural (jam / hari / minggu).
export function formatDuration(hours: number, hoursPerDay: number = WORK_HOURS_PER_DAY): string {
  if (!Number.isFinite(hours) || hours < 0) return "—";
  if (hours === 0) return "0 Jam";

  const dayHours = finiteNonNegative(hoursPerDay) || WORK_HOURS_PER_DAY;

  if (hours < dayHours) {
    return `${Math.round(hours)} Jam`;
  }

  const fullDays = Math.ceil(hours / dayHours);
  if (fullDays <= WORK_DAYS_PER_WEEK) {
    return `${fullDays} Hari`;
  }

  const weeks = Math.floor(fullDays / WORK_DAYS_PER_WEEK);
  const days = fullDays % WORK_DAYS_PER_WEEK;
  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks} Minggu`);
  if (days > 0) parts.push(`${days} Hari`);
  return parts.join(" ");
}

function collectBufferReasons(
  items: EstimateItem[],
  workingDays: number,
  deadlineDays?: number,
): string[] {
  const reasons = ["Buffer 15% sebagai cadangan ketidakpastian estimasi."];

  const hasHighRevision = items.some((item) => {
    if (item.revisionCount === "unlimited") return true;
    return finiteNonNegative(item.revisionCount) >= 3;
  });
  if (hasHighRevision) {
    reasons.push("Revisi tinggi — sisakan waktu untuk putaran umpan balik.");
  }

  const hasHighComplexity = items.some((item) => {
    const complexity = resolveComplexity(item);
    return complexity === "Tinggi" || complexity === "Sangat Tinggi";
  });
  if (hasHighComplexity) {
    reasons.push(
      "Kompleksitas tinggi — pekerjaan cenderung memakan waktu lebih lama dari perkiraan.",
    );
  }

  const hasLowConfidence = items.some((item) => resolveQuality(item) === "cukup");
  if (hasLowConfidence) {
    reasons.push(
      "Keyakinan rendah terhadap estimasi — buffer membantu menutup celah yang belum terlihat.",
    );
  }

  const hasJuniorLoad = items.some((item) => {
    const experience = resolveExperience(item);
    return experience === "Junior" || experience === "Pemula";
  });
  if (hasJuniorLoad) {
    reasons.push(
      "Pengalaman masih berkembang — buffer menutup waktu belajar di tengah pengerjaan.",
    );
  }

  const deadline = finiteNonNegative(deadlineDays);
  if (deadline > 0 && workingDays > deadline) {
    reasons.push(`Deadline ${deadline} hari lebih ketat dari estimasi ${workingDays} hari kerja.`);
  }

  return reasons;
}

export function simulate(items: EstimateItem[], options: SimulateOptions = {}): SimulationResult {
  const safeItems = Array.isArray(items) ? items : [];
  const focusHoursPerDay =
    finiteNonNegative(options.focusHoursPerDay) || DEFAULT_FOCUS_HOURS_PER_DAY;
  const deadlineDays =
    options.deadlineDays === undefined ? undefined : finiteNonNegative(options.deadlineDays);

  const itemResults: ItemSimulation[] = safeItems.map((item) => {
    const baseHours = finiteNonNegative(item.hours);
    const hours = adjustedHours(item);
    const rate = finiteNonNegative(item.rate);
    return {
      id: item.id,
      name: item.name,
      baseHours,
      adjustedHours: hours,
      rate,
      cost: hours * rate,
    };
  });

  const baseHours = itemResults.reduce((sum, item) => sum + item.baseHours, 0);
  const totalHours = itemResults.reduce((sum, item) => sum + item.adjustedHours, 0);
  const totalCost = itemResults.reduce((sum, item) => sum + item.cost, 0);
  const averageRate = totalHours > 0 ? totalCost / totalHours : 0;

  const workingDays = totalHours > 0 ? Math.ceil(totalHours / focusHoursPerDay) : 0;
  const bufferHours = Math.round(totalHours * 0.15);
  const idealHours = totalHours + bufferHours;
  const bufferReasons = collectBufferReasons(safeItems, workingDays, deadlineDays);

  let riskLevel: SimulationResult["riskLevel"] = "low";
  if (workingDays > 40) {
    riskLevel = "high";
  } else if (workingDays >= 10) {
    riskLevel = "moderate";
  }

  return {
    totalHours,
    baseHours,
    totalCost,
    averageRate,
    workingDays,
    durationLabel: formatDuration(totalHours, focusHoursPerDay),
    riskLevel,
    projectSummary: buildProjectSummary({
      totalHours,
      workingDays,
      totalCost,
      bufferHours,
    }),
    bufferHours,
    bufferReasons,
    idealHours,
    focusHoursPerDay,
    items: itemResults,
  };
}

export function formatHoursLabel(hours: number): string {
  return `${formatHourCount(finiteNonNegative(hours))} Jam`;
}
