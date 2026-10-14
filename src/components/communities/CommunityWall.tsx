"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Heart,
  Loader2,
  Megaphone,
  MessageCircle,
  Pin,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CommentSection } from "@/components/ui/CommentSection";
import { CommunityAnnouncementComposer } from "@/components/communities/CommunityAnnouncementComposer";
import { ReportContentAction } from "@/components/communities/ReportContentAction";
import { useCommunityAnnouncements } from "@/hooks/useCommunities";
import type { CreateCommunityAnnouncementInput } from "@/types/communities";
import type { Post } from "@/types/posts";
import { cn } from "@/lib/utils";

interface CommunityWallProps {
  communityId: string;
  isRRPP: boolean;
  isMember: boolean;
}

export function CommunityWall({
  communityId,
  isRRPP,
  isMember,
}: CommunityWallProps) {
  const {
    announcements,
    meta,
    load,
    publish,
    isLoading,
    isPublishing,
    error,
    publishError,
    pin,
    isPinning,
    pinError,
  } = useCommunityAnnouncements(communityId);

  // Expanded comments per post id
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  // Local likes tracking
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleLike = (postId: string, initialCount = 0) => {
    setLikedPosts((prev) => {
      const isLiked = !prev[postId];
      const currentCount = likesCounts[postId] ?? initialCount;
      setLikesCounts((counts) => ({
        ...counts,
        [postId]: isLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
      }));
      return { ...prev, [postId]: isLiked };
    });
  };

  const handlePublish = async (
    input: CreateCommunityAnnouncementInput,
    image?: File,
  ) => {
    await publish({ input, image });
  };

  return (
    <div className="space-y-6">
      {/* RRPP: Create Publication Header Component */}
      {isRRPP && (
        <section className="mb-6">
          <CommunityAnnouncementComposer
            isPublishing={isPublishing}
            errorMessage={
              publishError
                ? "No pudimos publicar en el muro. Intentá nuevamente."
                : undefined
            }
            onPublish={handlePublish}
          />
        </section>
      )}

      {/* Feed Subheader */}
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 tech-label text-xs text-neutral-300">
          <Megaphone className="h-4 w-4 text-[#D4FF00]" /> Muro de Publicaciones
        </h2>
        <span className="flex items-center gap-1.5 rounded-full bg-[#D4FF00]/10 px-2.5 py-1">
          <span className="num-display text-xs text-white">{meta.total}</span>
          <span className="tech-label text-[9px] text-[#D4FF00]">{meta.total === 1 ? "publicación" : "publicaciones"}</span>
        </span>
      </div>

      {pinError && (
        <p role="alert" className="text-xs text-red-400">
          No pudimos actualizar la publicación fijada.
        </p>
      )}

      {/* Feed Content */}
      {error && announcements.length === 0 ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-sm font-bold text-red-300">
            No pudimos cargar las publicaciones del muro.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void load({ offset: 0, append: false }).catch(() => undefined)}
          >
            Reintentar
          </Button>
        </div>
      ) : isLoading && announcements.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#D4FF00]" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-3xl border-0 bg-[#111114] p-12 text-center shadow-xl">
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            El muro está vacío
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            {isRRPP
              ? "Sé el primero en compartir una novedad o fecha para tu comunidad."
              : "Todavía no se publicaron novedades en este muro."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((post) => {
            const isCommentsOpen = Boolean(expandedComments[post.id]);
            const isLiked = Boolean(likedPosts[post.id]);
            const likesCount = likesCounts[post.id] ?? (post.likesCount ?? 0);

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-[#111114] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] hover:bg-[#16171D] transition-all"
              >
                {/* Header Image if present */}
                {post.headerImageUrl && (
                  <div className="relative h-44 w-full sm:h-64">
                    <Image
                      src={post.headerImageUrl}
                      alt={post.title || "Imagen de la publicación"}
                      fill
                      unoptimized
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-transparent opacity-80" />
                  </div>
                )}

                <div className="p-3.5 sm:p-5 space-y-3">
                  {/* Post Meta & Pin/Report options */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={post.authorAvatar}
                        fallback={post.authorName || "R"}
                        size="sm"
                        className="ring-1 ring-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-black uppercase tracking-wider text-white">
                            {post.authorName || "RRPP de la Comunidad"}
                          </p>
                          <span className="shrink-0 rounded-full bg-[#D4FF00]/15 px-1.5 py-0.2 text-[8px] font-black uppercase text-[#D4FF00]">
                            RRPP
                          </span>
                        </div>
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

                    <div className="flex items-center gap-2">
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D4FF00]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#D4FF00]">
                          <Pin className="h-3 w-3" /> Fijado
                        </span>
                      )}

                      {isRRPP && (
                        <button
                          type="button"
                          disabled={isPinning}
                          onClick={() =>
                            void pin({
                              postId: post.id,
                              pinned: !post.isPinned,
                            }).catch(() => undefined)
                          }
                          className="rounded-lg border-0 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {post.isPinned ? "Desfijar" : "Fijar"}
                        </button>
                      )}

                      {post.communityId && (
                        <ReportContentAction
                          communityId={post.communityId}
                          targetType="post"
                          targetId={post.id}
                        />
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    {post.title && (
                      <h3 className="text-lg font-black uppercase leading-snug tracking-tight text-white md:text-xl">
                        {post.title}
                      </h3>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                      {post.content}
                    </p>
                    {post.longContent && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-400">
                        {post.longContent}
                      </p>
                    )}
                  </div>

                  {/* Linked Event Pill */}
                  {post.eventId && (
                    <div className="pt-1">
                      <Link
                        href={`/events/${post.eventId}`}
                        className="inline-flex items-center gap-2 rounded-xl border-0 bg-[#D4FF00]/15 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-[#D4FF00] shadow-sm transition-colors hover:bg-[#D4FF00]/25"
                      >
                        <CalendarDays className="h-4 w-4" />
                        Ver evento vinculado
                      </Link>
                    </div>
                  )}

                  {/* Actions Bar (Likes & Comments toggle) */}
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <div className="flex items-center gap-2">
                      {/* Like button */}
                      <button
                        type="button"
                        onClick={() => toggleLike(post.id, post.likesCount || 0)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                          isLiked
                            ? "bg-red-500/20 text-red-400"
                            : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isLiked && "fill-current scale-110",
                          )}
                        />
                        <span className="num-display text-xs">{likesCount}</span>
                      </button>

                      {/* Comment toggle button */}
                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                          isCommentsOpen
                            ? "bg-[#D4FF00]/20 text-[#D4FF00]"
                            : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Comentarios</span>
                      </button>
                    </div>

                    <Link
                      href={`/posts/${post.id}?origin=communities`}
                      className="tech-label text-[10px] text-neutral-500 hover:text-[#D4FF00]"
                    >
                      Ver detalle
                    </Link>
                  </div>

                  {/* Collapsible Comments Section */}
                  {isCommentsOpen && (
                    <div className="mt-4 rounded-2xl border-0 bg-black/40 p-4 sm:p-5 shadow-inner">
                      <CommentSection
                        targetId={post.id}
                        endpointType="posts"
                        reportCommunityId={communityId}
                        title="Comentarios de la publicación"
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {/* Load More Button */}
          {meta.hasMore && (
            <div className="flex justify-center pt-3">
              <Button
                variant="outline"
                disabled={isLoading}
                onClick={() =>
                  void load({
                    offset: announcements.length,
                    append: true,
                  }).catch(() => undefined)
                }
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Cargar más publicaciones
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
