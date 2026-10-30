"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Heart,
  Loader2,
  MessageCircle,
  Pin,
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
    <div className="flex flex-col gap-4">
      {/* RRPP: Create Publication Header Component */}
      {isRRPP && (
        <section>
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

      {/* Encabezado del feed */}
      <div className="flex items-baseline justify-between">
        <h2 className="label-mono text-ink-2 m-0">Publicaciones</h2>
        <span className="label-mono text-ink-3">
          {meta.total} {meta.total === 1 ? "publicación" : "publicaciones"}
        </span>
      </div>

      {pinError && (
        <p role="alert" className="m-0 text-sm text-danger">
          No pudimos actualizar la publicación fijada.
        </p>
      )}

      {error && announcements.length === 0 ? (
        <div className="rounded-card border border-danger/30 bg-surface p-8 text-center">
          <p className="m-0 text-base font-semibold">No pudimos cargar las publicaciones del muro.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => void load({ offset: 0, append: false }).catch(() => undefined)}
          >
            Reintentar
          </Button>
        </div>
      ) : isLoading && announcements.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-7 animate-spin text-accent" aria-label="Cargando publicaciones" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center">
          <h3 className="m-0 text-base font-semibold">El muro está vacío</h3>
          <p className="mt-1 mb-0 text-sm text-ink-2">
            {isRRPP
              ? "Sé el primero en compartir una novedad o fecha para tu comunidad."
              : "Todavía no se publicaron novedades en este muro."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((post) => {
            const isCommentsOpen = Boolean(expandedComments[post.id]);
            const isLiked = Boolean(likedPosts[post.id]);
            const likesCount = likesCounts[post.id] ?? (post.likesCount ?? 0);

            return (
              <article
                key={post.id}
                className={cn(
                  "p-3.5 rounded-card bg-surface border flex flex-col gap-3",
                  post.isPinned ? "border-accent/30" : "border-line",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={post.authorAvatar}
                    fallback={post.authorName || "R"}
                    className="size-10 rounded-full shrink-0"
                  />
                  <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold truncate">
                      {post.authorName || "RRPP de la comunidad"}
                      <span className="label-mono text-accent ml-2">RRPP</span>
                    </span>
                    <span className="text-[13px] text-ink-3">
                      {post.isPinned && "Fijado · "}
                      {new Date(post.timestamp).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                  {isRRPP && (
                    <button
                      type="button"
                      disabled={isPinning}
                      onClick={() =>
                        void pin({ postId: post.id, pinned: !post.isPinned }).catch(() => undefined)
                      }
                      aria-pressed={post.isPinned}
                      aria-label={post.isPinned ? "Desfijar publicación" : "Fijar publicación"}
                      className={cn(
                        "size-11 shrink-0 rounded-xl flex items-center justify-center transition-colors hover:bg-white/[0.06]",
                        post.isPinned ? "text-accent" : "text-ink-2",
                      )}
                    >
                      <Pin className="size-5" aria-hidden="true" />
                    </button>
                  )}
                  {post.communityId && (
                    <ReportContentAction communityId={post.communityId} targetType="post" targetId={post.id} />
                  )}
                </div>

                {post.title && <h3 className="m-0 text-[17px] font-semibold leading-snug">{post.title}</h3>}
                <p className="m-0 whitespace-pre-wrap text-base leading-normal">{post.content}</p>
                {post.longContent && (
                  <p className="m-0 whitespace-pre-wrap text-[15px] leading-normal text-ink-2">{post.longContent}</p>
                )}

                {post.headerImageUrl && (
                  <div className="relative h-[200px] w-full overflow-hidden rounded-xl bg-surface-2 sm:h-64">
                    <Image
                      src={post.headerImageUrl}
                      alt={post.title || "Imagen de la publicación"}
                      fill
                      unoptimized
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}

                {post.eventId && (
                  <Link
                    href={`/events/${post.eventId}`}
                    className="self-start h-11 px-3.5 rounded-xl bg-accent/12 text-accent text-sm font-semibold flex items-center gap-2 hover:bg-accent/20 transition-colors"
                  >
                    <CalendarDays className="size-4" aria-hidden="true" />
                    Ver evento
                  </Link>
                )}

                <div className="-ml-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    aria-pressed={isLiked}
                    aria-label={`Me gusta, ${likesCount}`}
                    onClick={() => toggleLike(post.id, post.likesCount || 0)}
                    className={cn(
                      "h-11 px-2.5 rounded-xl flex items-center gap-1.5 text-sm transition-colors hover:bg-white/[0.06]",
                      isLiked ? "text-accent" : "text-ink-2",
                    )}
                  >
                    <Heart className={cn("size-5", isLiked && "fill-current")} aria-hidden="true" />
                    <span className="num-mono">{likesCount}</span>
                  </button>
                  <button
                    type="button"
                    aria-expanded={isCommentsOpen}
                    onClick={() => toggleComments(post.id)}
                    className={cn(
                      "h-11 px-2.5 rounded-xl flex items-center gap-1.5 text-sm transition-colors hover:bg-white/[0.06]",
                      isCommentsOpen ? "text-ink" : "text-ink-2",
                    )}
                  >
                    <MessageCircle className="size-5" aria-hidden="true" />
                    Comentarios
                  </button>
                  <Link
                    href={`/posts/${post.id}?origin=communities`}
                    className="ml-auto h-11 px-2.5 flex items-center text-sm text-ink-2 hover:text-ink"
                  >
                    Ver detalle
                  </Link>
                </div>

                {isCommentsOpen && (
                  <div className="rounded-xl bg-bg p-4">
                    <CommentSection
                      targetId={post.id}
                      endpointType="posts"
                      reportCommunityId={communityId}
                      title="Comentarios de la publicación"
                    />
                  </div>
                )}
              </article>
            );
          })}

          {meta.hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                disabled={isLoading}
                onClick={() =>
                  void load({ offset: announcements.length, append: true }).catch(() => undefined)
                }
              >
                {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Cargar más publicaciones
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
