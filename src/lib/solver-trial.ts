// Percobaan gratis 1× untuk Cabang Nego (Bagian 5.6, spesifikasi "ESTIMO —
// Model Perhitungan Scope, Waktu, dan Biaya"). Sengaja dipisah dari
// src/lib/pro.ts — ini bukan validasi kode Pro atau pembayaran, hanya satu
// flag lokal "percobaan cabang nego sudah pernah dipakai di perangkat ini".
// Sama seperti pro.ts: sistem kehormatan lokal, tidak ada penegakan lintas
// perangkat/browser, dan tidak anti-reset.
const TRIAL_STORAGE_KEY = "estimo.solver.trial.v1";

export function hasUsedNegotiationTrial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TRIAL_STORAGE_KEY) === "used";
  } catch {
    return false;
  }
}

// Dipanggil hanya setelah cabang yang ditampilkan benar-benar final (lihat
// allShownPlansFinal di negotiation.ts) — bukan setiap kali tombol ditekan.
export function markNegotiationTrialUsed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRIAL_STORAGE_KEY, "used");
  } catch {
    /* localStorage tidak tersedia (mode privat, dsb.) — abaikan diam-diam */
  }
}
