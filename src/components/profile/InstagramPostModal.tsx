"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Check,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CommentSection } from "@/components/ui/CommentSection";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/posts";

interface InstagramPostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLikeToggle?: (postId: string, liked: boolean) => void;
}

export function InstagramPostModal({
  post,
  isOpen,
  onClose,
  onLikeToggle,
}: InstagramPostModalProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesDelta, setLikesDelta] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const lastTapRef = useRef<number>(0);

  if (!isOpen || !post) return null;

  const totalLikes = Math.max(0, (post.likesCount || 0) + likesDelta);

  const handleLikeClick = () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesDelta((prev) => prev + (nextLiked ? 1 : -1));
    onLikeToggle?.(post.id, nextLiked);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        setIsLiked(true);
        setLikesDelta((prev) => prev + 1);
        onLikeToggle?.(post.id, true);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
    }
    lastTapRef.current = now;
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Floating close button on top right of screen */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/60 text-neutral-300 hover:text-white transition-colors"
        aria-label="Cerrar publicación"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Modal Container: Side-by-side en desktop, vertical en mobile */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] sm:max-h-[86vh] overflow-hidden rounded-3xl bg-[#111114] shadow-[0_24px_60px_rgba(0,0,0,0.9)] border-0 flex flex-col md:flex-row">
        
        {/* COLUMNA / ÁREA DE LA IMAGEN */}
        <div
          className="relative flex-1 bg-black flex items-center justify-center select-none overflow-hidden min-h-[300px] sm:min-h-[420px] md:min-h-full"
          onClick={handleDoubleTap}
        >
          {post.headerImageUrl ? (
            <img
              src={post.headerImageUrl}
              alt={post.title || "Foto de publicación"}
              className="max-h-[50vh] md:max-h-[86vh] w-full object-contain md:object-cover"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center text-neutral-600">
              Sin imagen
            </div>
          )}

          {/* Animación corazón neón al dar doble tap */}
          {showHeartBurst && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Heart className="h-28 w-28 fill-[#D4FF00] text-[#D4FF00] drop-shadow-[0_0_35px_rgba(212,255,0,0.8)] animate-in zoom-in-50 duration-200" />
            </div>
          )}
        </div>

        {/* COLUMNA LATERAL (INFORMACIÓN, COMENTARIOS Y ACCIONES) */}
        <div className="flex flex-col w-full md:w-[380px] lg:w-[420px] shrink-0 bg-[#111114] border-t md:border-t-0 md:border-l border-white/[0.06] overflow-hidden max-h-[45vh] md:max-h-[86vh]">
          {/* Header de la publicación */}
          <header className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/[0.06] shrink-0 bg-[#16171D]/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={post.authorAvatar}
                fallback={post.authorName || "U"}
                size="sm"
                className="ring-1 ring-white/20 shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-wider text-white">
                  {post.authorName || "Usuario"}
                </p>
                <p className="tech-mono text-[9px] text-neutral-500">
                  {new Date(post.timestamp).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <Link
              href={`/posts/${post.id}`}
              className="tech-label text-[10px] text-neutral-400 hover:text-[#D4FF00] transition-colors"
            >
              Ver página
            </Link>
          </header>

          {/* Área scrolleable: Pie de foto + Muro de Comentarios */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption del autor */}
            {post.content && (
              <div className="flex items-start gap-2.5 text-xs leading-relaxed">
                <Avatar
                  src={post.authorAvatar}
                  fallback={post.authorName || "U"}
                  size="sm"
                  className="w-6 h-6 text-[9px] ring-1 ring-white/10 shrink-0 mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-black uppercase tracking-wider text-white mr-1.5">
                    {post.authorName || "Usuario"}
                  </span>
                  <span className="text-neutral-300 whitespace-pre-wrap">
                    {post.content}
                  </span>
                </div>
              </div>
            )}

            {/* Comentarios con moderación por IA */}
            <div className="pt-2 border-t border-white/[0.06]">
              <CommentSection
                targetId={post.id}
                title="Comentarios"
                endpointType="posts"
                reportCommunityId={post.communityId}
              />
            </div>
          </div>

          {/* Footer fijo: Acciones (Me Gusta, Compartir) y Contador */}
          <footer className="border-t border-white/[0.06] p-3.5 sm:p-4 bg-[#16171D]/40 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Botón Me Gusta */}
                <button
                  type="button"
                  onClick={handleLikeClick}
                  className="p-1 text-neutral-300 hover:text-white transition-transform active:scale-90"
                  aria-label="Dar me gusta"
                >
                  <Heart
                    className={cn(
                      "h-6 w-6 transition-colors",
                      isLiked
                        ? "fill-[#D4FF00] text-[#D4FF00] scale-105"
                        : "text-neutral-300",
                    )}
                  />
                </button>

                {/* Botón Comentar */}
                <button
                  type="button"
                  className="p-1 text-neutral-300 hover:text-white transition-transform active:scale-90"
                  aria-label="Comentar"
                >
                  <MessageCircle className="h-6 w-6" />
                </button>

                {/* Botón Compartir */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-1 text-neutral-300 hover:text-white transition-transform active:scale-90 relative"
                  aria-label="Compartir enlace"
                  title="Copiar enlace"
                >
                  {copiedLink ? (
                    <Check className="h-6 w-6 text-[#D4FF00]" />
                  ) : (
                    <Share2 className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Contador de Likes */}
            <div className="text-xs font-black uppercase tracking-wider text-white">
              <span className="num-display">{totalLikes}</span>{" "}
              {totalLikes === 1 ? "Me gusta" : "Me gustas"}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
