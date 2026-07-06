import { toBlob } from "html-to-image";
import { SHARE_CARD_SIZE } from "@/lib/share-card-theme";

async function waitForImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll("img");
  await Promise.all(
    [...images].map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

/** Saluran bagikan — v1 hanya `image`; sisanya disiapkan untuk rilis berikutnya. */
export type BagikanChannel = "text" | "image" | "whatsapp" | "copy";

export async function renderShareCardBlob(element: HTMLElement): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  await waitForImages(element);

  const blob = await toBlob(element, {
    width: SHARE_CARD_SIZE.width,
    height: SHARE_CARD_SIZE.height,
    pixelRatio: 1,
    cacheBust: true,
    skipAutoScale: true,
  });

  if (!blob) {
    throw new Error("Gagal merender kartu estimasi.");
  }

  return blob;
}

export async function downloadShareCardPng(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const blob = await renderShareCardBlob(element);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Orkestrator Bagikan — arsitektur siap untuk teks, WhatsApp, dan salin.
 * v1: hanya mengunduh PNG kartu estimasi.
 */
export async function bagikanProyek(options: {
  channel: BagikanChannel;
  cardElement: HTMLElement;
  filename: string;
}): Promise<void> {
  switch (options.channel) {
    case "image":
      await downloadShareCardPng(options.cardElement, options.filename);
      return;
    case "text":
    case "whatsapp":
    case "copy":
      throw new Error(`Saluran bagikan "${options.channel}" belum tersedia.`);
    default: {
      const _exhaustive: never = options.channel;
      throw new Error(`Saluran bagikan tidak dikenal: ${_exhaustive}`);
    }
  }
}
