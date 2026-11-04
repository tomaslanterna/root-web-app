import { cn } from "@/lib/utils";

interface RootLogoProps {
  /** Lado del cuadrado de la "R" en px; el resto del logo escala en proporción. */
  size?: number;
  className?: string;
}

/**
 * Logo de root: la "R" negra sobre un cuadrado lima, seguida de "OOT".
 * Proporciones de la lámina "Logo · ROOT" (versión para tamaños chicos: 30px).
 */
export function RootLogo({ size = 30, className }: RootLogoProps) {
  return (
    <span
      role="img"
      aria-label="root"
      className={cn("inline-flex items-center", className)}
      style={{ gap: Math.max(2, Math.round(size * 0.1)) }}
    >
      <span
        aria-hidden="true"
        className="root-logo-type shrink-0 bg-accent text-on-accent flex items-center justify-center"
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), fontSize: Math.round(size * 0.74) }}
      >
        R
      </span>
      <span
        aria-hidden="true"
        className="root-logo-type text-ink tracking-[0.02em]"
        style={{ fontSize: Math.round(size * 0.9) }}
      >
        OOT
      </span>
    </span>
  );
}
