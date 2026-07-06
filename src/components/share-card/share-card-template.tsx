import { forwardRef } from "react";
import type { ShareCardData } from "@/lib/share-card-data";
import { getScaleColors, SHARE_CARD_SIZE, shareCardTheme } from "@/lib/share-card-theme";

type ShareCardTemplateProps = {
  data: ShareCardData;
};

export const ShareCardTemplate = forwardRef<HTMLDivElement, ShareCardTemplateProps>(
  function ShareCardTemplate({ data }, ref) {
    const scaleColors = getScaleColors(data.scale);
    const { width, height } = SHARE_CARD_SIZE;
    const t = shareCardTheme;

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          boxSizing: "border-box",
          background: t.canvas.background,
          padding: 72,
          display: "flex",
          flexDirection: "column",
          fontFamily: t.fonts.body,
          color: t.text.primary,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: t.card.background,
            borderRadius: t.card.borderRadius,
            border: t.card.border,
            boxShadow: t.card.shadow,
            padding: "64px 56px 56px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: t.fonts.body,
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: t.text.muted,
            }}
          >
            Estimasi Proyek
          </p>

          <h1
            style={{
              margin: "20px 0 0",
              fontFamily: t.fonts.display,
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: t.text.primary,
              maxHeight: 196,
              overflow: "hidden",
            }}
          >
            {data.projectName}
          </h1>

          <div style={{ marginTop: 32 }}>
            <span
              style={{
                display: "inline-block",
                padding: "10px 20px",
                borderRadius: 999,
                background: scaleColors.bg,
                color: scaleColors.text,
                fontFamily: t.fonts.body,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {data.scaleLabel}
            </span>
          </div>

          <div
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32,
            }}
          >
            <MetricBlock label="Estimasi Durasi" value={data.durationLabel} />
            <MetricBlock label="Estimasi Biaya" value={data.costLabel} accent />
          </div>

          <div
            style={{
              marginTop: 48,
              flex: 1,
              padding: "28px 32px",
              borderRadius: 24,
              background: "#f6f9f7",
              border: "1px solid rgba(15, 23, 20, 0.05)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: t.text.secondary,
                letterSpacing: "0.02em",
              }}
            >
              Rekomendasi
            </p>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 26,
                fontWeight: 500,
                lineHeight: 1.45,
                color: t.text.primary,
                maxHeight: 152,
                overflow: "hidden",
              }}
            >
              {data.recommendation}
            </p>
          </div>

          <div
            style={{
              marginTop: 48,
              paddingTop: 32,
              borderTop: "1px solid rgba(15, 23, 20, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <span
              style={{
                fontFamily: t.fonts.display,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: t.text.accent,
              }}
            >
              ESTIMO
            </span>
            {data.appUrl ? (
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: t.text.muted,
                  textAlign: "right",
                  wordBreak: "break-all",
                }}
              >
                {data.appUrl.replace(/^https?:\/\//, "")}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);

function MetricBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const t = shareCardTheme;

  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 500,
          color: t.text.muted,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "8px 0 0",
          fontFamily: t.fonts.display,
          fontSize: accent ? 40 : 36,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: accent ? t.text.accent : t.text.primary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
    </div>
  );
}
