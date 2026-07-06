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

const LOGO_EXPORT_FILE = "estimo-logo.png";

/** URL absolut logo PNG untuk ekspor kartu (html-to-image). */
export function getLogoAssetUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/${LOGO_EXPORT_FILE}`;
  }
  const appUrl = getAppUrl();
  return appUrl ? `${appUrl}/${LOGO_EXPORT_FILE}` : `/${LOGO_EXPORT_FILE}`;
}

/** URL absolut untuk metadata Open Graph. */
export function getOgImageUrl(): string {
  const appUrl = getAppUrl();
  if (appUrl) return `${appUrl}/${LOGO_EXPORT_FILE}`;
  return `/${LOGO_EXPORT_FILE}`;
}
