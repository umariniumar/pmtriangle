import type { ProjectScale } from "@/lib/project-summary";

/** Warna hex untuk ekspor PNG — tidak memakai oklch agar html-to-image konsisten. */
export const SHARE_CARD_SIZE = {
  width: 1080,
  height: 1350,
} as const;

export const shareCardTheme = {
  canvas: {
    background: "linear-gradient(165deg, #f7faf8 0%, #eef4f1 45%, #e8f0ec 100%)",
  },
  card: {
    background: "#ffffff",
    borderRadius: 40,
    border: "1px solid rgba(15, 23, 20, 0.06)",
    shadow: "0 24px 80px rgba(15, 35, 28, 0.08), 0 2px 8px rgba(15, 35, 28, 0.04)",
  },
  text: {
    primary: "#0f1a16",
    secondary: "#5c6b64",
    muted: "#8a9690",
    accent: "#2d8a6a",
  },
  fonts: {
    display: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
    body: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  },
  scale: {
    ringan: { bg: "#e8f5ef", text: "#1a7a55" },
    menengah: { bg: "#e8f2ef", text: "#2d8a6a" },
    besar: { bg: "#faf3e8", text: "#9a6b1a" },
    sangat_besar: { bg: "#fceceb", text: "#b83d32" },
  } satisfies Record<ProjectScale, { bg: string; text: string }>,
} as const;

export function getScaleColors(scale: ProjectScale) {
  return shareCardTheme.scale[scale];
}
