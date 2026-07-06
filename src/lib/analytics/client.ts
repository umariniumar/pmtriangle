import posthog from "posthog-js";
import { getAcquisitionContext, getBaseEventProperties } from "@/lib/analytics/context";
import type { AnalyticsEventName } from "@/lib/analytics/events";

let initialized = false;

export function getPostHogClient(): typeof posthog | null {
  if (typeof window === "undefined") return null;
  if (!import.meta.env.VITE_POSTHOG_KEY) return null;
  return posthog;
}

export function initAnalyticsClient(): typeof posthog | null {
  if (typeof window === "undefined" || initialized) {
    return getPostHogClient();
  }

  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return null;

  const isProd = import.meta.env.PROD;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage",
    disable_session_recording: !isProd,
    session_recording: isProd
      ? {
          maskAllInputs: true,
          maskTextSelector: "input, textarea, [contenteditable='true']",
        }
      : undefined,
    capture_exceptions: isProd,
  });

  posthog.register(getBaseEventProperties());

  const acquisition = getAcquisitionContext();
  if (Object.keys(acquisition).length > 0) {
    posthog.register_once(acquisition);
  }

  if (isProd) {
    setupGlobalErrorTracking();
  }

  initialized = true;
  return posthog;
}

function setupGlobalErrorTracking() {
  window.addEventListener("error", (event) => {
    captureClientEvent("javascript_error", {
      message: String(event.message ?? "unknown_error").slice(0, 200),
      source: event.filename,
      line: event.lineno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "unhandled_rejection";

    captureClientEvent("javascript_error", {
      message: message.slice(0, 200),
      type: "unhandledrejection",
    });
  });
}

export function captureClientEvent(
  event: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | undefined>,
) {
  const payload = {
    ...getBaseEventProperties(),
    ...properties,
  };

  if (!import.meta.env.VITE_POSTHOG_KEY) {
    if (import.meta.env.DEV) {
      console.debug("[analytics]", event, payload);
    }
    return;
  }

  if (initialized) {
    posthog.capture(event, payload);
  } else if (import.meta.env.DEV) {
    console.debug("[analytics]", event, payload);
  }
}
