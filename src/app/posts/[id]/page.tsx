"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Check,
  MoreHorizontal,
  BadgeCheck,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CommentSection } from "@/components/ui/CommentSection";
import { DetailHeader } from "@/components/ui/DetailHeader";
import { usePostDetail } from "@/hooks/usePostDetail";
import { postsApi } from "@/services/posts";
import { useAuth } from "@/context/AuthContext";
import { ReportContentAction } from "@/components/communities/ReportContentAction";
import { cn, copyTextToClipboard } from "@/lib/utils";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();

  // React.use() to unwrap params if it is a Promise (Next.js 15+)
  const unwrappedParams =
    params instanceof Promise ? React.use(params) : params;
  const id = unwrappedParams.id;

  const { post, hasLoaded, isLoading: isLoadingPost } = usePostDetail(id);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Sync post data when loaded
  useEffect(() => {
    if (post) {
      setLiked(Boolean(post.isLiked));
      setLikesCount(post.likesCount ?? 0);
    }
  }, [post?.id, post?.isLiked, post?.likesCount]);

  const handleLike = async () => {
    if (!post?.id || isLiking) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const prevLiked = liked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    // Optimistic update
    setLiked(nextLiked);
    setLikesCount(nextCount);
    setIsLiking(true);

    try {
      const res = await postsApi.likePost(post.id);
      if (res && typeof res.liked === "boolean") {
        setLiked(res.liked);
        if (typeof res.likesCount === "number") {
          setLikesCount(res.likesCount);
        }
      }
    } catch {
      // Revert if request fails
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDoubleTap = async () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);

      if (!liked && post?.id && user && !isLiking) {
        const prevLiked = liked;
        const prevCount = likesCount;
        setLiked(true);
        setLikesCount(prevCount + 1);
        setIsLiking(true);
        try {
          const res = await postsApi.likePost(post.id);
          if (res && typeof res.liked === "boolean") {
            setLiked(res.liked);
            if (typeof res.likesCount === "number") {
              setLikesCount(res.likesCount);
            }
          }
        } catch {
          setLiked(prevLiked);
          setLikesCount(prevCount);
        } finally {
          setIsLiking(false);
        }
      }
    }
    lastTapRef.current = now;
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      void copyTextToClipboard(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!hasLoaded && isLoadingPost) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#0B0D10] text-white">
        <DetailHeader
          showBrand={false}
          showSave={false}
          showShare={false}
          onBack={() => router.back()}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 pt-safe-header">
          <div className="w-8 h-8 border-4 border-[#D4FF00] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
            Cargando publicación...
          </p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#0B0D10] text-white">
        <DetailHeader
          showBrand={false}
          showSave={false}
          showShare={false}
          onBack={() => router.back()}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center pt-safe-header">
          <p className="text-sm font-bold uppercase text-neutral-300">
            No pudimos encontrar la publicación
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-white/10 px-5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col pb-[calc(6.5rem+var(--root-safe-bottom,env(safe-area-inset-bottom,0px)))] sm:pb-32 relative">
      {/* Toast Feedback de Compartir */}
      {copiedLink && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#D4FF00] px-5 py-2.5 text-xs font-black tracking-wide text-neutral-950 shadow-2xl shadow-[#D4FF00]/40 animate-in fade-in slide-in-from-top-4 duration-200">
          ✓ Enlace copiado al portapapeles
        </div>
      )}

      {/* Header Superior idéntico a /events/[id] pero sin el logo de root */}
      <DetailHeader
        showBrand={false}
        showSave={false}
        showShare={true}
        onBack={() => router.back()}
        onShare={handleShare}
        isCopied={copiedLink}
      />

      {/* Contenedor de la publicación */}
      <main className="w-full max-w-xl mx-auto flex-1 flex flex-col px-0 sm:px-4 pt-safe-1 sm:pt-20">
        <article className="overflow-hidden bg-[#111114] sm:rounded-3xl border-0 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)]">
          {/* Cabecera del Autor - Deja espacio para el botón de GoBack a la izquierda y el Share a la derecha en mobile */}
          <div className="flex items-center justify-between min-h-10 py-1 pl-16 pr-14 sm:p-4">
            <Link
              href={post.authorName ? `/profile/${post.authorName}` : "#"}
              className="flex items-center gap-3 min-w-0 group"
            >
              <Avatar
                src={post.authorAvatar}
                fallback={post.authorName?.charAt(0) || "U"}
                size="sm"
                className="ring-1 ring-white/20 group-hover:ring-[#D4FF00]/50 transition-all shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-wider text-white group-hover:text-[#D4FF00] transition-colors flex items-center gap-1">
                  <span>{post.authorName || "Usuario"}</span>
                  {post.isVerified && (
                    <BadgeCheck className="h-3.5 w-3.5 text-[#D4FF00] fill-current" />
                  )}
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
            </Link>

            {post.communityId ? (
              <ReportContentAction
                communityId={post.communityId}
                targetType="post"
                targetId={post.id}
              />
            ) : (
              <button
                type="button"
                onClick={handleShare}
                className="hidden sm:block p-1.5 text-neutral-400 hover:text-white transition-colors"
                aria-label="Más opciones"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Imagen de la publicación (con soporte de doble tap para dar Me Gusta) */}
          {post.headerImageUrl && (
            <div
              className="relative aspect-square w-full bg-black flex items-center justify-center select-none overflow-hidden cursor-pointer"
              onClick={handleDoubleTap}
            >
              <img
                src={post.headerImageUrl}
                alt={post.title || "Foto de publicación"}
                className="h-full w-full object-cover"
              />

              {/* Animación corazón neón al dar doble tap */}
              {showHeartBurst && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Heart className="h-28 w-28 fill-[#D4FF00] text-[#D4FF00] drop-shadow-[0_0_35px_rgba(212,255,0,0.85)] animate-in zoom-in-50 duration-200" />
                </div>
              )}
            </div>
          )}

          {/* Barra de Acciones debajo de la foto */}
          <div className="p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Botón Me Gusta */}
                <button
                  type="button"
                  onClick={handleLike}
                  className="p-1 text-neutral-300 hover:text-white transition-transform active:scale-90 cursor-pointer"
                  aria-label="Dar me gusta"
                >
                  <Heart
                    className={cn(
                      "h-6 w-6 transition-all",
                      liked
                        ? "fill-[#D4FF00] text-[#D4FF00] scale-110"
                        : "text-neutral-300 hover:text-white",
                    )}
                  />
                </button>

                {/* Botón Comentar */}
                <button
                  type="button"
                  className="p-1 text-neutral-300 hover:text-white transition-transform active:scale-90 cursor-pointer"
                  aria-label="Comentar"
                >
                  <MessageCircle className="h-6 w-6" />
                </button>

                {/* Botón Compartir */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-1 text-neutral-300 hover:text-white transition-transform active:scale-90 cursor-pointer"
                  aria-label="Compartir"
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
              <span className="num-display">{likesCount}</span>{" "}
              {likesCount === 1 ? "Me gusta" : "Me gustas"}
            </div>

            {/* Pie de foto / Caption */}
            {post.content && (
              <div className="text-xs sm:text-sm leading-relaxed text-neutral-300 pt-0.5">
                <span className="font-black uppercase tracking-wider text-white mr-2">
                  {post.authorName || "Usuario"}
                </span>
                <span className="whitespace-pre-wrap">{post.content}</span>
              </div>
            )}

            {/* Si tiene título o contenido largo adicional (artículos editoriales) */}
            {post.title && (
              <h2 className="text-base font-black uppercase tracking-tight text-white pt-2">
                {post.title}
              </h2>
            )}
            {post.longContent && (
              <p className="text-xs leading-relaxed text-neutral-400 whitespace-pre-wrap pt-1">
                {post.longContent}
              </p>
            )}
          </div>

          {/* Muro de Comentarios con Moderación por IA */}
          <div className="border-t border-white/[0.06] p-3.5 sm:p-5">
            <CommentSection
              targetId={post.id}
              title="Comentarios"
              endpointType="posts"
              reportCommunityId={post.communityId}
              fixedInput={true}
            />
          </div>
        </article>
      </main>
    </div>
  );
}
