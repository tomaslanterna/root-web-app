"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn, isValidImageUrl } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  fallback: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  /**
   * Usuario dueño de la foto: si está, tocar la foto abre su perfil. Funciona aunque el avatar esté
   * dentro de otra fila tocable (un chat, un integrante): el toque en la foto no llega a la fila.
   */
  username?: string | null;
  /** Nombre completo para el lector de pantalla cuando `fallback` es solo la inicial. */
  name?: string;
}

export function Avatar({ src, fallback, className, size = "md", username, name }: AvatarProps) {
  const router = useRouter();
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
  const profileHref = username ? `/profile/${encodeURIComponent(username)}` : null;

  // Un <span role="link"> y no un <a>: muchos avatares viven dentro de un <Link> o un <button>,
  // y anidar enlaces rompe el HTML.
  const openProfile = (event: React.SyntheticEvent) => {
    if (!profileHref) return;
    event.preventDefault();
    event.stopPropagation();
    router.push(profileHref);
  };

  return (
    <span
      role={profileHref ? "link" : undefined}
      tabIndex={profileHref ? 0 : undefined}
      aria-label={profileHref ? `Ver perfil de ${name || fallback}` : undefined}
      onClick={profileHref ? openProfile : undefined}
      onKeyDown={
        profileHref
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") openProfile(event);
            }
          : undefined
      }
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-black/10 bg-black text-white items-center justify-center font-bold uppercase",
        sizes[size],
        profileHref &&
          "cursor-pointer transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className
      )}
    >
      {validSrc ? (
        <Image
          src={validSrc}
          alt={profileHref ? "" : fallback}
          fill
          sizes="64px"
          onError={() => setHasError(true)}
          className="object-cover"
        />
      ) : (
        <span aria-hidden={profileHref ? true : undefined}>{fallback.substring(0, 2)}</span>
      )}
    </span>
  );
}
