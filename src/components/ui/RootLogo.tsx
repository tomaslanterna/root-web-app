import { cn } from "@/lib/utils";

interface RootLogoProps {
  /** Lado del ícono cuadrado en px; el resto del logo escala en proporción. */
  size?: number;
  className?: string;
}

interface RootMarkProps {
  /** Lado del isotipo cuadrado en px. */
  size?: number;
  className?: string;
}

/** Isotipo de root: el ícono de la app, la cara con anteojos negros con brillo sobre el cuadrado lima. */
export function RootMark({ size = 30, className }: RootMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ícono chico y fijo: no vale la pena next/image
    <img
      src="/brand/root-icon.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      className={cn("shrink-0 select-none", className)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.26) }}
    />
  );
}

/**
 * Logo de root: el ícono de la app (la cara con anteojos sobre lima), seguido de "oot".
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
