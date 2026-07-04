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

// Kurs USD -> IDR (diperbarui 4 Juli 2026).
export const USD_TO_IDR = 17982.27;

export const CURRENCIES = [
  { code: "IDR", symbol: "Rp" },
  { code: "USD", symbol: "$" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "Rp";
}

// Konversi jumlah dari satu mata uang ke mata uang lain memakai kurs hari ini.
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  if (from === to || !amount) return amount;
  if (from === "USD" && to === "IDR") return amount * USD_TO_IDR;
  if (from === "IDR" && to === "USD") return amount / USD_TO_IDR;
  return amount;
}

export function formatMoney(amount: number, code: CurrencyCode): string {
  if (code === "IDR") {
    return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
  }
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function simulate(items: EstimateItem[]): SimulationResult {
  const totalHours = items.reduce((sum, i) => sum + (i.hours || 0), 0);
  const totalCost = items.reduce((sum, i) => sum + (i.hours || 0) * (i.rate || 0), 0);

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
