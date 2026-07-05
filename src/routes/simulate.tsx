import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Trash2,
  Clock,
  CalendarRange,
  Wallet,
  ListChecks,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import {
  type EstimateItem,
  formatMoney,
  itemCost,
  simulate,
  FOCUS_HOURS_PER_DAY,
} from "@/lib/simulator";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/simulate")({
  head: () => ({
    meta: [
      { title: "Simulasikan proyek — Simulator Keputusan Proyek" },
      {
        name: "description",
        content:
          "Tambahkan pekerjaan dan lihat total jam, durasi, dan biaya proyek Anda diperbarui secara langsung.",
      },
    ],
  }),
  component: SimulatePage,
});

let nextId = 1;
const makeItem = (): EstimateItem => ({
  id: `item-${nextId++}`,
  name: "",
  hours: 0,
  rate: 0,
});

function SimulatePage() {
  const [projectName, setProjectName] = useState("");
  const [items, setItems] = useState<EstimateItem[]>([makeItem()]);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const validItems = useMemo(() => items.filter((i) => i.hours > 0), [items]);
  const canSimulate = projectName.trim().length > 0 && validItems.length > 0;

  // Kalkulasi langsung — diperbarui pada setiap ketikan, tanpa menunggu tombol Simulasikan.
  const result = useMemo(() => simulate(items), [items]);

  const updateItem = (id: string, patch: Partial<EstimateItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setShowResult(false);
  };

  const addItem = () => {
    setItems((prev) => [...prev, makeItem()]);
    setShowResult(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setShowResult(false);
  };

  const handleSimulate = () => {
    if (!canSimulate) return;
    setShowResult(true);
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const reset = () => {
    nextId = 1;
    setProjectName("");
    setItems([makeItem()]);
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const durationLabel = result.totalHours > 0 ? `${result.weeks} mgg` : "—";
  const costLabel = result.totalCost > 0 ? formatMoney(result.totalCost) : "—";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3.5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <span className="font-display text-sm font-semibold">Simulator Keputusan</span>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Ringkasan proyek — melekat di bawah header, diperbarui langsung. */}
        <div className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-2xl px-5 py-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryStat
                icon={<ListChecks className="h-3.5 w-3.5" />}
                label="Pekerjaan"
                value={`${validItems.length}`}
              />
              <SummaryStat
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Total jam"
                value={result.totalHours > 0 ? `${result.totalHours}` : "—"}
              />
              <SummaryStat
                icon={<CalendarRange className="h-3.5 w-3.5" />}
                label="Durasi"
                value={durationLabel}
              />
              <SummaryStat
                icon={<Wallet className="h-3.5 w-3.5" />}
                label="Biaya"
                value={costLabel}
                highlight
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-40 pt-6">
        {/* Header proyek yang ringkas */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <input
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setShowResult(false);
            }}
            placeholder="Nama proyek — mis. Website Company Profile"
            className="w-full bg-transparent text-lg font-bold tracking-tight outline-none placeholder:font-semibold placeholder:text-muted-foreground/50 sm:text-xl"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {validItems.length} pekerjaan · {result.totalHours} jam
          </p>
        </section>

        {/* Daftar pekerjaan */}
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">Daftar Pekerjaan</h2>
            {items.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {validItems.length} dihitung
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-input bg-card px-6 py-12 text-center shadow-card">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <ClipboardList className="h-7 w-7" />
              </span>
              <p className="mt-4 text-base font-semibold">Belum ada pekerjaan.</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Tambahkan pekerjaan pertama untuk mulai menghitung estimasi proyek.
              </p>
              <button
                onClick={addItem}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Tambah Pekerjaan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      placeholder={`Pekerjaan ${idx + 1}`}
                      className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-medium placeholder:text-muted-foreground/50"
                    />
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Hapus pekerjaan"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">
                        Estimasi Jam
                      </span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={item.hours || ""}
                        onChange={(e) =>
                          updateItem(item.id, { hours: Math.max(0, Number(e.target.value)) })
                        }
                        placeholder="0"
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none transition-shadow placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">
                        Tarif per Jam
                      </span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={item.rate || ""}
                        onChange={(e) =>
                          updateItem(item.id, { rate: Math.max(0, Number(e.target.value)) })
                        }
                        placeholder="Rp0"
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none transition-shadow placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring"
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      Estimasi biaya
                    </span>
                    <span className="font-display text-sm font-bold">
                      {itemCost(item) > 0 ? formatMoney(itemCost(item)) : "—"}
                    </span>
                  </div>
                </div>
              ))}

              <button
                onClick={addItem}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-input px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                Tambah Pekerjaan
              </button>
            </div>
          )}
        </section>

        {showResult && (
          <div
            ref={resultRef}
            className="mt-10 scroll-mt-40 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <Results projectName={projectName} result={result} />
          </div>
        )}
      </main>

      {/* CTA utama — melekat di bawah untuk penggunaan satu tangan */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-5 py-3">
          <button
            onClick={handleSimulate}
            disabled={!canSimulate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-focus transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Sparkles className="h-4.5 w-4.5" />
            Simulasikan
          </button>
          {!canSimulate && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Isi nama proyek dan minimal satu pekerjaan dengan jam untuk menyimulasikan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        highlight ? "border-primary/30 bg-accent" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[0.7rem] font-medium">{label}</span>
      </div>
      <p className="mt-0.5 font-display text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

function Results({
  projectName,
  result,
}: {
  projectName: string;
  result: ReturnType<typeof simulate>;
}) {
  const riskStyles: Record<typeof result.riskLevel, { label: string; cls: string }> = {
    low: { label: "Risiko rendah", cls: "bg-success/12 text-success" },
    moderate: { label: "Risiko menengah", cls: "bg-warning/15 text-warning-foreground" },
    high: { label: "Risiko tinggi", cls: "bg-destructive/12 text-destructive" },
  };
  const risk = riskStyles[result.riskLevel];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Simulasi untuk
          </p>
          <h2 className="truncate text-xl font-bold">{projectName}</h2>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${risk.cls}`}>
          {risk.label}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Total jam"
          value={`${result.totalHours.toLocaleString("id-ID")} jam`}
          hint={`+${result.bufferHours} jam buffer disarankan`}
        />
        <StatCard
          icon={<CalendarRange className="h-4 w-4" />}
          label="Estimasi durasi"
          value={`${result.weeks} mgg`}
          hint={`${result.workingDays} hari kerja`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Estimasi biaya"
          value={formatMoney(result.totalCost)}
          hint="Jam × tarif"
          highlight
        />
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold">Rekomendasi</h3>
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-foreground">
          {result.recommendation}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Berdasarkan {FOCUS_HOURS_PER_DAY} jam fokus/hari selama 5 hari kerja seminggu.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-card ${
        highlight ? "border-primary/30 bg-accent" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
