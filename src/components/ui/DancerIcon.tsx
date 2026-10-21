import type { SVGProps } from "react";

export interface DancerIconProps extends SVGProps<SVGSVGElement> {
  strokeWidth?: number | string;
}

export function DancerIcon({
  strokeWidth = 2,
  className,
  ...props
}: DancerIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="2 2 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Persona izquierda (brazos arriba festejando) */}
      <circle cx="8" cy="4.8" r="2.2" />
      <path d="M3 8.5c1.4 2 3.1 2.8 5 2.8s3.6-.8 5-2.8" />
      <path d="M8 11.3v4.4" />
      <path d="m5.2 21.2 2.8-5.5 2.8 5.5" />

      {/* Persona derecha (acompañando con brazo arriba) */}
      <circle cx="16.8" cy="5.8" r="1.95" />
      <path d="M13.5 11.8c1.1.4 2.2.5 3.3.5 1.9 0 3.5-.8 4.6-2.8" />
      <path d="M16.8 12.3v3.9" />
      <path d="m14.2 21.2 2.6-5 2.6 5" />
    </svg>
  );
}
