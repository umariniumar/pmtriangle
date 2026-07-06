import { usePostHog } from "posthog-js/react";

/** Akses klien PostHog — null jika analytics tidak dikonfigurasi. */
export function useAnalyticsClient() {
  const client = usePostHog();
  if (!import.meta.env.VITE_POSTHOG_KEY) return null;
  return client;
}
