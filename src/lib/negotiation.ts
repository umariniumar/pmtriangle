import type { FlexibleDimension } from "@/lib/simulator";

// Model Cabang Nego — Bagian 5 dari spesifikasi "ESTIMO — Model Perhitungan
// Scope, Waktu, dan Biaya (Cabang Nego)" (27 Okt 2026). Terpisah TOTAL dari
// src/lib/simulator.ts: mesin lama (pengali, adjustedHours, Health Score,
// Baseline, dll) tidak disentuh sama sekali. Modul ini hanya mengonsumsi jam
// yang sudah disesuaikan (Hj, dari ItemSimulation.adjustedHours) dan tarif
// normal (Rnj, dari ItemSimulation.rate — field yang sudah ada), ditambah
// tarif lembur (Ro) dan jam normal per hari (Cn) yang baru di tugas ini.
// Hasilnya adalah rencana terpisah dengan hitungannya sendiri — TIDAK
// disatukan dengan hasil simulate() yang sudah ada.

export interface NegotiationItemInput {
  id: string;
  name: string;
  /** Hj — jam yang sudah disesuaikan (dari ItemSimulation.adjustedHours). */
  adjustedHours: number;
  /** Rnj — tarif normal per jam (dari ItemSimulation.rate, field yang sudah ada). */
  normalRate: number;
  /** Roj — tarif lembur per jam. undefined = belum diisi pengguna (Bagian 4.2, 5.5). */
  overtimeRate?: number;
}

export interface NegotiationInput {
  items: NegotiationItemInput[];
  /** Cn — jam normal per hari untuk proyek ini (Bagian 4.1). */
  normalHoursPerDay: number;
  /** Dc — deadline klien, hari kerja (dari deadline yang sudah ada). */
  deadlineDays?: number;
  /** Bc — budget klien, Rupiah (Bagian 4.3). */
  budgetRupiah?: number;
  flexibleDimension: FlexibleDimension;
}

export interface OvertimeItemBreakdown {
  id: string;
  name: string;
  normalHours: number;
  overtimeHours: number;
  /** null = belum final — overtimeHours > 0 tapi Ro item ini masih kosong (Bagian 5.5). */
  cost: number | null;
}

export interface OvertimeSplit {
  /** O — jam lembur total. */
  overtimeHoursTotal: number;
  /** N — jam normal yang dipakai. */
  normalHoursUsed: number;
  /** s — proporsi lembur (0 kalau H = 0). */
  overtimeProportion: number;
  perItem: OvertimeItemBreakdown[];
  /** null kalau salah satu item di atas belum final. */
  totalCost: number | null;
  missingOvertimeItemIds: string[];
}

function totalAdjustedHours(items: NegotiationItemInput[]): number {
  return items.reduce((sum, item) => sum + item.adjustedHours, 0);
}

// Biaya normal proyek (tanpa lembur sama sekali) — jumlah Hj × Rnj. Tidak
// pernah butuh Ro, jadi selalu final berapa pun status tarif lembur.
export function normalCostOf(items: NegotiationItemInput[]): number {
  return items.reduce((sum, item) => sum + item.adjustedHours * item.normalRate, 0);
}

// Bagian 5.1 — jam normal, jam lembur, dan pembagian proporsional per
// pekerjaan, untuk target hari D (bisa Dn atau Dc tergantung cabang).
export function computeOvertimeSplit(
  items: NegotiationItemInput[],
  targetDays: number,
  normalHoursPerDay: number,
): OvertimeSplit {
  const totalHours = totalAdjustedHours(items);
  const normalAvailable = targetDays * normalHoursPerDay;
  const overtimeHoursTotal = Math.max(0, totalHours - normalAvailable);
  const normalHoursUsed = totalHours - overtimeHoursTotal;
  const overtimeProportion = totalHours > 0 ? overtimeHoursTotal / totalHours : 0;

  const missingOvertimeItemIds: string[] = [];
  const perItem: OvertimeItemBreakdown[] = items.map((item) => {
    const normalHours = item.adjustedHours * (1 - overtimeProportion);
    const overtimeHours = item.adjustedHours * overtimeProportion;
    let cost: number | null;
    if (overtimeHours > 0 && item.overtimeRate === undefined) {
      cost = null;
      missingOvertimeItemIds.push(item.id);
    } else {
      cost = normalHours * item.normalRate + overtimeHours * (item.overtimeRate ?? 0);
    }
    return { id: item.id, name: item.name, normalHours, overtimeHours, cost };
  });

  const totalCost = perItem.some((p) => p.cost === null)
    ? null
    : perItem.reduce((sum, p) => sum + (p.cost as number), 0);

  return {
    overtimeHoursTotal,
    normalHoursUsed,
    overtimeProportion,
    perItem,
    totalCost,
    missingOvertimeItemIds,
  };
}

