/** Versi aplikasi — disertakan di setiap event analytics. */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.0.0-beta";

export type AcquisitionContext = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
};

const ACQUISITION_STORAGE_KEY = "estimo_acquisition_v1";

function sanitizeParam(value: string | null, maxLength = 100): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim().slice(0, maxLength);
}

function getReferrerHost(): string | undefined {
  if (typeof document === "undefined" || !document.referrer) return undefined;
  try {
    return new URL(document.referrer).hostname.slice(0, 100);
  } catch {
    return undefined;
  }
}

/** Tangkap UTM & referrer sekali per tab — tanpa data pribadi. */
export function getAcquisitionContext(): AcquisitionContext {
  if (typeof window === "undefined") return {};

  const stored = sessionStorage.getItem(ACQUISITION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as AcquisitionContext;
    } catch {
      sessionStorage.removeItem(ACQUISITION_STORAGE_KEY);
    }
  }

  const params = new URLSearchParams(window.location.search);
  const context: AcquisitionContext = {};

  const utm_source = sanitizeParam(params.get("utm_source"));
  const utm_medium = sanitizeParam(params.get("utm_medium"));
  const utm_campaign = sanitizeParam(params.get("utm_campaign"));
  const referrer = getReferrerHost();

  if (utm_source) context.utm_source = utm_source;
  if (utm_medium) context.utm_medium = utm_medium;
  if (utm_campaign) context.utm_campaign = utm_campaign;
  if (referrer) context.referrer = referrer;

  sessionStorage.setItem(ACQUISITION_STORAGE_KEY, JSON.stringify(context));
  return context;
}

export function getBaseEventProperties(): Record<string, string | undefined> {
  const acquisition = getAcquisitionContext();
  return {
    app_version: APP_VERSION,
    ...acquisition,
  };
}
