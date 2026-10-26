import { getAppUrl, getLogoAssetUrl } from "@/lib/app-url";
import type { BaselineComparison, BaselineSnapshot } from "@/lib/baseline";
import type { HealthBand, ProjectSummary } from "@/lib/project-summary";
import { formatMoney, type SimulationResult } from "@/lib/simulator";

export type ShareCardBaseline = {
  totalCost: number;
  durationLabel: string;
  workingDays: number;
};

export type ShareCardComparison = {
  hoursDelta: number;
  costDelta: number;
  workingDaysDelta: number;
};

export type ShareCardData = {
  projectName: string;
  scaleLabel: string;
  scale: ProjectSummary["scale"];
  durationLabel: string;
  workingDays: number;
  costLabel: string;
  recommendation: string;
  healthScore: number;
  healthBand: HealthBand;
  healthBandLabel: string;
  riskLabel: string;
  insight: string;
  // Baseline & comparison hadir berpasangan — hanya diisi kalau Baseline
  // sudah dikunci, agar kartu tidak menampilkan Baseline palsu.
  baseline?: ShareCardBaseline;
  comparison?: ShareCardComparison;
  appUrl: string;
  logoUrl: string;
};

// Semua angka di sini diambil langsung dari SimulationResult/BaselineSnapshot/
// BaselineComparison yang sama dipakai layar — tidak ada rumus baru di sini.
export function buildShareCardData(options: {
  projectName: string;
  result: SimulationResult;
  riskLabel: string;
  baseline?: BaselineSnapshot;
  comparison?: BaselineComparison;
}): ShareCardData {
  const { projectName, result, riskLabel, baseline, comparison } = options;
  const hasBaseline = Boolean(baseline && comparison);

  return {
    projectName: projectName.trim() || "Proyek",
    scaleLabel: result.projectSummary.scaleLabel,
    scale: result.projectSummary.scale,
    durationLabel: result.durationLabel,
    workingDays: result.workingDays,
    costLabel: formatMoney(result.totalCost),
    recommendation: result.projectSummary.recommendation,
    healthScore: result.health.score,
    healthBand: result.health.band,
    healthBandLabel: result.health.bandLabel,
    riskLabel,
    insight: result.insight,
    baseline:
      hasBaseline && baseline
        ? {
            totalCost: baseline.totalCost,
            durationLabel: baseline.durationLabel,
            workingDays: baseline.workingDays,
          }
        : undefined,
    comparison: hasBaseline && comparison ? comparison : undefined,
    appUrl: getAppUrl(),
    logoUrl: getLogoAssetUrl(),
  };
}

export function shareCardFilename(projectName: string): string {
  const slug =
    projectName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "") || "proyek";

  return `estimo-${slug}.png`;
}