// Bagian 5.3 — tarif lembur rata-rata tertimbang (hanya dipakai untuk
// menghitung scope maksimal di Cabang 4). null kalau H = 0 atau ada Ro yang
// masih kosong di salah satu pekerjaan — rumus ini butuh SEMUA Ro terisi.
function weightedOvertimeRate(items: NegotiationItemInput[], totalHours: number): number | null {
  if (totalHours <= 0) return null;
  if (items.some((item) => item.overtimeRate === undefined)) return null;
  const sum = items.reduce(
    (acc, item) => acc + item.adjustedHours * (item.overtimeRate as number),
    0,
  );
  return sum / totalHours;
}

export interface NormalPlan {
  kind: "normal";
  days: number; // Dn
  cost: number; // selalu final — tidak pernah butuh Ro
  quality: "excellent";
}

// Cabang 1 — Rencana Normal (selalu ditampilkan).
export function buildNormalPlan(
  items: NegotiationItemInput[],
  normalHoursPerDay: number,
): NormalPlan {
  const totalHours = totalAdjustedHours(items);
  const days = totalHours > 0 ? Math.ceil(totalHours / normalHoursPerDay) : 0;
  return { kind: "normal", days, cost: normalCostOf(items), quality: "excellent" };
}

export interface DeadlinePlan {
  kind: "deadline";
  days: number; // Dc
  hoursPerDayNeeded: number;
  split: OvertimeSplit;
  speedPremium: number | null;
  budgetShortfall: number | null; // null kalau Bc tidak diisi, atau split belum final
}

// Cabang 2 — Kejar Deadline (butuh Dc).
export function buildDeadlinePlan(
  items: NegotiationItemInput[],
  normalHoursPerDay: number,
  deadlineDays: number,
  budgetRupiah: number | undefined,
): DeadlinePlan {
  const totalHours = totalAdjustedHours(items);
  const hoursPerDayNeeded = deadlineDays > 0 ? totalHours / deadlineDays : 0;
  const split = computeOvertimeSplit(items, deadlineDays, normalHoursPerDay);
  const speedPremium = split.totalCost === null ? null : split.totalCost - normalCostOf(items);
  const budgetShortfall =
    budgetRupiah === undefined || split.totalCost === null ? null : split.totalCost - budgetRupiah;
  return {
    kind: "deadline",
    days: deadlineDays,
    hoursPerDayNeeded,
    split,
    speedPremium,
    budgetShortfall,
  };
}

export interface BudgetPlan {
  kind: "budget";
  scopeMaxHours: number;
  days: number;
  scopeCutHours: number;
  cost: number;
  fullScopeFits: boolean;
}

// Cabang 3 — Patuhi Budget, waktu boleh longgar (butuh Bc). Tanpa lembur.
export function buildBudgetPlan(
  items: NegotiationItemInput[],
  normalHoursPerDay: number,
  budgetRupiah: number,
): BudgetPlan {
  const totalHours = totalAdjustedHours(items);
  const weightedNormalRate = totalHours > 0 ? normalCostOf(items) / totalHours : 0;
  const rawScopeMax = weightedNormalRate > 0 ? budgetRupiah / weightedNormalRate : 0;
  const fullScopeFits = rawScopeMax >= totalHours;
  const scopeMaxHours = fullScopeFits ? totalHours : rawScopeMax;
  const days = scopeMaxHours > 0 ? Math.ceil(scopeMaxHours / normalHoursPerDay) : 0;
  const scopeCutHours = fullScopeFits ? 0 : totalHours - scopeMaxHours;
  const cost = fullScopeFits ? normalCostOf(items) : budgetRupiah;
  return { kind: "budget", scopeMaxHours, days, scopeCutHours, cost, fullScopeFits };
}

