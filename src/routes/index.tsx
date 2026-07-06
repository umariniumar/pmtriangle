import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Clock, Wallet, Sparkles } from "lucide-react";
import { EstimoLogo } from "@/components/estimo-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { trackCtaClicked, trackLandingView } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
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
              Ketahui biaya dan durasi{" "}
              <span className="text-primary">sebelum</span> Anda mulai.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Tambahkan tugas Anda, klik simulasikan, dan dapatkan estimasi jujur
              tentang total jam, timeline, dan biaya — lengkap dengan rekomendasi.
              Kurang dari tiga menit, tanpa daftar akun.
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
                Gratis · Tanpa akun
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-20">
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={<Clock className="h-5 w-5" />}
              title="Durasi realistis"
              body="Usaha diterjemahkan menjadi hari kerja memakai asumsi jam fokus, bukan sprint 8 jam yang tidak realistis."
            />
            <FeatureCard
              icon={<Wallet className="h-5 w-5" />}
              title="Biaya jujur"
              body="Gabungkan jam dan tarif Anda untuk melihat nilai proyek yang sebenarnya sebelum menawarkan harga."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Rekomendasi jelas"
              body="Dapatkan putusan lanjut / rencanakan / pecah berdasarkan cakupan dan risiko, agar keputusan jadi mudah."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 py-6">
          <EstimoLogo height={22} className="opacity-80" />
          <p className="text-center text-xs text-muted-foreground">
            Kejelasan di atas kerumitan.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
