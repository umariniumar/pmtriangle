import { formatMoney } from "@/lib/simulator";

export type ShareTextInput = {
  projectName: string;
  durationLabel: string;
  totalCost: number;
  scaleLabel: string;
  recommendation: string;
};

function buildSummaryBody(input: ShareTextInput): string {
  const name = input.projectName.trim() || "Proyek";

  return [
    name,
    "",
    "Ringkasan Proyek",
    "",
    "Skala Proyek",
    input.scaleLabel,
    "",
    "Estimasi",
    input.durationLabel,
    "",
    "Biaya",
    formatMoney(input.totalCost),
    "",
    "Rekomendasi",
    input.recommendation,
  ].join("\n");
}

/** Tanpa branding — untuk dikirim ke klien. */
export function formatClientShareText(input: ShareTextInput): string {
  return buildSummaryBody(input);
}

/** Dengan branding ESTIMO — untuk fitur Bagikan Hasil. */
export function formatBrandedShareText(input: ShareTextInput): string {
  return ["ESTIMO", "", buildSummaryBody(input), "", "Dibuat menggunakan ESTIMO"].join("\n");
}