export interface DeadlineAndBudgetPlan {
  kind: "deadline_and_budget";
  days: number; // Dc
  pending: boolean; // true kalau butuh tarif lembur rata-rata tertimbang yang belum bisa dihitung
  scopeMaxHours: number | null;
  scopeCutHours: number | null;
  scopeCutPercent: number | null;
  cost: number | null;
  fullScopeFits: boolean | null;
}

// Cabang 4 — Patuhi Deadline DAN Budget (butuh Dc dan Bc).
export function buildDeadlineAndBudgetPlan(
  items: NegotiationItemInput[],
  normalHoursPerDay: number,
  deadlineDays: number,
  budgetRupiah: number,
): DeadlineAndBudgetPlan {
  const totalHours = totalAdjustedHours(items);
  const normalCapacityHours = deadlineDays * normalHoursPerDay;
  const weightedNormalRate = totalHours > 0 ? normalCostOf(items) / totalHours : 0;
  const normalCapacityCost = normalCapacityHours * weightedNormalRate;

  if (budgetRupiah <= normalCapacityCost) {
    const rawScopeMax = weightedNormalRate > 0 ? budgetRupiah / weightedNormalRate : 0;
    const fullScopeFits = rawScopeMax >= totalHours;
    const scopeMaxHours = fullScopeFits ? totalHours : rawScopeMax;
    const scopeCutHours = fullScopeFits ? 0 : totalHours - scopeMaxHours;
    const scopeCutPercent = totalHours > 0 ? (scopeCutHours / totalHours) * 100 : 0;
    // Tidak ada lembur di jalur ini (scopeMax selalu <= kapasitas normal), jadi selalu final.
    const cost = fullScopeFits
      ? computeOvertimeSplit(items, deadlineDays, normalHoursPerDay).totalCost
      : budgetRupiah;
    return {
      kind: "deadline_and_budget",
      days: deadlineDays,
      pending: false,
      scopeMaxHours,
      scopeCutHours,
      scopeCutPercent,
      cost,
      fullScopeFits,
    };
  }

  const wOvertimeRate = weightedOvertimeRate(items, totalHours);
  if (wOvertimeRate === null) {
    return {
      kind: "deadline_and_budget",
      days: deadlineDays,
      pending: true,
      scopeMaxHours: null,
      scopeCutHours: null,
      scopeCutPercent: null,
      cost: null,
      fullScopeFits: null,
    };
  }

  const extraBudget = budgetRupiah - normalCapacityCost;
  const extraHours = wOvertimeRate > 0 ? extraBudget / wOvertimeRate : 0;
  const rawScopeMax = normalCapacityHours + extraHours;
  const fullScopeFits = rawScopeMax >= totalHours;
  const scopeMaxHours = fullScopeFits ? totalHours : rawScopeMax;
  const scopeCutHours = fullScopeFits ? 0 : totalHours - scopeMaxHours;
  const scopeCutPercent = totalHours > 0 ? (scopeCutHours / totalHours) * 100 : 0;
  const cost = fullScopeFits
    ? computeOvertimeSplit(items, deadlineDays, normalHoursPerDay).totalCost
    : budgetRupiah;

  return {
    kind: "deadline_and_budget",
    days: deadlineDays,
    pending: false,
    scopeMaxHours,
    scopeCutHours,
    scopeCutPercent,
    cost,
    fullScopeFits,
  };
}

export interface ScopeConflictWarning {
  kind: "conflict_warning";
  fullScopeHours: number;
  deadlineDays: number;
  budgetRupiah: number;
  /** Biaya penuh kejar deadline — null kalau belum final (Ro kosong). */
  deadlineCost: number | null;
  /** Batas bawah biaya (tanpa lembur sama sekali) — selalu final. */
  minimumPossibleCost: number;
}

