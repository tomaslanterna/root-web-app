import { cn } from "@/lib/utils";

interface RootLogoProps {
  /** Lado del cuadrado de la "r" en px; el resto del logo escala en proporción. */
  size?: number;
  className?: string;
}

interface RootMarkProps {
  /** Lado del isotipo cuadrado en px. */
  size?: number;
  className?: string;
}

/** Isotipo de root: la "r" negra dentro del cuadrado lima. */
export function RootMark({ size = 30, className }: RootMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "root-logo-type inline-flex shrink-0 items-center justify-center bg-accent text-on-accent",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        fontSize: Math.round(size * 0.7),
      }}
    >
      r
    </span>
  );
}

/**
 * Logo de root: la "r" negra sobre un cuadrado lima, seguida de "oot".
 */
export function RootLogo({ size = 30, className }: RootLogoProps) {
  return (
    <span
      role="img"
      aria-label="root"
      className={cn("inline-flex items-center", className)}
      style={{ gap: Math.max(2, Math.round(size * 0.1)) }}
    >
      <RootMark size={size} />
      <span
        aria-hidden="true"
        className="root-logo-type text-ink tracking-[0.02em]"
        style={{ fontSize: Math.round(size * 0.9) }}
      >
        oot
      </span>
    </span>
  );
}
