import type { FlexibleDimension, SimulationResult } from "@/lib/simulator";

export interface BaselineItemSnapshot {
  id: string;
  name: string;
  baseHours: number;
  adjustedHours: number;
  rate: number;
}

export interface BaselineSnapshot {
  projectName: string;
  items: BaselineItemSnapshot[];
  totalHours: number;
  totalCost: number;
  durationLabel: string;
  workingDays: number;
  flexibleDimension: FlexibleDimension;
  focusHoursPerDay: number;
  deadlineDays?: number;
  createdAt: string;
}

// Mengambil snapshot Baseline dari hasil simulate() saat tombol "Kunci Baseline"
// ditekan. Snapshot ini beku — tidak berubah lagi walau input berubah setelahnya.
export function createBaselineSnapshot(
  projectName: string,
  result: SimulationResult,
  flexibleDimension: FlexibleDimension,
  deadlineDays?: number,
): BaselineSnapshot {
  return {
    projectName,
    items: result.items.map((item) => ({
      id: item.id,
      name: item.name,
      baseHours: item.baseHours,
      adjustedHours: item.adjustedHours,
      rate: item.rate,
    })),
    totalHours: result.totalHours,
    totalCost: result.totalCost,
    durationLabel: result.durationLabel,
    workingDays: result.workingDays,
    flexibleDimension,
    focusHoursPerDay: result.focusHoursPerDay,
    deadlineDays,
    createdAt: new Date().toISOString(),
  };
}

export type ChangeLogField =
  | "item_added"
  | "item_removed"
  | "base_hours"
  | "rate"
  | "complexity"
  | "experience"
  | "revision"
  | "focus_hours_per_day"
  | "deadline_days"
  | "flexible_dimension";

export interface ChangeLogMetrics {
  totalHours: number;
  totalCost: number;
  durationLabel: string;
  workingDays: number;
  riskLevel: SimulationResult["riskLevel"];
}

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  field: ChangeLogField;
  description: string;
  before: ChangeLogMetrics;
  after: ChangeLogMetrics;
}

function toChangeLogMetrics(result: SimulationResult): ChangeLogMetrics {
  return {
    totalHours: result.totalHours,
    totalCost: result.totalCost,
    durationLabel: result.durationLabel,
    workingDays: result.workingDays,
    riskLevel: result.riskLevel,
  };
}

let nextChangeLogId = 1;

// description sudah dalam bahasa awam, disusun oleh pemanggil (simulate.tsx)
// karena di sanalah konteks nama pekerjaan dan label pilihan tersedia.
export function createChangeLogEntry(
  field: ChangeLogField,
  description: string,
  before: SimulationResult,
  after: SimulationResult,
): ChangeLogEntry {
  return {
    id: `change-${nextChangeLogId++}`,
    timestamp: new Date().toISOString(),
    field,
    description,
    before: toChangeLogMetrics(before),
    after: toChangeLogMetrics(after),
  };
}

export interface BaselineComparison {
  hoursDelta: number;
  costDelta: number;
  workingDaysDelta: number;
}

// Selisih skenario saat ini terhadap Baseline, dalam angka mentah — siap
// diformat langsung oleh pemanggil (mis. formatMoney, formatHoursLabel).
export function compareToBaseline(
  baseline: BaselineSnapshot,
  result: SimulationResult,
): BaselineComparison {
  return {
    hoursDelta: result.totalHours - baseline.totalHours,
    costDelta: result.totalCost - baseline.totalCost,
    workingDaysDelta: result.workingDays - baseline.workingDays,
  };
}

export interface BaselineConflict {
  movedDimensions: FlexibleDimension[];
}

// Scope tidak punya satu angka tunggal di mesin ini, jadi dipakai total jam
// DISESUAIKAN (bukan jam dasar) sebagai proksi — ini sengaja mencakup efek
// pengali: menambah/menghapus pekerjaan, mengubah jam dasar, ATAU mengubah
// kompleksitas/pengalaman/revisi semuanya mengubah berapa banyak pekerjaan
// yang sebenarnya diminta, jadi semuanya dihitung sebagai pergeseran Scope.
// (Tugas 7 — sebelumnya memakai jam dasar saja, sehingga perubahan
// kompleksitas/revisi yang tidak mengubah jam dasar tidak pernah menandai
// Scope meski jam disesuaikan dan biaya sudah bergeser.)
function baselineTotalAdjustedHours(baseline: BaselineSnapshot): number {
  return baseline.items.reduce((sum, item) => sum + item.adjustedHours, 0);
}

// Mendeteksi dimensi kaku (bukan dimensi fleksibel yang dipilih) yang
// nilainya sudah bergeser dari Baseline. Hanya melaporkan, tidak memblokir
// atau mengubah angka apa pun.
export function detectBaselineConflict(
  baseline: BaselineSnapshot,
  result: SimulationResult,
  flexibleDimension: FlexibleDimension,
): BaselineConflict {
  const scopeMoved = result.totalHours !== baselineTotalAdjustedHours(baseline);
  const timeMoved = result.workingDays !== baseline.workingDays;
  const costMoved = result.totalCost !== baseline.totalCost;

  const movedDimensions: FlexibleDimension[] = [];
  if (flexibleDimension !== "scope" && scopeMoved) movedDimensions.push("scope");
  if (flexibleDimension !== "time" && timeMoved) movedDimensions.push("time");
  if (flexibleDimension !== "cost" && costMoved) movedDimensions.push("cost");

  return { movedDimensions };
}
