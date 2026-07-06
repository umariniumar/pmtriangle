export type AnalyticsEventName =
  | "landing_view"
  | "cta_clicked"
  | "simulation_started"
  | "simulation_completed"
  | "simulation_abandoned"
  | "summary_copied"
  | "summary_shared"
  | "share_card_downloaded"
  | "javascript_error"
  | "share_action_failed";

export type ShareChannel = "copy" | "native" | "whatsapp" | "image";

export type CtaSource = "header" | "hero";

export type ShareAction = "copy_summary" | "share_card";

export type ProjectMetadata = {
  project_scale: string;
  duration_bucket: string;
  cost_bucket: string;
  task_count: number;
  device_type: string;
  browser: string;
};
