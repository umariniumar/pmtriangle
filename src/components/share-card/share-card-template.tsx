import { forwardRef } from "react";
import type { ShareCardData } from "@/lib/share-card-data";
import {
  getHealthBandColors,
  getScaleColors,
  SHARE_CARD_SIZE,
  shareCardTheme,
} from "@/lib/share-card-theme";
import { formatMoney } from "@/lib/simulator";

type ShareCardTemplateProps = {
  data: ShareCardData;
};

export const ShareCardTemplate = forwardRef<HTMLDivElement, ShareCardTemplateProps>(
  function ShareCardTemplate({ data }, ref) {
    const scaleColors = getScaleColors(data.scale);
    const healthColors = getHealthBandColors(data.healthBand);
    const { width, height } = SHARE_CARD_SIZE;
    const t = shareCardTheme;
    const hasBaseline = Boolean(data.baseline && data.comparison);

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
            padding: "56px 56px 48px",
            minHeight: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: t.fonts.body,
              fontSize: 20,
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
              margin: "16px 0 0",
              fontFamily: t.fonts.display,
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: t.text.primary,
              maxHeight: 112,
              overflow: "hidden",
            }}
          >
            {data.projectName}
          </h1>

          <div style={{ marginTop: 20 }}>
            <span
              style={{
                display: "inline-block",
                padding: "8px 18px",
                borderRadius: 999,
                background: scaleColors.bg,
                color: scaleColors.text,
                fontFamily: t.fonts.body,
                fontSize: 19,
                fontWeight: 600,
              }}
            >
              {data.scaleLabel}
            </span>
          </div>

          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
          >
            <MetricBlock
              label="Estimasi Durasi"
              value={data.durationLabel}
              hint={`${data.workingDays} hari kerja`}
            />
            <MetricBlock label="Harga Proyek" value={data.costLabel} accent />
          </div>

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
          >
            <div
              style={{
                borderRadius: 18,
                border: `1px solid ${healthColors.bg}`,
                background: healthColors.bg,
                padding: "16px 20px",
              }}
            >
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: t.text.secondary }}>
                Health Score
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: t.fonts.display,
                  fontSize: 30,
                  fontWeight: 700,
                  color: healthColors.text,
                }}
              >
                {data.healthScore}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 15,
                  fontWeight: 600,
                  color: healthColors.text,
                }}
              >
                {data.healthBandLabel}
              </p>
            </div>
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(15, 23, 20, 0.06)",
                background: "#f6f9f7",
                padding: "16px 20px",
              }}
            >
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: t.text.secondary }}>
                Risiko
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: t.fonts.display,
                  fontSize: 30,
                  fontWeight: 700,
                  color: t.text.primary,
                }}
              >
                {data.riskLabel}
              </p>
            </div>
          </div>

          {hasBaseline && data.baseline && data.comparison && (
            <div
              style={{
                marginTop: 24,
                borderRadius: 18,
                border: "1px solid rgba(15, 23, 20, 0.06)",
                background: "#f6f9f7",
                padding: "18px 20px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: t.text.muted }}>
                    Baseline
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 19,
                      fontWeight: 700,
                      color: t.text.secondary,
                    }}
                  >
                    {formatMoney(data.baseline.totalCost)}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, color: t.text.muted }}>
                    {data.baseline.durationLabel} · {data.baseline.workingDays} hari kerja
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: t.text.muted }}>
                    Hasil Akhir
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 19,
                      fontWeight: 700,
                      color: t.text.primary,
                    }}
                  >
                    {data.costLabel}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, color: t.text.muted }}>
                    {data.durationLabel} · {data.workingDays} hari kerja
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <DeltaChip label="jam" value={data.comparison.hoursDelta} unit="jam" />
                <DeltaChip label="biaya" value={data.comparison.costDelta} unit="rupiah" />
                <DeltaChip
                  label="hari kerja"
                  value={data.comparison.workingDaysDelta}
                  unit="hari"
                />
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              flex: 1,
              minHeight: 0,
              padding: "24px 28px",
              borderRadius: 24,
              background: "#f6f9f7",
              border: "1px solid rgba(15, 23, 20, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: t.text.secondary,
                letterSpacing: "0.02em",
              }}
            >
              Insight
            </p>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 22,
                fontWeight: 500,
                lineHeight: 1.4,
                color: t.text.primary,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {data.insight}
            </p>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 24,
              borderTop: "1px solid rgba(15, 23, 20, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <img
              src={data.logoUrl}
              alt="ESTIMO"
              width={120}
              height={33}
              style={{
                display: "block",
                objectFit: "contain",
                objectPosition: "left center",
              }}
            />
            {data.appUrl ? (
              <span
                style={{
                  fontSize: 17,
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
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  const t = shareCardTheme;

  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 500,
          color: t.text.muted,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontFamily: t.fonts.display,
          fontSize: accent ? 36 : 32,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: accent ? t.text.accent : t.text.primary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {hint && <p style={{ margin: "4px 0 0", fontSize: 15, color: t.text.muted }}>{hint}</p>}
    </div>
  );
}

// Nilai delta sudah dihitung di tempat lain (compareToBaseline) — di sini
// hanya memformat, bukan menghitung ulang.
function DeltaChip({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: "jam" | "rupiah" | "hari";
}) {
  const t = shareCardTheme;

  if (value === 0) {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "6px 14px",
          borderRadius: 999,
          background: "#ffffff",
          border: "1px solid rgba(15, 23, 20, 0.08)",
          fontSize: 14,
          fontWeight: 600,
          color: t.text.muted,
        }}
      >
        {label} tetap
      </span>
    );
  }

  const sign = value > 0 ? "+" : "−";
  const magnitude = Math.abs(value);
  const formatted =
    unit === "rupiah"
      ? formatMoney(magnitude)
      : unit === "hari"
        ? `${magnitude} hari kerja`
        : `${magnitude} jam`;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 14px",
        borderRadius: 999,
        background: "#ffffff",
        border: "1px solid rgba(15, 23, 20, 0.08)",
        fontSize: 14,
        fontWeight: 600,
        color: t.text.primary,
      }}
    >
      {sign}
      {formatted}
    </span>
  );
}
