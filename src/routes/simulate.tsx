import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Share2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  type EstimateItem,
  formatMoney,
  itemCost,
  simulate,
} from "@/lib/simulator";
import {
  trackShareActionFailed,
  trackShareCardDownloaded,
  trackSimulationCompleted,
  trackSimulationStarted,
  trackSummaryCopied,
  useSimulationAbandonTracking,
} from "@/lib/analytics";
import { formatClientShareText } from "@/lib/share-text";
import { copyToClipboard } from "@/lib/share";
import { buildShareCardData, shareCardFilename } from "@/lib/share-card-data";
import { bagikanProyek } from "@/lib/share-card-engine";
import { ShareCardExportPortal } from "@/components/share-card/share-card-export-portal";
import { AnimatedNumber } from "@/components/animated-number";
import { EstimoLogo } from "@/components/estimo-logo";
import { ProjectSummaryCard } from "@/components/project-summary-card";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/simulate")({
  head: () => ({
    meta: [
      { title: "Estimasi proyek — ESTIMO" },
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

const PLACEHOLDER_EXAMPLES = [
  "Website Company Profile",
  "Landing Page",
  "Aplikasi POS",
  "Logo Brand",
];

function SimulatePage() {
  const [projectName, setProjectName] = useState("");
  const [items, setItems] = useState<EstimateItem[]>([makeItem()]);
  const [showResult, setShowResult] = useState(false);
  const [isSharingCard, setIsSharingCard] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const simulationCompletedRef = useRef(false);

  useSimulationAbandonTracking(simulationCompletedRef);

  const validItems = useMemo(() => items.filter((i) => i.hours > 0), [items]);
  const canSimulate = projectName.trim().length > 0 && validItems.length > 0;

  // Kalkulasi langsung — diperbarui pada setiap ketikan, tanpa menunggu tombol.
  const result = useMemo(() => simulate(items), [items]);

  // Placeholder contoh yang berganti untuk memberi inspirasi.
  useEffect(() => {
    const id = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length),
      2600,
    );
    return () => clearInterval(id);
  }, []);

  const updateItem = (id: string, patch: Partial<EstimateItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setShowResult(false);
  };

  const setName = (value: string) => {
    setProjectName(value);
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

  const simulationMeta = useMemo(
    () => ({
      scale: result.projectSummary.scale,
      totalHours: result.totalHours,
      totalCost: result.totalCost,
      taskCount: validItems.length,
    }),
    [result, validItems.length],
  );

  const handleSimulate = () => {
    if (!canSimulate) return;
    trackSimulationStarted(simulationMeta);
    setShowResult(true);
    simulationCompletedRef.current = true;
    trackSimulationCompleted(simulationMeta);
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const shareCardData = useMemo(
    () =>
      buildShareCardData(
        projectName,
        result.projectSummary,
        result.durationLabel,
        result.totalCost,
      ),
    [projectName, result],
  );

  const shareInput = useMemo(
    () => ({
      projectName,
      durationLabel: result.durationLabel,
      totalCost: result.totalCost,
      scaleLabel: result.projectSummary.scaleLabel,
      recommendation: result.projectSummary.recommendation,
    }),
    [projectName, result],
  );

  const handleCopySummary = async () => {
    const copied = await copyToClipboard(formatClientShareText(shareInput));
    if (copied) {
      trackSummaryCopied("copy");
      toast.success("Ringkasan berhasil disalin.");
      return;
    }
    trackShareActionFailed("copy_summary", "clipboard_unavailable");
    toast.error("Gagal menyalin ringkasan. Coba lagi.");
  };

  const handleShareResult = async () => {
    const cardElement = shareCardRef.current;
    if (!cardElement || isSharingCard) return;

    setIsSharingCard(true);
    const toastId = toast.loading("Menyiapkan kartu estimasi...");

    try {
      await bagikanProyek({
        channel: "image",
        cardElement,
        filename: shareCardFilename(projectName),
      });
      trackShareCardDownloaded("image");
      toast.success("Kartu estimasi berhasil diunduh.", { id: toastId });
    } catch {
      trackShareActionFailed("share_card", "render_or_download_failed");
      toast.error("Gagal mengunduh kartu estimasi. Coba lagi.", { id: toastId });
    } finally {
      setIsSharingCard(false);
    }
  };

  const recalculate = () => {
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    nextId = 1;
    setProjectName("");
    setItems([makeItem()]);
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          <Link to="/" className="inline-flex items-center py-1">
            <EstimoLogo height={22} />
          </Link>
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
                value={
                  <AnimatedNumber value={validItems.length} />
                }
              />
              <SummaryStat
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Total jam"
                value={
                  result.totalHours > 0 ? <AnimatedNumber value={result.totalHours} /> : "—"
                }
              />
              <SummaryStat
                icon={<CalendarRange className="h-3.5 w-3.5" />}
                label="Durasi"
                value={result.durationLabel}
              />
              <SummaryStat
                icon={<Wallet className="h-3.5 w-3.5" />}
                label="Biaya"
                value={
                  result.totalCost > 0 ? (
                    <AnimatedNumber value={result.totalCost} format={formatMoney} />
                  ) : (
                    "—"
                  )
                }
                highlight
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-40 pt-6">
        {/* Header proyek yang ringkas */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {projectName.trim().length === 0 ? "✨ Proyek Baru" : "Nama proyek"}
          </span>
          <input
            value={projectName}
            onChange={(e) => setName(e.target.value)}
            placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
            className="mt-1 w-full bg-transparent text-lg font-bold tracking-tight outline-none placeholder:font-semibold placeholder:text-muted-foreground/50 sm:text-xl"
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
            <Results
              projectName={projectName}
              result={result}
              onCopySummary={handleCopySummary}
            />
          </div>
        )}
      </main>

      {showResult && (
        <ShareCardExportPortal cardRef={shareCardRef} data={shareCardData} />
      )}

      {/* CTA utama — melekat di bawah untuk penggunaan satu tangan */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-5 py-3">
          {showResult ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={recalculate}
                className="inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-input bg-background px-2 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span className="leading-none sm:hidden">Ulang</span>
                <span className="hidden leading-none sm:inline">Hitung Ulang</span>
              </button>
              <button
                onClick={handleCopySummary}
                className="inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-primary px-2 py-3 text-xs font-semibold text-primary-foreground shadow-focus transition-transform hover:-translate-y-0.5 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm"
              >
                <Copy className="h-4 w-4 shrink-0" />
                <span className="leading-none sm:hidden">Salin</span>
                <span className="hidden leading-none sm:inline">Salin Ringkasan</span>
              </button>
              <button
                onClick={handleShareResult}
                disabled={isSharingCard}
                className="inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-input bg-background px-2 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm"
              >
                <Share2 className="h-4 w-4 shrink-0" />
                <span className="leading-none">Bagikan</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleSimulate}
                disabled={!canSimulate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-focus transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                <Sparkles className="h-4.5 w-4.5" />
                Simulasikan Estimasi
              </button>
              {!canSimulate && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Isi nama proyek dan minimal satu pekerjaan dengan jam untuk menyimulasikan.
                </p>
              )}
            </>
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
  value: React.ReactNode;
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
  onCopySummary,
}: {
  projectName: string;
  result: ReturnType<typeof simulate>;
  onCopySummary: () => void;
}) {
  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Estimasi untuk
        </p>
        <h2 className="truncate text-xl font-bold">{projectName}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Total jam"
          value={`${result.totalHours.toLocaleString("id-ID")} Jam`}
          hint={`Disarankan +${result.bufferHours} jam buffer · ideal ${result.idealHours.toLocaleString("id-ID")} Jam`}
        />
        <StatCard
          icon={<CalendarRange className="h-4 w-4" />}
          label="Estimasi durasi"
          value={result.durationLabel}
          hint={`${result.totalHours.toLocaleString("id-ID")} jam kerja`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Estimasi biaya"
          value={formatMoney(result.totalCost)}
          hint={`Rata-rata ${formatMoney(result.averageRate)} per jam`}
          highlight
        />
      </div>

      <ProjectSummaryCard summary={result.projectSummary} onCopySummary={onCopySummary} />
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