// Cabang 5 — Pertahankan Scope, Deadline, DAN Budget (PERINGATAN).
// Ditampilkan hanya kalau konflik TERKONFIRMASI: biaya kejar-deadline penuh
// (kalau sudah final) ATAU batas bawah biaya tanpa lembur sama sekali sudah
// melebihi Bc. Kalau belum terkonfirmasi (menunggu Ro), tidak ditampilkan —
// konsisten dengan "cabang yang datanya tidak lengkap tidak ditampilkan".
export function buildScopeConflictWarning(
  items: NegotiationItemInput[],
  normalHoursPerDay: number,
  deadlineDays: number,
  budgetRupiah: number,
): ScopeConflictWarning | null {
  const fullScopeHours = totalAdjustedHours(items);
  const deadlineSplit = computeOvertimeSplit(items, deadlineDays, normalHoursPerDay);
  const minimumPossibleCost = normalCostOf(items);

  const confirmed =
    (deadlineSplit.totalCost !== null && deadlineSplit.totalCost > budgetRupiah) ||
    minimumPossibleCost > budgetRupiah;

  if (!confirmed) return null;

  return {
    kind: "conflict_warning",
    fullScopeHours,
    deadlineDays,
    budgetRupiah,
    deadlineCost: deadlineSplit.totalCost,
    minimumPossibleCost,
  };
}

export interface NegotiationPlans {
  normal: NormalPlan;
  deadline?: DeadlinePlan;
  budget?: BudgetPlan;
  deadlineAndBudget?: DeadlineAndBudgetPlan;
  conflictWarning?: ScopeConflictWarning;
}

// Bagian 5.4 — selalu mulai dari Cabang 1, lalu cabang yang datanya sudah
// lengkap. Cabang yang datanya tidak lengkap (Dc/Bc kosong) tidak dibangun
// sama sekali di sini — bukan ditampilkan lalu disembunyikan di UI.
export function buildNegotiationPlans(input: NegotiationInput): NegotiationPlans {
  const { items, normalHoursPerDay, deadlineDays, budgetRupiah } = input;

  const plans: NegotiationPlans = {
    normal: buildNormalPlan(items, normalHoursPerDay),
  };

  if (deadlineDays !== undefined && deadlineDays > 0) {
    plans.deadline = buildDeadlinePlan(items, normalHoursPerDay, deadlineDays, budgetRupiah);
  }

  if (budgetRupiah !== undefined && budgetRupiah > 0) {
    plans.budget = buildBudgetPlan(items, normalHoursPerDay, budgetRupiah);
  }

  if (
    deadlineDays !== undefined &&
    deadlineDays > 0 &&
    budgetRupiah !== undefined &&
    budgetRupiah > 0
  ) {
    plans.deadlineAndBudget = buildDeadlineAndBudgetPlan(
      items,
      normalHoursPerDay,
      deadlineDays,
      budgetRupiah,
    );
    const warning = buildScopeConflictWarning(items, normalHoursPerDay, deadlineDays, budgetRupiah);
    if (warning) plans.conflictWarning = warning;
  }

  return plans;
}

// Bagian 5.6 — percobaan Free dipakai hanya kalau cabang yang BENAR-BENAR
// ditampilkan (bukan yang tidak lengkap datanya) semuanya final — tidak ada
// yang masih menunggu Ro. Cabang 1 tidak pernah butuh Ro, jadi selalu final.
export function allShownPlansFinal(plans: NegotiationPlans): boolean {
  if (plans.deadline && plans.deadline.split.totalCost === null) return false;
  if (plans.deadlineAndBudget && plans.deadlineAndBudget.pending) return false;
  return true;
}

// Dimensi fleksibel menentukan cabang mana yang disorot sebagai rekomendasi
// (Bagian 5.4, "Peran pemilih dimensi fleksibel") — murni penekanan visual
// dan label, tidak mengubah angka cabang mana pun.
export type RecommendedPlanKind = "normal" | "deadline" | "deadlineAndBudget";

export function recommendedPlanKind(flexibleDimension: FlexibleDimension): RecommendedPlanKind {
  if (flexibleDimension === "scope") return "deadlineAndBudget";
  if (flexibleDimension === "cost") return "deadline";
  return "normal";
}
