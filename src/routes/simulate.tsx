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
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  COMPLEXITY_LEVELS,
  DEFAULT_COMPLEXITY,
  DEFAULT_EXPERIENCE,
  DEFAULT_FLEXIBLE_DIMENSION,
  DEFAULT_FOCUS_HOURS_PER_DAY,
  DEFAULT_REVISION_COUNT,
  EXPERIENCE_LEVELS,
  FLEXIBLE_DIMENSIONS,
  FLEXIBLE_DIMENSION_LABELS,
  type ComplexityLevel,
  type EstimateItem,
  type ExperienceLevel,
  type FlexibleDimension,
  type RevisionCount,
  type SimulationResult,
  formatHoursLabel,
  formatMoney,
  itemCost,
  simulate,
} from "@/lib/simulator";
import {
  compareToBaseline,
  createBaselineSnapshot,
  createChangeLogEntry,
  detectBaselineConflict,
  type BaselineComparison,
  type BaselineConflict,
  type BaselineSnapshot,
  type ChangeLogEntry,
  type ChangeLogField,
} from "@/lib/baseline";
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
import { useProStatus } from "@/lib/pro";
import { ShareCardExportPortal } from "@/components/share-card/share-card-export-portal";
import { AnimatedNumber } from "@/components/animated-number";
import { EstimoLogo } from "@/components/estimo-logo";
import { ProjectSummaryCard } from "@/components/project-summary-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { UpgradeModal } from "@/components/upgrade-modal";

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
  complexity: DEFAULT_COMPLEXITY,
  experience: DEFAULT_EXPERIENCE,
  revisionCount: DEFAULT_REVISION_COUNT,
});

const REVISION_OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "unlimited", label: "Tak terbatas" },
];

