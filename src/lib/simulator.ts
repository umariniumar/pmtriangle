export interface EstimateItem {
  id: string;
  name: string;
  hours: number;
  rate: number;
}

export interface SimulationResult {
  totalHours: number;
  totalCost: number;
  workingDays: number;
  weeks: number;
  riskLevel: "low" | "moderate" | "high";
  recommendation: string;
  bufferHours: number;
}

// Asumsi untuk menerjemahkan usaha (jam) menjadi estimasi kalender yang realistis.
// Seorang freelancer jarang menagih 8 jam fokus per hari — 6 jam lebih sehat.
export const FOCUS_HOURS_PER_DAY = 6;
export const WORKING_DAYS_PER_WEEK = 5;

// MVP ini hanya memvalidasi pasar Indonesia, jadi mata uang tunggal: Rupiah.
export function formatMoney(amount: number): string {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

export function itemCost(item: EstimateItem): number {
  return (item.hours || 0) * (item.rate || 0);
}

export function simulate(items: EstimateItem[]): SimulationResult {
  const totalHours = items.reduce((sum, i) => sum + (i.hours || 0), 0);
  const totalCost = items.reduce((sum, i) => sum + itemCost(i), 0);

  const workingDays = totalHours > 0 ? Math.ceil(totalHours / FOCUS_HOURS_PER_DAY) : 0;
  const weeks = Math.round((workingDays / WORKING_DAYS_PER_WEEK) * 10) / 10;
  const bufferHours = Math.round(totalHours * 0.15);

  let riskLevel: SimulationResult["riskLevel"] = "low";
  let recommendation =
    "Risiko rendah. Ini pekerjaan singkat dan terkendali — Anda bisa berkomitmen dengan percaya diri dan segera mulai.";

  if (weeks > 8) {
    riskLevel = "high";
    recommendation =
      "Risiko tinggi. Ini proyek besar. Pecah menjadi beberapa fase dengan deliverable terpisah, dan tambahkan buffer sebelum menawarkan harga tetap.";
  } else if (weeks >= 2) {
    riskLevel = "moderate";
    recommendation =
      "Cakupan menengah. Bagi pekerjaan menjadi milestone mingguan dan tambahkan buffer waktu 15% untuk melindungi timeline serta margin Anda.";
  }

  return {
    totalHours,
    totalCost,
    workingDays,
    weeks,
    riskLevel,
    recommendation,
    bufferHours,
  };
}
