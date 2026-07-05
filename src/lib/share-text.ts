import { getAppUrl } from "@/lib/app-url";
import { formatMoney } from "@/lib/simulator";

export type ShareTextInput = {
  projectName: string;
  durationLabel: string;
  totalCost: number;
  scaleLabel: string;
  recommendation: string;
};

const DIVIDER = "────────────────────────";

export function formatShareTimestamp(date = new Date()): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("id-ID", { month: "long" });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} • ${hours}:${minutes} WIB`;
}

function buildDocumentBody(input: ShareTextInput): string {
  const title = input.projectName.trim() || "Proyek";

  return [
    title,
    "",
    "Estimasi Proyek",
    "",
    DIVIDER,
    "",
    "Skala Proyek",
    input.scaleLabel,
    "",
    "Estimasi Durasi",
    input.durationLabel,
    "",
    "Estimasi Biaya",
    formatMoney(input.totalCost),
    "",
    "Rekomendasi",
    input.recommendation,
    "",
    DIVIDER,
  ].join("\n");
}

/** Versi klien — tanpa branding, URL, atau timestamp. */
export function formatClientShareText(input: ShareTextInput): string {
  return buildDocumentBody(input);
}

/** Versi branded — untuk fitur Bagikan. */
export function formatBrandedShareText(input: ShareTextInput, generatedAt = new Date()): string {
  const appUrl = getAppUrl();
  const footerLines = [
    "",
    "Disimulasikan menggunakan ESTIMO",
    "",
    ...(appUrl ? [appUrl, ""] : []),
    formatShareTimestamp(generatedAt),
  ];

  return buildDocumentBody(input) + footerLines.join("\n");
}
