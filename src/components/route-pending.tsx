import { EstimoLogo } from "@/components/estimo-logo";

export function RoutePending() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <EstimoLogo height={32} className="animate-pulse opacity-70" />
    </div>
  );
}
