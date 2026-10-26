import { getAppUrl } from "@/lib/app-url";
import { formatHoursLabel, formatMoney } from "@/lib/simulator";

export type ShareTextItem = {
  name: string;
  baseHours: number;
  adjustedHours: number;
};

export type ShareTextBaseline = {
  totalCost: number;
  durationLabel: string;
  workingDays: number;
};

export type ShareTextComparison = {
  hoursDelta: number;
  costDelta: number;
  workingDaysDelta: number;
};

export type ShareTextInput = {
  projectName: string;
  durationLabel: string;
  workingDays: number;
  totalCost: number;
  scaleLabel: string;
  recommendation: string;
  items: ShareTextItem[];
  // Baseline & comparison hadir berpasangan — hanya diisi kalau Baseline
  // sudah dikunci. Jangan menulis Baseline palsu saat salah satunya kosong.
  baseline?: ShareTextBaseline;
  comparison?: ShareTextComparison;
  healthScore: number;
  healthBandLabel: string;
  riskLabel: string;
  insight: string;
  flexibleDimensionLabel: string;
  focusHoursPerDay: number;
  deadlineDays?: number;
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

function formatSigned(
  delta: number,
  formatMagnitude: (n: number) => string,
  zeroLabel: string,
): string {
  if (delta === 0) return zeroLabel;
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${formatMagnitude(Math.abs(delta))}`;
}

function buildItemsSection(items: ShareTextItem[]): string[] {
  if (items.length === 0) return [];

  return [
    "Daftar Pekerjaan",
    ...items.map((item) => {
      const label = item.name.trim() || "Pekerjaan";
      return `• ${label}: ${formatHoursLabel(item.baseHours)} dasar → ${formatHoursLabel(item.adjustedHours)} disesuaikan`;
    }),
  ];
}

// Baseline & comparison hanya tampil bersamaan — kalau Baseline belum
// dikunci, bagian ini jujur menyatakan itu, bukan menampilkan angka palsu.
function buildBaselineSection(input: ShareTextInput): string[] {
  if (!input.baseline || !input.comparison) {
    return ["Baseline", "Belum dikunci — angka di atas masih bisa berubah bebas."];
  }

  const { baseline, comparison } = input;

  return [
    "Baseline",
    `${formatMoney(baseline.totalCost)} · ${baseline.durationLabel} (${baseline.workingDays} hari kerja)`,
    "",
    "Hasil Akhir",
    `${formatMoney(input.totalCost)} · ${input.durationLabel} (${input.workingDays} hari kerja)`,
    "",
    "Selisih dari Baseline",
    [
      formatSigned(comparison.hoursDelta, formatHoursLabel, "Jam tetap"),
      formatSigned(comparison.costDelta, formatMoney, "Biaya tetap"),
      formatSigned(comparison.workingDaysDelta, (n) => `${n} hari kerja`, "Hari kerja tetap"),
    ].join(" · "),
  ];
}

function buildAssumptionsSection(input: ShareTextInput): string[] {
  const deadlineLine =
    input.deadlineDays !== undefined
      ? `Deadline klien: ${input.deadlineDays} hari kerja`
      : "Deadline klien: tidak ditentukan";

  return [
    "Asumsi",
    `${input.flexibleDimensionLabel} dipilih sebagai dimensi fleksibel.`,
    `Jam fokus: ${input.focusHoursPerDay} jam/hari.`,
    deadlineLine,
    "Jam kerja sudah disesuaikan dengan kompleksitas, pengalaman, dan revisi masing-masing pekerjaan.",
  ];
}

function buildDocumentBody(input: ShareTextInput): string {
  const title = input.projectName.trim() || "Proyek";

  const blocks: string[][] = [
    [title, "", "Estimasi Proyek"],
    [DIVIDER],
    ["Harga Proyek", formatMoney(input.totalCost)],
    ["Estimasi Durasi", `${input.durationLabel} (${input.workingDays} hari kerja)`],
    buildItemsSection(input.items),
    buildBaselineSection(input),
    ["Health Score", `${input.healthScore} — ${input.healthBandLabel}`],
    ["Risiko", input.riskLabel],
    ["Insight", input.insight],
    buildAssumptionsSection(input),
    ["Skala Proyek", input.scaleLabel],
    ["Rekomendasi", input.recommendation],
    [DIVIDER],
  ];

  return blocks
    .filter((block) => block.length > 0)
    .map((block) => block.join("\n"))
    .join("\n\n");
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
