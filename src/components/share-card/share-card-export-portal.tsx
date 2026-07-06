import { type RefObject } from "react";
import { createPortal } from "react-dom";
import type { ShareCardData } from "@/lib/share-card-data";
import { ShareCardTemplate } from "@/components/share-card/share-card-template";

type ShareCardExportPortalProps = {
  data: ShareCardData;
  cardRef: RefObject<HTMLDivElement | null>;
};

/**
 * Renders the export template outside the page layout via portal.
 * Visually hidden and clipped — does not participate in sticky/stacking context.
 */
function ShareCardExportRoot({ data, cardRef }: ShareCardExportPortalProps) {
  return (
    <div
      id="estimo-share-card-export"
      aria-hidden
      data-share-card-export=""
      className="pointer-events-none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        overflow: "hidden",
        clipPath: "inset(50%)",
      }}
    >
      <ShareCardTemplate ref={cardRef} data={data} />
    </div>
  );
}

export function ShareCardExportPortal({ data, cardRef }: ShareCardExportPortalProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <ShareCardExportRoot data={data} cardRef={cardRef} />,
    document.body,
  );
}
