import {
  BRAND_NAME,
  LOGO_WORDMARK_ASPECT,
  LOGO_WORDMARK_PNG,
  LOGO_WORDMARK_SVG,
} from "@/lib/brand";
import { cn } from "@/lib/utils";

type EstimoLogoProps = {
  className?: string;
  height?: number;
};

/** Logo resmi ESTIMO — SVG vektor dengan fallback PNG, skala proporsional. */
export function EstimoLogo({ className, height = 28 }: EstimoLogoProps) {
  const width = Math.round(height * LOGO_WORDMARK_ASPECT);

  return (
    <picture>
      <source srcSet={LOGO_WORDMARK_SVG} type="image/svg+xml" />
      <img
        src={LOGO_WORDMARK_PNG}
        alt={BRAND_NAME}
        width={width}
        height={height}
        className={cn(
          "h-auto max-w-full object-contain object-left dark:brightness-0 dark:invert",
          className,
        )}
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
