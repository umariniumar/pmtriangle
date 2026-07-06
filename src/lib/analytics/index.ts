export {
  trackCtaClicked,
  trackLandingView,
  trackShareActionFailed,
  trackShareCardDownloaded,
  trackSimulationAbandoned,
  trackSimulationCompleted,
  trackSimulationStarted,
  trackSummaryCopied,
  trackSummaryShared,
} from "@/lib/analytics/analytics";
export { APP_VERSION } from "@/lib/analytics/context";
export { useSimulationAbandonTracking } from "@/lib/analytics/use-simulation-abandon";
export { AnalyticsProvider } from "@/lib/analytics/provider";
export { useAnalyticsClient } from "@/lib/analytics/hooks";
export type {
  AnalyticsEventName,
  CtaSource,
  ProjectMetadata,
  ShareAction,
  ShareChannel,
} from "@/lib/analytics/events";
