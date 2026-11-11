"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, Heart, ImageOff, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, isValidImageUrl } from "@/lib/utils";
import type { Post } from "@/types/posts";

interface ProfilePostsGridProps {
  posts: Post[];
  isMyProfile: boolean;
  /** Abre el modal de subir foto (vive en la página del perfil). */
  onCreatePost?: () => void;
}

export function ProfilePostsGrid({ posts, isMyProfile, onCreatePost }: ProfilePostsGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 px-6 text-center rounded-card border border-line bg-surface">
        <Camera className="size-7 text-ink-3" aria-hidden="true" />
        <h3 className="mt-3 mb-0 text-base font-semibold">
          {isMyProfile ? "Compartí tus fotos" : "Todavía no hay publicaciones"}
        </h3>
        <p className="mt-1 mb-0 max-w-xs text-sm text-ink-2">
          {isMyProfile
            ? "Las fotos que subas aparecen acá para que tus amigos las vean."
            : "Esta persona todavía no compartió fotos."}
        </p>
        {isMyProfile && onCreatePost && (
          <Button type="button" onClick={onCreatePost} className="mt-5">
            <Plus className="size-4" strokeWidth={2.4} aria-hidden="true" />
            Subir foto
          </Button>
        )}
      </div>
    );
  }

  return (
    // Grilla tipo Instagram: 3 por fila, formato vertical 9:16 y separación mínima.
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post, index) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          aria-label={post.title || post.content || "Ver publicación"}
          className="group relative aspect-[9/16] overflow-hidden bg-surface-2 block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        >
          <PostThumbnail
            url={post.headerImageUrl}
            priority={index < 6}
            loading={index < 9 ? "eager" : "lazy"}
          />

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 sm:gap-6 text-white">
            <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold">
              <Heart className="size-3.5 sm:size-4 fill-white" aria-hidden="true" />
              <span className="num-mono">{post.likesCount || 0}</span>
            </span>
            <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold">
              <MessageCircle className="size-3.5 sm:size-4 fill-white" aria-hidden="true" />
              <span className="num-mono">0</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Llena el cuadro recortando desde el centro optimizado con next/image y WebP. */
function PostThumbnail({
  url,
  priority = false,
  loading,
}: {
  url?: string | null;
  priority?: boolean;
  loading?: "eager" | "lazy";
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Si la imagen ya fue cargada desde la caché del navegador antes del montaje
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  if (!isValidImageUrl(url) || failed) {
    return (
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-ink-3">
        <ImageOff className="size-5" />
      </span>
    );
  }

  const effectiveLoading = loading ?? (priority ? "eager" : "lazy");

  return (
    <>
      {/* Skeleton de carga sutil para feedback visual instantáneo */}
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-surface-3/30 animate-pulse pointer-events-none"
        />
      )}
      <Image
        ref={imgRef}
        src={url.trim()}
        alt=""
        fill
        sizes="(max-width: 768px) 33vw, 260px"
        priority={priority}
        loading={effectiveLoading}
        quality={70}
        decoding="async"
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover object-center transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </>
  );
}
