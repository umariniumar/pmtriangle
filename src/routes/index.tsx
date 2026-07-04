import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Wallet, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Decision Simulator
          </span>
        </Link>
        <Link
          to="/simulate"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
        >
          Start
        </Link>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-14 text-center sm:pt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Simulate before you decide
            </span>

            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Know the cost and duration{" "}
              <span className="text-primary">before</span> you start.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Add your tasks, hit simulate, and get an honest estimate of total
              hours, timeline and cost — plus a clear recommendation. Under three
              minutes, no sign-up.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/simulate"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-focus transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Run a simulation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className="text-xs text-muted-foreground">
                Free · No account needed
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-20">
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={<Clock className="h-5 w-5" />}
              title="Realistic duration"
              body="Effort is translated into working days using focused-hour assumptions, not fantasy 8-hour sprints."
            />
            <FeatureCard
              icon={<Wallet className="h-5 w-5" />}
              title="Honest cost"
              body="Combine hours and your rate to see exactly what the project is worth before you quote."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Clear recommendation"
              body="Get a go / plan / phase verdict based on scope and risk, so the decision is obvious."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 py-6 text-center text-xs text-muted-foreground">
          Project Decision Simulator — clarity over complexity.
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
