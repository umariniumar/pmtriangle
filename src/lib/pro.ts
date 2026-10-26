import { useCallback, useEffect, useState } from "react";

// ESTIMO Pro — sistem kehormatan v1 (Tugas 6), dikonversi ke sekali bayar
// selamanya di Tugas 7 (diputuskan Umar 26 Okt 2026).
//
// Repo ini publik, jadi TIDAK ADA kata sandi, daftar kode rahasia, atau
// logika "kode valid" tersembunyi di sini. Validasi di sini HANYA mengecek
// FORMAT kode dan apakah tanggalnya kalender yang valid — bukan keasliannya.
// Sumber kebenaran pembayaran adalah dashboard Mayar (admin memverifikasi
// status Paid di sana), bukan kode ini. Tanggal YYYYMMDD di dalam kode tetap
// dipakai admin untuk penelusuran di spreadsheet (tanggal pembayaran/
// penerbitan kode) — BUKAN tanggal kedaluwarsa. Sejak Tugas 7, Pro TIDAK
// PERNAH kedaluwarsa: begitu ada record tersimpan, Pro aktif selamanya.
export const PRO_PRICE_RUPIAH = 24_800;

// Nomor WhatsApp admin dan tautan Mayar di bawah ini sudah diputuskan Umar —
// jangan memakai nomor atau tautan lain, dan jangan mengarang URL baru di
// sini. Ganti konstanta ini hanya kalau Umar memberi nilai baru.
// PRO_PAYMENT_LINK_URL: Mayar Link Pembayaran ESTIMO Pro selamanya Rp24.800,
// diputuskan 26 Okt 2026.
export const PRO_WHATSAPP_NUMBER = "0881082110248";
export const PRO_PAYMENT_LINK_URL = "https://kodekoding.myr.id/pl/estimo-pro-lifetime";

// Flag rilis bertahap (keputusan Umar 26 Okt 2026) — SEMENTARA selama
// verifikasi akun Mayar masih berjalan dan checkout Mayar belum aktif.
// Saat true, modal Upgrade menyembunyikan tombol Bayar Mayar dan
// menampilkan ajakan daftar minat via WhatsApp ("Segera Hadir") alih-alih.
// Kode alur bayar Mayar TIDAK dihapus, hanya disembunyikan di balik flag
// ini. Ubah menjadi `false` begitu verifikasi Mayar selesai dan checkout
// Mayar aktif — itu saja yang perlu diubah untuk mengembalikan tombol
// Bayar Mayar, tanpa menulis ulang modal.
export const PRO_COMING_SOON = true;

const STORAGE_KEY = "estimo.pro.v1";

export type ProRecord = {
  code: string;
  activatedAt: string; // ISO — kapan kode ini pertama diaktifkan di perangkat ini
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

// Record lama dari model 30 hari (Tugas 6) masih punya field `expiresAt` di
// localStorage sebagian user. Di sini field itu sengaja diabaikan — selama
// `code` dan `activatedAt` ada, record itu sah dan Pro aktif selamanya. Ini
// migrasi otomatis tanpa langkah tambahan: tidak ada user lama yang terkunci
// hanya karena tanggal kedaluwarsa lamanya sudah lewat.
function readRecord(): ProRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProRecord>;
    if (!parsed.code || !parsed.activatedAt) return null;
    return { code: parsed.code, activatedAt: parsed.activatedAt };
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

// Pro aktif selamanya begitu ada record tersimpan — tidak ada kedaluwarsa.
export function isProActive(record: ProRecord | null): boolean {
  return record !== null;
}

export function getProState(): ProState {
  const record = readRecord();
  return { active: isProActive(record), record };
}

export type ActivateProResult = { success: true } | { success: false; error: string };

// Kode yang SAMA boleh dipakai lagi — di perangkat baru, atau di perangkat
// yang sama kapan pun — karena ini hak pembeli lifetime, bukan perpanjangan
// masa aktif. Sistem kehormatan v1, bukan penegakan lintas perangkat.
export function activateProCode(rawCode: string): ActivateProResult {
  const code = rawCode.trim().toUpperCase();

  if (!isValidProCodeFormat(code)) {
    return {
      success: false,
      error: "Format kode tidak valid. Gunakan format PRO-YYYYMMDD-XXXX.",
    };
  }

  const record: ProRecord = {
    code,
    activatedAt: new Date().toISOString(),
  };
  writeRecord(record);

  return { success: true };
}

export function buildWhatsAppUnlockUrl(params: { buyerName?: string; orderId?: string }): string {
  const lines = [
    "Halo, saya sudah bayar ESTIMO Pro dan ingin minta kode unlock.",
    `Nama: ${params.buyerName?.trim() || "-"}`,
    `ID Order Mayar: ${params.orderId?.trim() || "-"}`,
  ];
  const text = encodeURIComponent(lines.join("\n"));
  const phone = PRO_WHATSAPP_NUMBER.replace(/^0/, "62");
  return `https://wa.me/${phone}?text=${text}`;
}

// Pesan BERBEDA dari buildWhatsAppUnlockUrl di atas — khusus mode "Segera
// Hadir" (lihat PRO_COMING_SOON). Pesan ini harus jelas bahwa pengguna
// BELUM membayar dan hanya mendaftar minat, supaya admin tidak salah kira
// pengguna sudah bayar lalu mengirim kode unlock begitu saja.
export function buildWhatsAppInterestUrl(params: {
  buyerName?: string;
  priceLabel: string;
}): string {
  const lines = [
    `Halo, saya berminat ESTIMO Pro selamanya ${params.priceLabel}. Kabari saya saat sudah bisa dibeli.`,
    `Nama: ${params.buyerName?.trim() || "-"}`,
  ];
  const text = encodeURIComponent(lines.join("\n"));
  const phone = PRO_WHATSAPP_NUMBER.replace(/^0/, "62");
  return `https://wa.me/${phone}?text=${text}`;
}

// Hook ringan — satu sumber kebenaran status Pro untuk seluruh UI. Membaca
// ulang saat tab kembali terlihat atau localStorage berubah dari tab lain,
// supaya aktivasi di tab/sesi lain ikut terlihat tanpa reload paksa. Tidak
// ada lagi re-check berkala — Pro lifetime tidak pernah berubah jadi Free
// dengan sendirinya, jadi tidak ada kedaluwarsa yang perlu dipantau.
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
    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
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
