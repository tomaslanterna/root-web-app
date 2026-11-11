"use client";

import * as React from "react";
import Image from "next/image";
import { cn, isValidImageUrl } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  fallback: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ src, fallback, className, size = "md" }: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  };

  const validSrc = !hasError && isValidImageUrl(src) ? src.trim() : null;

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-black/10 bg-black text-white items-center justify-center font-bold uppercase",
        sizes[size],
        className
      )}
    >
      {validSrc ? (
        <Image
          src={validSrc}
          alt={fallback}
          fill
          sizes="64px"
          onError={() => setHasError(true)}
          className="object-cover"
        />
      ) : (
        <span>{fallback.substring(0, 2)}</span>
      )}
    </div>
  );
}
