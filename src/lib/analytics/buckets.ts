import type { ProjectScale } from "@/lib/project-summary";

export function getDurationBucket(totalHours: number): string {
  if (totalHours <= 0) return "empty";
  if (totalHours <= 8) return "0-8h";
  if (totalHours <= 40) return "9-40h";
  if (totalHours <= 120) return "41-120h";
  return "120h+";
}

export function getCostBucket(totalCost: number): string {
  if (totalCost <= 0) return "empty";
  if (totalCost < 1_000_000) return "under_1m";
  if (totalCost < 5_000_000) return "1m_5m";
  if (totalCost < 20_000_000) return "5m_20m";
  return "20m_plus";
}

export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function getBrowserName(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Firefox/")) return "firefox";
  if (ua.includes("Chrome/")) return "chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "safari";
  return "other";
}

export function buildProjectMetadata(input: {
  scale: ProjectScale;
  totalHours: number;
  totalCost: number;
  taskCount: number;
}) {
  return {
    project_scale: input.scale,
    duration_bucket: getDurationBucket(input.totalHours),
    cost_bucket: getCostBucket(input.totalCost),
    task_count: input.taskCount,
    device_type: getDeviceType(),
    browser: getBrowserName(),
  };
}
