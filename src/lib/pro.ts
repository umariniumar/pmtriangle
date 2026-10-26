import { useCallback, useEffect, useState } from "react";

// ESTIMO Pro — sistem kehormatan v1 (Tugas 6).
//
// Repo ini publik, jadi TIDAK ADA kata sandi, daftar kode rahasia, atau
// logika "kode valid" tersembunyi di sini. Validasi di sini HANYA mengecek
// FORMAT kode dan apakah tanggalnya kalender yang valid — bukan keasliannya.
// Sumber kebenaran pembayaran adalah dashboard Mayar (admin memverifikasi
// status Paid di sana), bukan kode ini. Tanggal YYYYMMDD di dalam kode hanya
// label penelusuran admin di spreadsheet, BUKAN tanggal kedaluwarsa yang
// dipaksakan ke masa Pro user — masa Pro selalu dihitung 30 hari sejak
// AKTIVASI (kapan pun kode itu dimasukkan), tersimpan per perangkat.
export const PRO_PRICE_RUPIAH = 20_000;
export const PRO_DURATION_DAYS = 30;

// Diputuskan Umar 26 Okt 2026 — jangan memakai nomor atau tautan lain.
export const PRO_WHATSAPP_NUMBER = "0881082110248";
export const PRO_PAYMENT_LINK_URL = "https://kodekoding.myr.id/pl/estimo-pro-30-hari";

const STORAGE_KEY = "estimo.pro.v1";

export type ProRecord = {
  code: string;
  activatedAt: string; // ISO — kapan kode ini diaktifkan di perangkat ini
  expiresAt: string; // ISO — activatedAt + PRO_DURATION_DAYS
};

export type ProState = {
  active: boolean;
  record: ProRecord | null;
};

const CODE_PATTERN = /^PRO-(\d{8})-([A-Z0-9]{4})$/;

// Hanya mengecek apakah 8 digit itu membentuk tanggal kalender yang valid
// (bulan 1-12, tanggal sesuai jumlah hari di bulan itu) — bukan pengecekan
// terhadap daftar kode asli.
function isValidDateStamp(stamp: string): boolean {
  const year = Number(stamp.slice(0, 4));
  const month = Number(stamp.slice(4, 6));
  const day = Number(stamp.slice(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isValidProCodeFormat(code: string): boolean {
  const match = CODE_PATTERN.exec(code.trim().toUpperCase());
  if (!match) return false;
  return isValidDateStamp(match[1]);
}

function readRecord(): ProRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProRecord>;
    if (!parsed.code || !parsed.activatedAt || !parsed.expiresAt) return null;
    return parsed as ProRecord;
  } catch {
    return null;
  }
}

function writeRecord(record: ProRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* localStorage tidak tersedia (mode privat, dsb.) — abaikan diam-diam */
  }
}

export function isProActive(record: ProRecord | null): boolean {
  if (!record) return false;
  const expiry = new Date(record.expiresAt).getTime();
  if (!Number.isFinite(expiry)) return false;
  return Date.now() <= expiry;
}

// Status Pro saat ini. Kalau tersimpan tapi sudah lewat tanggal kedaluwarsa,
// otomatis dianggap Free — TANPA menghapus record atau data proyek apa pun,
// hanya fitur Pro yang terkunci lagi. Record lama tetap disimpan supaya UI
// bisa menunjukkan kapan masa Pro sebelumnya berakhir.
export function getProState(): ProState {
  const record = readRecord();
  return { active: isProActive(record), record };
}

export type ActivateProResult =
  { success: true; expiresAt: string } | { success: false; error: string };

// Kode yang SAMA bisa dipakai lagi — di perangkat baru, atau di perangkat
// yang sama setelah masa Pro sebelumnya berakhir. Setiap aktivasi memberi
// PRO_DURATION_DAYS hari baru dihitung dari SAAT INI (bukan dari tanggal di
// dalam kode). Ini sistem kehormatan v1, bukan penegakan lintas perangkat.
export function activateProCode(rawCode: string): ActivateProResult {
  const code = rawCode.trim().toUpperCase();

  if (!isValidProCodeFormat(code)) {
    return {
      success: false,
      error: "Format kode tidak valid. Gunakan format PRO-YYYYMMDD-XXXX.",
    };
  }

  const activatedAt = new Date();
  const expires = new Date(activatedAt);
  expires.setDate(expires.getDate() + PRO_DURATION_DAYS);

  const record: ProRecord = {
    code,
    activatedAt: activatedAt.toISOString(),
    expiresAt: expires.toISOString(),
  };
  writeRecord(record);

  return { success: true, expiresAt: record.expiresAt };
}

export function formatProDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Pesan status untuk kasus "kode tersimpan tapi masa Pro-nya sudah lewat" —
// ditulis jelas supaya tidak terbaca seolah KODE-nya yang kedaluwarsa,
// padahal yang lewat adalah masa 30 hari yang tersimpan di perangkat ini.
export function getExpiredNotice(state: ProState): string | null {
  if (!state.record || state.active) return null;
  return `Masa Pro Anda di perangkat ini berakhir pada ${formatProDate(
    state.record.expiresAt,
  )}. Masukkan kode unlock yang sama untuk mengaktifkan ${PRO_DURATION_DAYS} hari berikutnya.`;
}

export function buildWhatsAppUnlockUrl(params: { buyerName?: string; orderId?: string }): string {
  const lines = [
    "Halo, saya sudah bayar ESTIMO Pro 30 Hari dan ingin minta kode unlock.",
    `Nama: ${params.buyerName?.trim() || "-"}`,
    `ID Order Mayar: ${params.orderId?.trim() || "-"}`,
  ];
  const text = encodeURIComponent(lines.join("\n"));
  const phone = PRO_WHATSAPP_NUMBER.replace(/^0/, "62");
  return `https://wa.me/${phone}?text=${text}`;
}

// Hook ringan — satu sumber kebenaran status Pro untuk seluruh UI. Membaca
// ulang saat tab kembali terlihat, localStorage berubah dari tab lain, atau
// setiap satu menit selama sesi aktif — supaya masa Pro yang habis saat tab
// masih terbuka ikut terdeteksi tanpa perlu reload paksa.
const RECHECK_INTERVAL_MS = 60_000;

export function useProStatus() {
  const [state, setState] = useState<ProState>(() => getProState());

  const refresh = useCallback(() => {
    setState(getProState());
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    const intervalId = window.setInterval(refresh, RECHECK_INTERVAL_MS);
    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const activate = useCallback(
    (code: string): ActivateProResult => {
      const result = activateProCode(code);
      if (result.success) refresh();
      return result;
    },
    [refresh],
  );

  return { isPro: state.active, record: state.record, activate, refresh };
}
