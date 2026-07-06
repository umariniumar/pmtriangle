import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "../components/ui/sonner";
import { AnalyticsProvider } from "../lib/analytics";
import { getOgImageUrl } from "../lib/app-url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const ogImageUrl = getOgImageUrl();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ESTIMO — Estimasi durasi & biaya proyek sebelum mulai" },
      {
        name: "description",
        content:
          "Simulasikan sebelum memutuskan. Perkirakan total jam, durasi, dan biaya proyek dalam waktu kurang dari tiga menit, lalu dapatkan insight yang jelas.",
      },
      { name: "author", content: "ESTIMO" },
      { name: "application-name", content: "ESTIMO" },
      { property: "og:site_name", content: "ESTIMO" },
      {
        property: "og:title",
        content: "ESTIMO — Simulasikan sebelum memutuskan",
      },
      {
        property: "og:description",
        content:
          "Perkirakan durasi dan biaya proyek sebelum mulai. Tambahkan pekerjaan, klik simulasikan, dapatkan insight.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ESTIMO — Simulasikan sebelum memutuskan" },
      {
        name: "twitter:description",
        content:
          "Perkirakan durasi dan biaya proyek sebelum mulai. Tambahkan pekerjaan, klik simulasikan, dapatkan insight.",
      },
      { property: "og:image", content: ogImageUrl },
      { name: "twitter:image", content: ogImageUrl },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/estimo-logo.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/estimo-logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const themeScript = `(function(){try{var k='estimo-theme';var o='pds-theme';var s=localStorage.getItem(k);if(!s){s=localStorage.getItem(o);if(s)localStorage.setItem(k,s);}var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <AnalyticsProvider>
      <QueryClientProvider client={queryClient}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-center" richColors closeButton />
      </QueryClientProvider>
    </AnalyticsProvider>
  );
}
