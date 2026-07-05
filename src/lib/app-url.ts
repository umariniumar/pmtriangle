/** URL publik aplikasi — set via VITE_APP_URL (mis. https://estimo.kodekoding.com). */
export function getAppUrl(): string {
  const fromEnv = import.meta.env.VITE_APP_URL;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}
