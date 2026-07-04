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

// Assumptions used to translate effort into a realistic calendar estimate.
// A freelancer rarely bills 8 focused hours a day — 6 is a healthier default.
export const FOCUS_HOURS_PER_DAY = 6;
export const WORKING_DAYS_PER_WEEK = 5;

export const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "$";
}

export function formatMoney(amount: number, code: CurrencyCode): string {
  return `${currencySymbol(code)}${amount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export function simulate(items: EstimateItem[]): SimulationResult {
  const totalHours = items.reduce((sum, i) => sum + (i.hours || 0), 0);
  const totalCost = items.reduce((sum, i) => sum + (i.hours || 0) * (i.rate || 0), 0);

  const workingDays = totalHours > 0 ? Math.ceil(totalHours / FOCUS_HOURS_PER_DAY) : 0;
  const weeks = Math.round((workingDays / WORKING_DAYS_PER_WEEK) * 10) / 10;
  const bufferHours = Math.round(totalHours * 0.15);

  let riskLevel: SimulationResult["riskLevel"] = "low";
  let recommendation =
    "Low risk. This is a quick, well-contained job — you can commit with confidence and start soon.";

  if (weeks > 8) {
    riskLevel = "high";
    recommendation =
      "High risk. This is a large engagement. Split it into phases with separate deliverables, and add a buffer before quoting a fixed price.";
  } else if (weeks >= 2) {
    riskLevel = "moderate";
    recommendation =
      "Moderate scope. Break the work into weekly milestones and add a 15% time buffer to protect your timeline and margin.";
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
