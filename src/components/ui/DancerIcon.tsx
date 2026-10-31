import type { SVGProps } from "react";

export interface DancerIconProps extends SVGProps<SVGSVGElement> {
  strokeWidth?: number | string;
}

export function DiscoBallIcon({
  strokeWidth = 2,
  className,
  ...props
}: DancerIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Cadena / soporte superior */}
      <path d="M12 2v3" />
      <path d="M10 5h4" />

      {/* Esfera principal */}
      <circle cx="12" cy="13.5" r="8.5" />

      {/* Paralelos horizontales (filas de espejos) */}
      <path d="M4.5 9.5h15" />
      <path d="M3.5 13.5h17" />
      <path d="M4.5 17.5h15" />

      {/* Meridianos verticales y curvos (columnas de espejos) */}
      <path d="M12 5a12.5 12.5 0 0 0 0 17 12.5 12.5 0 0 0 0-17" />

      {/* Destellos laterales */}
      <path d="M20 3v3" />
      <path d="M18.5 4.5h3" />
      <path d="M4.5 4v2" />
      <path d="M3.5 5h2" />
    </svg>
  );
}

export function DancerFigureIcon({
  strokeWidth = 2,
  className,
  ...props
}: DancerIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Cabeza */}
      <circle cx="12" cy="4" r="2" />
      {/* Torso */}
      <path d="M12 6v6" />
      {/* Brazos bailando */}
      <path d="m12 8 5-4" />
      <path d="m12 9-4 2-1 4" />
      {/* Piernas bailando */}
      <path d="m12 12-3 5-3 1" />
      <path d="m12 12 4 4 2-1" />
    </svg>
  );
}

export const DancerIcon = DiscoBallIcon;
