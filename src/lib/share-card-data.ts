import { getAppUrl } from "@/lib/app-url";
import type { ProjectSummary } from "@/lib/project-summary";
import { formatMoney } from "@/lib/simulator";

export type ShareCardData = {
  projectName: string;
  scaleLabel: string;
  scale: ProjectSummary["scale"];
  durationLabel: string;
  costLabel: string;
  recommendation: string;
  appUrl: string;
};

export function buildShareCardData(
  projectName: string,
  summary: ProjectSummary,
  durationLabel: string,
  totalCost: number,
): ShareCardData {
  return {
    projectName: projectName.trim() || "Proyek",
    scaleLabel: summary.scaleLabel,
    scale: summary.scale,
    durationLabel,
    costLabel: formatMoney(totalCost),
    recommendation: summary.recommendation,
    appUrl: getAppUrl(),
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
