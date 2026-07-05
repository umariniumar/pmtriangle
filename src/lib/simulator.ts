import { buildProjectSummary, type ProjectSummary } from "@/lib/project-summary";

export interface EstimateItem {
  id: string;
  name: string;
  hours: number;
  rate: number;
}

export interface SimulationResult {
  totalHours: number;
  totalCost: number;
  averageRate: number;
  workingDays: number;
  durationLabel: string;
  riskLevel: "low" | "moderate" | "high";
  projectSummary: ProjectSummary;
  bufferHours: number;
  idealHours: number;
}

// Asumsi kalender: 8 jam kerja per hari, 5 hari kerja per minggu.
// Manusia berpikir dalam hari, bukan pecahan minggu.
export const WORK_HOURS_PER_DAY = 8;
export const WORK_DAYS_PER_WEEK = 5;

// MVP ini hanya memvalidasi pasar Indonesia, jadi mata uang tunggal: Rupiah.
export function formatMoney(amount: number): string {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

export function itemCost(item: EstimateItem): number {
  return (item.hours || 0) * (item.rate || 0);
}

// Menerjemahkan total jam menjadi satuan waktu yang natural (jam / hari / minggu).
export function formatDuration(hours: number): string {
  if (hours <= 0) {
    if (hours === 0) return "0 Jam";
    return "—";
  }

  const hoursPerWeek = WORK_HOURS_PER_DAY * WORK_DAYS_PER_WEEK;

  if (hours < WORK_HOURS_PER_DAY) {
    return `${Math.round(hours)} Jam`;
  }

  if (hours < hoursPerWeek) {
    return `${Math.ceil(hours / WORK_HOURS_PER_DAY)} Hari`;
  }

  const fullDays = Math.floor(hours / WORK_HOURS_PER_DAY);
  const weeks = Math.floor(fullDays / WORK_DAYS_PER_WEEK);
  const days = fullDays % WORK_DAYS_PER_WEEK;

  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks} Minggu`);
  if (days > 0) parts.push(`${days} Hari`);
  return parts.join(" ");
}

export function simulate(items: EstimateItem[]): SimulationResult {
  const totalHours = items.reduce((sum, i) => sum + (i.hours || 0), 0);
  const totalCost = items.reduce((sum, i) => sum + itemCost(i), 0);
  const averageRate = totalHours > 0 ? totalCost / totalHours : 0;

  const workingDays = totalHours > 0 ? Math.ceil(totalHours / WORK_HOURS_PER_DAY) : 0;
  const bufferHours = Math.round(totalHours * 0.15);
  const idealHours = totalHours + bufferHours;

  let riskLevel: SimulationResult["riskLevel"] = "low";
  if (workingDays > 40) {
    riskLevel = "high";
  } else if (workingDays >= 10) {
    riskLevel = "moderate";
  }

  return {
    totalHours,
    totalCost,
    averageRate,
    workingDays,
    durationLabel: formatDuration(totalHours),
    riskLevel,
    projectSummary: buildProjectSummary({
      totalHours,
      workingDays,
      totalCost,
      bufferHours,
    }),
    bufferHours,
    idealHours,
  };
}
