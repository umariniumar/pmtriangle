// Analytics-ready event layer for ESTIMO (anonymous-first MVP).
//
// No provider is wired yet — this is intentionally a thin, decoupled seam so a
// tool like Segment / PostHog / Plausible can be dropped in later without
// touching UI components. UI code only calls `track(event, props)`; it never
// talks to an analytics SDK directly.

export type AnalyticsEvent =
  | "landing_view"
  | "start_estimation"
  | "project_created"
  | "estimate_item_added"
  | "simulation_started"
  | "simulation_completed"
  | "result_shared"
  | "feedback_clicked";

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  // Placeholder sink. Replace this body with a real provider call in V2.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, props);
  }
}
