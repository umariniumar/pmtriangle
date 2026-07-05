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
  insight: string;
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
  if (!hours || hours <= 0) return "—";

  const fullDays = Math.floor(hours / WORK_HOURS_PER_DAY);
  const remHours = Math.round(hours % WORK_HOURS_PER_DAY);

  if (fullDays === 0) return `${remHours} Jam`;

  const weeks = Math.floor(fullDays / WORK_DAYS_PER_WEEK);
  const days = fullDays % WORK_DAYS_PER_WEEK;

  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks} Minggu`);
  if (days > 0) parts.push(`${days} Hari`);
  if (remHours > 0) parts.push(`${remHours} Jam`);

  return parts.join(" ");
}

function buildInsight(
  totalHours: number,
  riskLevel: SimulationResult["riskLevel"],
): string {
  if (totalHours <= 0) {
    return "Tambahkan minimal satu pekerjaan dengan estimasi jam untuk melihat insight proyek Anda.";
  }

  const durText = formatDuration(totalHours).toLowerCase();
  const base = `Proyek ini diperkirakan membutuhkan sekitar ${durText} kerja.`;

  if (riskLevel === "low") {
    return `${base} Beban kerja masih cukup aman untuk dikerjakan satu orang, dan estimasi biayanya realistis untuk freelancer.`;
  }
  if (riskLevel === "moderate") {
    return `${base} Cakupannya menengah — bagi pekerjaan menjadi milestone mingguan dan sisihkan buffer waktu agar timeline tetap terjaga.`;
  }
  return `${base} Ini proyek besar. Pertimbangkan membagi pekerjaan menjadi dua atau lebih fase, terutama apabila deadline ketat.`;
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
    insight: buildInsight(totalHours, riskLevel),
    bufferHours,
    idealHours,
  };
}
