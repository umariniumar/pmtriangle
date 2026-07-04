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
  RotateCcw,
} from "lucide-react";
import {
  CURRENCIES,
  type CurrencyCode,
  type EstimateItem,
  formatMoney,
  simulate,
  FOCUS_HOURS_PER_DAY,
} from "@/lib/simulator";

export const Route = createFileRoute("/simulate")({
  head: () => ({
    meta: [
      { title: "Simulate a project — Project Decision Simulator" },
      {
        name: "description",
        content:
          "Add estimate items and simulate total hours, duration and cost for your project in minutes.",
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
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [items, setItems] = useState<EstimateItem[]>([makeItem(), makeItem()]);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const validItems = useMemo(
    () => items.filter((i) => i.hours > 0),
    [items],
  );
  const canSimulate = projectName.trim().length > 0 && validItems.length > 0;

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
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
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
    setCurrency("USD");
    setItems([makeItem(), makeItem()]);
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3.5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="font-display text-sm font-semibold">Decision Simulator</span>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            New simulation
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Name the project, list the work, and simulate the outcome.
          </p>
        </div>

        {/* Project */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Project name
          </label>
          <input
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setShowResult(false);
            }}
            placeholder="e.g. Marketing website redesign"
            className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
          />

          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Currency
            </span>
            <div className="flex gap-1 rounded-full bg-muted p-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                    setShowResult(false);
                  }}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    currency === c.code
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Estimate items */}
        <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Estimate items</h2>
            <span className="text-xs text-muted-foreground">
              {validItems.length} counted
            </span>
          </div>

          <div className="hidden grid-cols-[1fr_5.5rem_5.5rem_2rem] gap-2 px-1 pb-2 text-xs font-medium text-muted-foreground sm:grid">
            <span>Task</span>
            <span className="text-right">Hours</span>
            <span className="text-right">Rate</span>
            <span />
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[1fr_5.5rem_5.5rem_2rem]"
              >
                <input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  placeholder="Task name"
                  className="col-span-2 min-w-0 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring sm:col-span-1"
                />
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={item.hours || ""}
                  onChange={(e) =>
                    updateItem(item.id, { hours: Math.max(0, Number(e.target.value)) })
                  }
                  placeholder="Hrs"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-right text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
                />
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={item.rate || ""}
                  onChange={(e) =>
                    updateItem(item.id, { rate: Math.max(0, Number(e.target.value)) })
                  }
                  placeholder="Rate"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-right text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                  aria-label="Remove item"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-input px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </section>

        <button
          onClick={handleSimulate}
          disabled={!canSimulate}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-focus transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <Sparkles className="h-4.5 w-4.5" />
          Simulate
        </button>
        {!canSimulate && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Add a project name and at least one task with hours to simulate.
          </p>
        )}

        {showResult && (
          <div ref={resultRef} className="mt-10 scroll-mt-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Results
              projectName={projectName}
              currency={currency}
              result={result}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function Results({
  projectName,
  currency,
  result,
}: {
  projectName: string;
  currency: CurrencyCode;
  result: ReturnType<typeof simulate>;
}) {
  const riskStyles: Record<
    typeof result.riskLevel,
    { label: string; cls: string }
  > = {
    low: { label: "Low risk", cls: "bg-success/12 text-success" },
    moderate: { label: "Moderate risk", cls: "bg-warning/15 text-warning-foreground" },
    high: { label: "High risk", cls: "bg-destructive/12 text-destructive" },
  };
  const risk = riskStyles[result.riskLevel];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Simulation for
          </p>
          <h2 className="truncate text-xl font-bold">{projectName}</h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${risk.cls}`}
        >
          {risk.label}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Total hours"
          value={`${result.totalHours.toLocaleString()}h`}
          hint={`+${result.bufferHours}h suggested buffer`}
        />
        <StatCard
          icon={<CalendarRange className="h-4 w-4" />}
          label="Estimated duration"
          value={`${result.weeks} wk`}
          hint={`${result.workingDays} working days`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Estimated cost"
          value={formatMoney(result.totalCost, currency)}
          hint="Hours × rate"
          highlight
        />
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold">Recommendation</h3>
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-foreground">
          {result.recommendation}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Based on {FOCUS_HOURS_PER_DAY} focused hours/day over a 5-day week.
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
