import { useState } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import {
  PRO_PAYMENT_LINK_URL,
  PRO_PRICE_RUPIAH,
  buildWhatsAppUnlockUrl,
  type ActivateProResult,
  type ProRecord,
} from "@/lib/pro";
import { formatMoney } from "@/lib/simulator";

// Hanya fitur yang benar-benar sudah ada di aplikasi — jangan menambahkan
// riwayat lokal permanen, Innovation Log, PDF, tautan permanen, template,
// atau mode tim di sini, karena belum ada.
const PRO_FEATURES = [
  "Pemilih fleksibel (Scope / Waktu / Biaya) dan deteksi konflik dengan Baseline",
  "Pengali Kompleksitas, Pengalaman, dan Revisi — jam dasar vs jam disesuaikan",
  "Slider jam fokus per hari dan input deadline klien",
  "Baseline, Change Log, dan perbandingan Baseline vs Skenario",
  "Buffer waktu lengkap dengan alasannya",
  "Health Score, Risiko, dan Insight",
  "Salin Ringkasan untuk klien dan kartu Bagikan",
];

export function UpgradeModal({
  open,
  onClose,
  isPro,
  proRecord,
  onActivate,
}: {
  open: boolean;
  onClose: () => void;
  isPro: boolean;
  proRecord: ProRecord | null;
  onActivate: (code: string) => ActivateProResult;
}) {
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [orderId, setOrderId] = useState("");

  if (!open) return null;

  const handleActivate = () => {
    const result = onActivate(codeInput);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setError(null);
    setCodeInput("");
  };

  const whatsappUrl = buildWhatsAppUnlockUrl({ buyerName, orderId });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade ke ESTIMO Pro"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 shadow-card sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">ESTIMO Pro</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMoney(PRO_PRICE_RUPIAH)} sekali bayar, selamanya.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Bukan langganan. Tidak ada tagihan otomatis. Tidak ada kedaluwarsa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isPro && proRecord ? (
          <>
            <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-3 text-sm font-semibold text-success">
              Pro aktif selamanya.
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Ganti perangkat? Masukkan kode unlock yang sama lagi di perangkat baru itu — Pro aktif
              lagi di sana, tanpa bayar ulang.
            </p>
          </>
        ) : (
          <>
            <ul className="mt-4 space-y-2 text-sm">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold">Cara bayar (manual, via Mayar)</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-muted-foreground">
                <li>Klik tombol Bayar di bawah — tautan Mayar terbuka di tab baru.</li>
                <li>
                  Bayar {formatMoney(PRO_PRICE_RUPIAH)} di halaman checkout Mayar (nominal terkunci
                  di Mayar; QRIS/virtual account/e-wallet/Alfamart sesuai yang diaktifkan).
                </li>
                <li>
                  Setelah status Paid, kirim WhatsApp (tombol di bawah) menyertakan nama Anda dan ID
                  order Mayar.
                </li>
                <li>
                  Admin memverifikasi status Paid di dashboard Mayar (bukan hanya dari screenshot
                  atau klaim WhatsApp), lalu mengirim satu kode unlock per pembayaran{" "}
                  {formatMoney(PRO_PRICE_RUPIAH)} yang terverifikasi Paid.
                </li>
              </ol>

              {PRO_PAYMENT_LINK_URL ? (
                <a
                  href={PRO_PAYMENT_LINK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  Bayar {formatMoney(PRO_PRICE_RUPIAH)} via Mayar
                </a>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-input p-3 text-xs text-muted-foreground">
                  Tautan pembayaran belum tersedia. Hubungi admin lewat WhatsApp untuk instruksi
                  pembayaran.
                </p>
              )}

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Nama Anda (untuk pesan WhatsApp)"
                  className="rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none transition-shadow focus:ring-2 focus:ring-ring"
                />
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="ID Order Mayar (opsional)"
                  className="rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none transition-shadow focus:ring-2 focus:ring-ring"
                />
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <MessageCircle className="h-4 w-4" />
                Minta kode via WhatsApp
              </a>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Refund: pembayaran ganda atau salah dengan kode belum dikirim diselesaikan lewat
              WhatsApp yang sama. Kode yang sudah dikirim dan dipakai tidak bisa direfund, kecuali
              kesalahan admin.
            </p>
          </>
        )}

        {!isPro && (
          <div className="mt-5">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                Sudah punya kode unlock?
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ganti perangkat atau install ulang? Masukkan kode yang sama lagi — Pro aktif lagi,
                tanpa bayar ulang.
              </p>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="PRO-20261026-AB12"
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm uppercase outline-none transition-shadow focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={handleActivate}
                  className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  Aktifkan
                </button>
              </div>
            </label>
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