function parseNonNegative(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function revisionSelectValue(revisionCount: RevisionCount | undefined): string {
  return revisionCount === "unlimited" ? "unlimited" : String(revisionCount ?? 0);
}

function parseRevisionCount(value: string): RevisionCount {
  return value === "unlimited" ? "unlimited" : parseNonNegative(value);
}

function revisionLabel(revisionCount: RevisionCount | undefined): string {
  const value = revisionSelectValue(revisionCount);
  return REVISION_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

const RISK_LABELS: Record<SimulationResult["riskLevel"], string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  critical: "Kritis",
};

// Field pada EstimateItem yang perubahannya dicatat di Change Log. Nama
// pekerjaan sengaja tidak termasuk — bukan bagian dari Tugas 3.
function describeItemChange(
  key: keyof EstimateItem,
  before: EstimateItem,
  after: EstimateItem,
): { field: ChangeLogField; description: string } | null {
  const label = after.name.trim() || before.name.trim() || "Pekerjaan";

  switch (key) {
    case "hours":
      return {
        field: "base_hours",
        description: `Jam dasar "${label}" diubah dari ${before.hours} jam menjadi ${after.hours} jam.`,
      };
    case "rate":
      return {
        field: "rate",
        description: `Tarif "${label}" diubah dari ${formatMoney(before.rate)} menjadi ${formatMoney(after.rate)}.`,
      };
    case "complexity":
      return {
        field: "complexity",
        description: `Kompleksitas "${label}" diubah dari ${before.complexity ?? DEFAULT_COMPLEXITY} menjadi ${after.complexity ?? DEFAULT_COMPLEXITY}.`,
      };
    case "experience":
      return {
        field: "experience",
        description: `Pengalaman "${label}" diubah dari ${before.experience ?? DEFAULT_EXPERIENCE} menjadi ${after.experience ?? DEFAULT_EXPERIENCE}.`,
      };
    case "revisionCount":
      return {
        field: "revision",
        description: `Revisi "${label}" diubah dari ${revisionLabel(before.revisionCount)} menjadi ${revisionLabel(after.revisionCount)}.`,
      };
    default:
      return null;
  }
}

const PLACEHOLDER_EXAMPLES = [
  "Website Company Profile",
  "Landing Page",
  "Aplikasi POS",
  "Logo Brand",
];

function SimulatePage() {
  const [projectName, setProjectName] = useState("");
  const [items, setItems] = useState<EstimateItem[]>([makeItem()]);
  const [flexibleDimension, setFlexibleDimension] = useState<FlexibleDimension>(
    DEFAULT_FLEXIBLE_DIMENSION,
  );
  const [focusHoursPerDay, setFocusHoursPerDay] = useState(DEFAULT_FOCUS_HOURS_PER_DAY);
  const [deadlineDays, setDeadlineDays] = useState<number | undefined>(undefined);
  const [baseline, setBaseline] = useState<BaselineSnapshot | null>(null);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isSharingCard, setIsSharingCard] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const simulationCompletedRef = useRef(false);

  const { isPro, record: proRecord, activate: activatePro } = useProStatus();

  useSimulationAbandonTracking(simulationCompletedRef);

  const validItems = useMemo(() => items.filter((i) => i.hours > 0), [items]);
  const canSimulate = projectName.trim().length > 0 && validItems.length > 0;

  const openUpgradeModal = () => setUpgradeModalOpen(true);

  // Free hanya menghitung biaya dasar: pengali, jam fokus kustom, dan
  // deadline adalah fitur Pro. Memaksa nilai efektif ke default di sini
  // (bukan di simulator.ts yang terkunci) menjaga data item apa adanya di
  // state — hanya hasil hitungnya yang disederhanakan untuk Free.
  const effectiveItems = useMemo<EstimateItem[]>(
    () =>
      isPro
        ? items
        : items.map((item) => ({
            ...item,
            complexity: DEFAULT_COMPLEXITY,
            experience: DEFAULT_EXPERIENCE,
            revisionCount: DEFAULT_REVISION_COUNT,
          })),
    [items, isPro],
  );
  const effectiveFocusHoursPerDay = isPro ? focusHoursPerDay : DEFAULT_FOCUS_HOURS_PER_DAY;
  const effectiveDeadlineDays = isPro ? deadlineDays : undefined;

  // Kalkulasi langsung — diperbarui pada setiap ketikan, tanpa menunggu tombol.
  const result = useMemo(
    () =>
      simulate(effectiveItems, {
        focusHoursPerDay: effectiveFocusHoursPerDay,
        deadlineDays: effectiveDeadlineDays,
      }),
    [effectiveItems, effectiveFocusHoursPerDay, effectiveDeadlineDays],
  );

  const rigidDimensionLabel = useMemo(
    () =>
      FLEXIBLE_DIMENSIONS.filter((dimension) => dimension !== flexibleDimension)
        .map((dimension) => FLEXIBLE_DIMENSION_LABELS[dimension])
        .join(" & "),
    [flexibleDimension],
  );

  const baselineComparison = useMemo<BaselineComparison | null>(
    () => (baseline ? compareToBaseline(baseline, result) : null),
    [baseline, result],
  );

  const baselineConflict = useMemo<BaselineConflict | null>(
    () => (baseline ? detectBaselineConflict(baseline, result, flexibleDimension) : null),
    [baseline, result, flexibleDimension],
  );

  // Mencatat satu entri Change Log — tidak melakukan apa-apa kalau Baseline
  // belum dikunci, sesuai aturan: perubahan sebelum Baseline tidak dicatat.
  const logChange = (
    field: ChangeLogField,
    description: string,
    before: SimulationResult,
    after: SimulationResult,
  ) => {
    if (!baseline) return;
    setChangeLog((prev) => [createChangeLogEntry(field, description, before, after), ...prev]);
  };

  // Placeholder contoh yang berganti untuk memberi inspirasi.
  useEffect(() => {
    const id = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length),
      2600,
    );
    return () => clearInterval(id);
  }, []);

  const updateItem = (id: string, patch: Partial<EstimateItem>) => {
    const before = items.find((i) => i.id === id);
    const newItems = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    if (baseline && before) {
      const after = newItems.find((i) => i.id === id)!;
      const beforeResult = result;
      const afterResult = simulate(newItems, { focusHoursPerDay, deadlineDays });
      for (const key of Object.keys(patch) as (keyof EstimateItem)[]) {
        const change = describeItemChange(key, before, after);
        if (change) logChange(change.field, change.description, beforeResult, afterResult);
      }
    }
    setItems(newItems);
    setShowResult(false);
  };

  const setName = (value: string) => {
    setProjectName(value);
    setShowResult(false);
  };

  const addItem = () => {
    const newItem = makeItem();
    const newItems = [...items, newItem];
    if (baseline) {
      const afterResult = simulate(newItems, { focusHoursPerDay, deadlineDays });
      logChange("item_added", "Pekerjaan baru ditambahkan.", result, afterResult);
    }
    setItems(newItems);
    setShowResult(false);
  };

  const removeItem = (id: string) => {
    const removedItem = items.find((i) => i.id === id);
    const newItems = items.filter((i) => i.id !== id);
    if (baseline) {
      const afterResult = simulate(newItems, { focusHoursPerDay, deadlineDays });
      const label = removedItem?.name.trim() || "Pekerjaan";
      logChange("item_removed", `Pekerjaan "${label}" dihapus.`, result, afterResult);
    }
    setItems(newItems);
    setShowResult(false);
  };

  const handleFlexibleDimensionChange = (value: FlexibleDimension) => {
    if (!isPro) return;
    if (value === flexibleDimension) return;
    if (baseline) {
      logChange(
        "flexible_dimension",
        `Dimensi fleksibel diubah dari ${FLEXIBLE_DIMENSION_LABELS[flexibleDimension]} menjadi ${FLEXIBLE_DIMENSION_LABELS[value]}.`,
        result,
        result,
      );
    }
    setFlexibleDimension(value);
  };

  const handleFocusHoursChange = (value: number) => {
    if (!isPro) return;
    if (baseline) {
      const afterResult = simulate(items, { focusHoursPerDay: value, deadlineDays });
      logChange(
        "focus_hours_per_day",
        `Jam fokus per hari diubah dari ${focusHoursPerDay} jam menjadi ${value} jam.`,
        result,
        afterResult,
      );
    }
    setFocusHoursPerDay(value);
  };

  const handleDeadlineChange = (value: number | undefined) => {
    if (!isPro) return;
    if (baseline) {
      const afterResult = simulate(items, { focusHoursPerDay, deadlineDays: value });
      const beforeLabel = deadlineDays ? `${deadlineDays} hari` : "tidak ada";
      const afterLabel = value ? `${value} hari` : "tidak ada";
      logChange(
        "deadline_days",
        `Deadline diubah dari ${beforeLabel} menjadi ${afterLabel}.`,
        result,
        afterResult,
      );
    }
    setDeadlineDays(value);
  };

  const handleLockBaseline = () => {
    if (!isPro) return;
    setBaseline(createBaselineSnapshot(projectName, result, flexibleDimension, deadlineDays));
    setChangeLog([]);
  };

  const handleResetBaseline = () => {
    if (!isPro) return;
    setBaseline(null);
    setChangeLog([]);
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
      buildShareCardData({
        projectName,
        result,
        riskLabel: RISK_LABELS[result.riskLevel],
        baseline: baseline ?? undefined,
        comparison: baselineComparison ?? undefined,
      }),
    [projectName, result, baseline, baselineComparison],
  );

  const shareInput = useMemo(
    () => ({
      projectName,
      durationLabel: result.durationLabel,
      workingDays: result.workingDays,
      totalCost: result.totalCost,
      scaleLabel: result.projectSummary.scaleLabel,
      recommendation: result.projectSummary.recommendation,
      items: result.items
        .filter((item) => item.baseHours > 0)
        .map((item) => ({
          name: item.name,
          baseHours: item.baseHours,
          adjustedHours: item.adjustedHours,
        })),
      baseline: baseline
        ? {
            totalCost: baseline.totalCost,
            durationLabel: baseline.durationLabel,
            workingDays: baseline.workingDays,
          }
        : undefined,
      comparison: baselineComparison ?? undefined,
      healthScore: result.health.score,
      healthBandLabel: result.health.bandLabel,
      riskLabel: RISK_LABELS[result.riskLevel],
      insight: result.insight,
      flexibleDimensionLabel: FLEXIBLE_DIMENSION_LABELS[flexibleDimension],
      focusHoursPerDay,
      deadlineDays,
    }),
    [
      projectName,
      result,
      baseline,
      baselineComparison,
      flexibleDimension,
      focusHoursPerDay,
      deadlineDays,
    ],
  );

  const handleCopySummary = async () => {
    if (!isPro) {
      openUpgradeModal();
      return;
    }
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
    if (!isPro) {
      openUpgradeModal();
      return;
    }
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
    setFlexibleDimension(DEFAULT_FLEXIBLE_DIMENSION);
    setFocusHoursPerDay(DEFAULT_FOCUS_HOURS_PER_DAY);
    setDeadlineDays(undefined);
    setBaseline(null);
    setChangeLog([]);
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
                value={<AnimatedNumber value={validItems.length} />}
              />
              <SummaryStat
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Total jam"
                value={result.totalHours > 0 ? <AnimatedNumber value={result.totalHours} /> : "—"}
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

        {isPro && proRecord && (
          <div className="border-t border-border/60 bg-success/10 px-5 py-1.5 text-center text-xs font-semibold text-success">
            Pro aktif selamanya
          </div>
        )}
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

        {/* Pengaturan simulasi — dimensi fleksibel, jam fokus, dan deadline opsional (Pro) */}
        {isPro ? (
          <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <h2 className="text-sm font-semibold">Pengaturan Simulasi</h2>

            <div className="mt-3">
              <span className="text-xs font-medium text-muted-foreground">
                Mana yang fleksibel?
              </span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {FLEXIBLE_DIMENSIONS.map((dimension) => (
                  <button
                    key={dimension}
                    type="button"
                    onClick={() => handleFlexibleDimensionChange(dimension)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      flexibleDimension === dimension
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {FLEXIBLE_DIMENSION_LABELS[dimension]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {FLEXIBLE_DIMENSION_LABELS[flexibleDimension]} fleksibel · {rigidDimensionLabel}{" "}
                kaku
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Jam fokus per hari
                </span>
                <span className="text-xs font-semibold">{focusHoursPerDay} jam</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={focusHoursPerDay}
                onChange={(e) => handleFocusHoursChange(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
                aria-label="Jam fokus per hari"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Bagaimana jika Anda hanya fokus {focusHoursPerDay} jam/hari?
              </p>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-medium text-muted-foreground">
                Deadline klien (opsional, hari kerja)
              </span>
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={deadlineDays ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw.trim() === "") {
                    handleDeadlineChange(undefined);
                    return;
                  }
                  const n = Number(raw);
                  // Deadline hanya bermakna sebagai hari kerja BULAT — pecahan
                  // dibulatkan ke hari terdekat, dan nilai yang sudah
                  // dibulatkan ditampilkan kembali di input (tidak ada nilai
                  // pecahan yang tersimpan diam-diam).
                  handleDeadlineChange(Number.isFinite(n) && n > 0 ? Math.round(n) : undefined);
                }}
                placeholder="Misal 5"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none transition-shadow placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring"
              />
            </label>
          </section>
        ) : (
          <section className="mt-4 rounded-2xl border border-dashed border-primary/40 bg-accent/30 p-5 text-center shadow-card sm:p-6">
            <h2 className="text-sm font-semibold">Pengaturan Simulasi — Pro</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pemilih dimensi fleksibel, slider jam fokus per hari, dan deadline klien tersedia di
              ESTIMO Pro.
            </p>
            <button
              type="button"
              onClick={openUpgradeModal}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Upgrade ke Pro
            </button>
          </section>
        )}

        {/* Daftar pekerjaan */}
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">Daftar Pekerjaan</h2>
            {items.length > 0 && (
              <span className="text-xs text-muted-foreground">{validItems.length} dihitung</span>
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
                          updateItem(item.id, { hours: parseNonNegative(e.target.value) })
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
                          updateItem(item.id, { rate: parseNonNegative(e.target.value) })
                        }
                        placeholder="Rp0"
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none transition-shadow placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring"
                      />
                    </label>
                  </div>

                  {isPro ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">
                          Kompleksitas
                        </span>
                        <select
                          value={item.complexity ?? DEFAULT_COMPLEXITY}
                          onChange={(e) =>
                            updateItem(item.id, {
                              complexity: e.target.value as ComplexityLevel,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                        >
                          {COMPLEXITY_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">
                          Pengalaman
                        </span>
                        <select
                          value={item.experience ?? DEFAULT_EXPERIENCE}
                          onChange={(e) =>
                            updateItem(item.id, {
                              experience: e.target.value as ExperienceLevel,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                        >
                          {EXPERIENCE_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">Revisi</span>
                        <select
                          value={revisionSelectValue(item.revisionCount)}
                          onChange={(e) =>
                            updateItem(item.id, {
                              revisionCount: parseRevisionCount(e.target.value),
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                        >
                          {REVISION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openUpgradeModal}
                      className="mt-3 flex w-full items-center justify-between rounded-lg border border-dashed border-input px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <span>Kompleksitas, pengalaman & revisi — Pro</span>
                      <span className="font-semibold text-primary">Upgrade</span>
                    </button>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      Estimasi biaya
                    </span>
                    <span className="font-display text-sm font-bold">
                      {isPro
                        ? itemCost(item) > 0
                          ? formatMoney(itemCost(item))
                          : "—"
                        : item.hours * item.rate > 0
                          ? formatMoney(item.hours * item.rate)
                          : "—"}
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
              flexibleDimension={flexibleDimension}
              rigidDimensionLabel={rigidDimensionLabel}
              deadlineDays={effectiveDeadlineDays}
              baseline={baseline}
              changeLog={changeLog}
              baselineComparison={baselineComparison}
              baselineConflict={baselineConflict}
              onLockBaseline={handleLockBaseline}
              onResetBaseline={handleResetBaseline}
              isPro={isPro}
              onOpenUpgrade={openUpgradeModal}
            />
          </div>
        )}
      </main>

      {showResult && <ShareCardExportPortal cardRef={shareCardRef} data={shareCardData} />}

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
                {isPro ? (
                  <Copy className="h-4 w-4 shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0" />
                )}
                <span className="leading-none sm:hidden">Salin</span>
                <span className="hidden leading-none sm:inline">
                  Salin Ringkasan{!isPro && " (Pro)"}
                </span>
              </button>
              <button
                onClick={handleShareResult}
                disabled={isSharingCard}
                className="inline-flex flex-col items-center justify-center gap-1 rounded-xl border border-input bg-background px-2 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm"
              >
                {isPro ? (
                  <Share2 className="h-4 w-4 shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0" />
                )}
                <span className="leading-none">Bagikan{!isPro && " (Pro)"}</span>
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

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        isPro={isPro}
        proRecord={proRecord}
        onActivate={activatePro}
      />
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
  flexibleDimension,
  rigidDimensionLabel,
  deadlineDays,
  baseline,
  changeLog,
  baselineComparison,
  baselineConflict,
  onLockBaseline,
  onResetBaseline,
  isPro,
  onOpenUpgrade,
}: {
  projectName: string;
  result: ReturnType<typeof simulate>;
  onCopySummary: () => void;
  flexibleDimension: FlexibleDimension;
  rigidDimensionLabel: string;
  deadlineDays?: number;
  baseline: BaselineSnapshot | null;
  changeLog: ChangeLogEntry[];
  baselineComparison: BaselineComparison | null;
  baselineConflict: BaselineConflict | null;
  onLockBaseline: () => void;
  onResetBaseline: () => void;
  isPro: boolean;
  onOpenUpgrade: () => void;
}) {
  const hasDeadline = typeof deadlineDays === "number" && deadlineDays > 0;
  const isOverDeadline = hasDeadline && result.workingDays > deadlineDays;
  const hasConflict = Boolean(
    baseline && baselineConflict && baselineConflict.movedDimensions.length > 0,
  );

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Estimasi untuk
        </p>
        <h2 className="truncate text-xl font-bold">{projectName}</h2>
        {isPro && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {FLEXIBLE_DIMENSION_LABELS[flexibleDimension]} fleksibel · {rigidDimensionLabel} kaku
          </p>
        )}
      </div>

      {isPro && !baseline && (
        <div className="mb-4 rounded-2xl border border-dashed border-primary/40 bg-accent/40 p-4">
          <p className="text-sm font-semibold">Kunci Baseline untuk melacak perubahan</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Setelah dikunci, setiap perubahan tercatat di Change Log dan dibandingkan dengan
            Baseline ini.
          </p>
          <button
            type="button"
            onClick={onLockBaseline}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Kunci Baseline
          </button>
        </div>
      )}

      {isPro && hasConflict && baselineConflict && (
        <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">
            {baselineConflict.movedDimensions
              .map((dimension) => FLEXIBLE_DIMENSION_LABELS[dimension])
              .join(" & ")}{" "}
            bergerak dari Baseline
          </p>
          <p className="mt-1 text-xs text-destructive/80">
            {FLEXIBLE_DIMENSION_LABELS[flexibleDimension]} dipilih sebagai dimensi fleksibel, jadi
            perubahan ini seharusnya diserap lewat penyesuaian{" "}
            {FLEXIBLE_DIMENSION_LABELS[flexibleDimension]} — bukan membiarkan{" "}
            {baselineConflict.movedDimensions
              .map((dimension) => FLEXIBLE_DIMENSION_LABELS[dimension])
              .join(" & ")}{" "}
            bergeser diam-diam.
          </p>
        </div>
      )}

      {isPro && baseline && baselineComparison && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Baseline vs Skenario
            </p>
            <button
              type="button"
              onClick={onResetBaseline}
              className="shrink-0 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Mulai Ulang Baseline
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Baseline</p>
              <p className="mt-1 font-display text-base font-bold tracking-tight">
                {formatMoney(baseline.totalCost)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatHoursLabel(baseline.totalHours)} · {baseline.durationLabel} ·{" "}
                {baseline.workingDays} hari kerja
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Skenario saat ini</p>
              <p className="mt-1 font-display text-base font-bold tracking-tight">
                {formatMoney(result.totalCost)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatHoursLabel(result.totalHours)} · {result.durationLabel} ·{" "}
                {result.workingDays} hari kerja
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <DeltaBadge
              zeroLabel="Jam tetap"
              value={baselineComparison.hoursDelta}
              formatValue={(v) => formatHoursLabel(v)}
            />
            <DeltaBadge
              zeroLabel="Biaya tetap"
              value={baselineComparison.costDelta}
              formatValue={(v) => formatMoney(v)}
            />
            <DeltaBadge
              zeroLabel="Hari kerja tetap"
              value={baselineComparison.workingDaysDelta}
              formatValue={(v) => `${v} hari kerja`}
            />
          </div>
        </div>
      )}

      {isPro && baseline && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Change Log
          </p>
          {changeLog.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Belum ada perubahan sejak Baseline dikunci.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {changeLog.map((entry) => (
                <li
                  key={entry.id}
                  className="border-t border-border/60 pt-3 first:border-t-0 first:pt-0"
                >
                  <p className="text-sm font-medium">{entry.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatHoursLabel(entry.before.totalHours)} →{" "}
                    {formatHoursLabel(entry.after.totalHours)} ·{" "}
                    {formatMoney(entry.before.totalCost)} → {formatMoney(entry.after.totalCost)} ·{" "}
                    {entry.before.durationLabel} → {entry.after.durationLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Risiko: {RISK_LABELS[entry.before.riskLevel]} →{" "}
                    {RISK_LABELS[entry.after.riskLevel]}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Total jam"
          value={formatHoursLabel(result.totalHours)}
          hint={
            isPro
              ? `Dasar ${formatHoursLabel(result.baseHours)} · disesuaikan ${formatHoursLabel(result.totalHours)}`
              : "Jam kerja yang Anda masukkan."
          }
        />
        <StatCard
          icon={<CalendarRange className="h-4 w-4" />}
          label="Estimasi durasi"
          value={result.durationLabel}
          hint={`${formatHoursLabel(result.totalHours)} kerja · ${result.workingDays} hari`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Estimasi biaya"
          value={formatMoney(result.totalCost)}
          hint={`Rata-rata ${formatMoney(result.averageRate)} per jam`}
          highlight
        />
      </div>

      {isPro && hasDeadline && (
        <div className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Durasi vs deadline
          </p>
          <p className="mt-2 font-display text-lg font-bold tracking-tight">
            {result.workingDays} hari kerja · deadline {deadlineDays} hari
          </p>
          <p
            className={`mt-1 text-sm ${isOverDeadline ? "text-destructive" : "text-muted-foreground"}`}
          >
            {isOverDeadline
              ? `Lebih lambat ${result.workingDays - deadlineDays} hari dari deadline.`
              : "Estimasi masih sesuai atau lebih cepat dari deadline."}
          </p>
        </div>
      )}

      {isPro && result.items.some((item) => item.baseHours > 0) && (
        <div className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Jam dasar vs jam disesuaikan
          </p>
          <ul className="mt-3 space-y-2">
            {result.items
              .filter((item) => item.baseHours > 0)
              .map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium">
                    {item.name.trim() || "Pekerjaan"}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatHoursLabel(item.baseHours)} → {formatHoursLabel(item.adjustedHours)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {isPro ? (
        <div className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Buffer
          </p>
          <p className="mt-2 font-display text-lg font-bold tracking-tight">
            +{formatHoursLabel(result.bufferHours)} · ideal {formatHoursLabel(result.idealHours)}
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {result.bufferReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-primary/40 bg-accent/30 p-5 text-center shadow-card">
          <p className="text-sm font-semibold">Baseline, Buffer, Health Score & Insight — Pro</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Kunci Baseline, lihat alasan buffer waktu, dan dapatkan Health Score dengan Insight
            begitu Anda upgrade.
          </p>
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Upgrade ke Pro
          </button>
        </div>
      )}

      <ProjectSummaryCard
        summary={result.projectSummary}
        health={isPro ? result.health : undefined}
        riskLabel={isPro ? RISK_LABELS[result.riskLevel] : undefined}
        insight={isPro ? result.insight : undefined}
        onCopySummary={onCopySummary}
        isPro={isPro}
      />
    </div>
  );
}

function DeltaBadge({
  zeroLabel,
  value,
  formatValue,
}: {
  zeroLabel: string;
  value: number;
  formatValue: (value: number) => string;
}) {
  if (value === 0) {
    return (
      <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        {zeroLabel}
      </span>
    );
  }

  const sign = value > 0 ? "+" : "−";

  return (
    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
      {sign}
      {formatValue(Math.abs(value))}
    </span>
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
