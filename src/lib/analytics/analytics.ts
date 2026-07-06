import { buildProjectMetadata } from "@/lib/analytics/buckets";
import { captureClientEvent } from "@/lib/analytics/client";
import type {
  CtaSource,
  ProjectMetadata,
  ShareAction,
  ShareChannel,
} from "@/lib/analytics/events";
import type { ProjectScale } from "@/lib/project-summary";

function projectMeta(input: {
  scale: ProjectScale;
  totalHours: number;
  totalCost: number;
  taskCount: number;
}): ProjectMetadata {
  return buildProjectMetadata(input);
}

export function trackLandingView() {
  captureClientEvent("landing_view");
}

export function trackCtaClicked(source: CtaSource) {
  captureClientEvent("cta_clicked", { source });
}

export function trackSimulationStarted(input: {
  scale: ProjectScale;
  totalHours: number;
  totalCost: number;
  taskCount: number;
}) {
  captureClientEvent("simulation_started", projectMeta(input));
}

export function trackSimulationCompleted(input: {
  scale: ProjectScale;
  totalHours: number;
  totalCost: number;
  taskCount: number;
}) {
  captureClientEvent("simulation_completed", projectMeta(input));
}

export function trackSimulationAbandoned() {
  captureClientEvent("simulation_abandoned");
}

export function trackSummaryCopied(channel: ShareChannel = "copy") {
  captureClientEvent("summary_copied", { channel });
}

export function trackSummaryShared(channel: ShareChannel) {
  captureClientEvent("summary_shared", { channel });
}

export function trackShareCardDownloaded(channel: ShareChannel = "image") {
  captureClientEvent("share_card_downloaded", { channel });
}

export function trackShareActionFailed(action: ShareAction, reason: string) {
  captureClientEvent("share_action_failed", {
    action,
    reason: reason.slice(0, 120),
  });
}
