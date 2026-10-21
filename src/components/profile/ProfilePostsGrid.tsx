"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CreatePhotoModal } from "@/components/profile/CreatePhotoModal";
import { isValidImageUrl } from "@/lib/utils";
import type { Post } from "@/types/posts";

interface ProfilePostsGridProps {
  posts: Post[];
  isMyProfile: boolean;
  onPostCreated?: (newPost: Post) => void;
}

export function ProfilePostsGrid({
  posts,
  isMyProfile,
  onPostCreated,
}: ProfilePostsGridProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handlePostCreated = (newPost: Post) => {
    onPostCreated?.(newPost);
  };

  return (
    <div className="space-y-4">
      {/* Barra de acción si es mi perfil */}
      {isMyProfile && (
        <div className="flex items-center justify-between pb-2">
          <div className="text-xs font-black uppercase tracking-wider text-neutral-400">
            {posts.length} {posts.length === 1 ? "publicación" : "publicaciones"}
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-full px-4 h-9 gap-1.5 text-xs font-black uppercase tracking-wider shadow-[0_6px_20px_rgba(212,255,0,0.18)]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Subir foto</span>
          </Button>
        </div>
      )}

      {/* Grilla 3x3 estilo Instagram: Cada foto navega a la pantalla del post */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg sm:rounded-xl bg-neutral-900 shadow-sm block"
            >
              {isValidImageUrl(post.headerImageUrl) ? (
                <img
                  src={post.headerImageUrl.trim()}
                  alt={post.title || "Foto de perfil"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-neutral-500 bg-neutral-950 font-bold">
                  {post.content || "Sin imagen"}
                </div>
              )}

              {/* Overlay oscuro en hover / selección estilo Instagram */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 sm:gap-6 text-white select-none">
                <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-black">
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-white" />
                  <span className="num-display">{post.likesCount || 0}</span>
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-black">
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-white" />
                  <span className="num-display">0</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Estado vacío */
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-3xl border-0 bg-[#111114] shadow-xl">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-neutral-500">
            <Camera className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            {isMyProfile ? "Compartí tus fotos" : "Aún no hay publicaciones"}
          </h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-xs">
            {isMyProfile
              ? "Las fotos que subas aparecerán en la grilla de tu perfil para que tus amigos interactúen."
              : "Este usuario todavía no ha compartido fotos en su perfil."}
          </p>
          {isMyProfile && (
            <div className="mt-5">
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsCreateOpen(true)}
                className="gap-2 rounded-full px-5 text-xs font-black uppercase tracking-wider shadow-[0_8px_25px_rgba(212,255,0,0.2)]"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                Subir mi primera foto
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal para Crear Publicación (2 pasos: foto -> pie de foto) */}
      <CreatePhotoModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
