import * as React from "react";
import { cn } from "@/lib/utils";

interface CinematicHeaderProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  className?: string;
  height?: "sm" | "md" | "lg";
}

export function CinematicHeader({
  imageUrl,
  title,
  subtitle,
  className,
  height = "md",
}: CinematicHeaderProps) {
  const heights = {
    sm: "h-[220px]",
    md: "h-[360px]",
    lg: "h-[500px]",
  };

  return (
    <div className={cn("relative w-full overflow-hidden rounded-3xl group shadow-md", heights[height], className)}>
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 w-full space-y-2 z-10">
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none drop-shadow-md">
          {title}
        </h1>
        {subtitle && (
          <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold uppercase tracking-wider shadow-sm">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

