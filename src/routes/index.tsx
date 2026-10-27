import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Clock, Wallet, Sparkles } from "lucide-react";
import { EstimoLogo } from "@/components/estimo-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UpgradeModal } from "@/components/upgrade-modal";
import { trackCtaClicked, trackLandingView } from "@/lib/analytics";
import { PRO_COMING_SOON, PRO_PRICE_RUPIAH, useProStatus } from "@/lib/pro";
import { formatMoney } from "@/lib/simulator";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { isPro, record, activate } = useProStatus();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    trackLandingView();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center py-1">
          <EstimoLogo height={26} />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/simulate"
            onClick={() => trackCtaClicked("header")}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Mulai
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-14 text-center sm:pt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Simulasikan sebelum memutuskan
            </span>

            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Ketahui <span className="text-primary">biaya</span> dan durasi sebelum Anda mulai.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              ESTIMO membantu Anda menghitung estimasi biaya proyek lepas untuk siapa saja, memakai
              metode Triple Constraint — menyeimbangkan Scope, Time, dan Cost sebelum menentukan
              harga, bukan sekadar menebak. Coba beberapa skenario dulu, gratis untuk hitungan dasar
              tanpa daftar akun, lalu upgrade ke Pro untuk simulasi lengkap dan laporan siap kirim
              ke klien.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/simulate"
                onClick={() => trackCtaClicked("hero")}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-focus transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Mulai Estimasi
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className="text-xs text-muted-foreground">
                Gratis untuk hitungan dasar · Tanpa akun
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-20">
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={<Clock className="h-5 w-5" />}
              title="Durasi dasar, gratis"
              body="Masukkan jam kerja tiap pekerjaan, dan ESTIMO menghitung total hari kerja berdasarkan 8 jam fokus per hari."
            />
            <FeatureCard
              icon={<Wallet className="h-5 w-5" />}
              title="Biaya jujur, gratis"
              body="Gabungkan jam dan tarif Anda untuk melihat nilai proyek dasar sebelum menawarkan harga ke klien."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title={`Pro ${formatMoney(PRO_PRICE_RUPIAH)} selamanya`}
              body="Atur kompleksitas dan pengalaman tiap pekerjaan, kunci Baseline untuk melacak perubahan, dan dapatkan Health Score dengan laporan siap kirim ke klien — sekali bayar, tanpa langganan."
              badge={PRO_COMING_SOON ? "Segera Hadir" : undefined}
              onClick={() => setUpgradeModalOpen(true)}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 py-6">
          <EstimoLogo height={22} className="opacity-80" />
          <p className="text-center text-xs text-muted-foreground">Kejelasan di atas kerumitan.</p>
        </div>
      </footer>

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        isPro={isPro}
        proRecord={record}
        onActivate={activate}
      />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  badge?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
          {icon}
        </span>
        {onClick && <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {badge && (
        <span className="mt-2 inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning-foreground">
          {badge}
        </span>
      )}
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl border border-border bg-card p-6 text-left shadow-soft transition-transform hover:-translate-y-0.5"
      >
        {content}
      </button>
    );
  }

  return <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">{content}</div>;
}
