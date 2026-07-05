import { ClipboardList, Copy } from "lucide-react";
import type { ProjectSummary } from "@/lib/project-summary";

type SummaryRow = {
  label: string;
  value: React.ReactNode;
};

export function ProjectSummaryCard({
  summary,
  onCopySummary,
}: {
  summary: ProjectSummary;
  onCopySummary?: () => void;
}) {
  const rows: SummaryRow[] = [
    {
      label: "Skala Proyek",
      value: (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${summary.scaleChipClass}`}
        >
          {summary.scaleLabel}
        </span>
      ),
    },
    { label: "Rekomendasi", value: summary.recommendation },
    { label: "Hal yang Perlu Diperhatikan", value: summary.watchOut },
    { label: "Langkah Selanjutnya", value: summary.nextStep },
  ];

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardList className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold">Ringkasan Proyek</h3>
        </div>
        {onCopySummary && (
          <button
            type="button"
            onClick={onCopySummary}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" />
            Salin
          </button>
        )}
      </div>

      <dl className="mt-4 space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold leading-snug text-foreground sm:max-w-[65%] sm:text-right">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
