import { cn } from "@/lib/utils";

const LOGO_ASPECT = 864 / 240;

/** Beta: PNG wordmark. Ganti ke `/estimo-logo.svg` setelah asset vektor final tersedia. */
const LOGO_SRC = "/estimo-logo.png";

type EstimoLogoProps = {
  className?: string;
  height?: number;
};

/** Logo resmi estimo — skala proporsional, tanpa distorsi. */
export function EstimoLogo({ className, height = 28 }: EstimoLogoProps) {
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <img
      src={LOGO_SRC}
      alt="estimo"
      width={width}
      height={height}
      className={cn(
        "h-auto max-w-full object-contain object-left dark:brightness-0 dark:invert",
        className,
      )}
      decoding="async"
      draggable={false}
    />
  );
}
