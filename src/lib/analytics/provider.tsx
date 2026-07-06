import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { initAnalyticsClient } from "@/lib/analytics/client";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initAnalyticsClient();
  }, []);

  if (!import.meta.env.VITE_POSTHOG_KEY) {
    return children;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
