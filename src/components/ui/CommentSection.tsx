"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, MessageSquare, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { api } from "@/lib/api";
import type { EventComment, PaginatedResponse } from "@/types/events";
import { Avatar } from "./Avatar";
import { Button } from "./Button";

interface CommentSectionProps {
  targetId: string;
  title?: string;
}

const pageSize = 20;

export function CommentSection({
  targetId,
  title = "Comentarios de la comunidad",
}: CommentSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [comments, setComments] = useState<EventComment[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [content, setContent] = useState("");

  const {
    mutate: fetchComments,
    isLoading: isLoadingComments,
    error: commentsError,
  } = useMutation<PaginatedResponse<EventComment>, number>(
    async (offset) => {
      const response = await api.get<PaginatedResponse<EventComment>>(
        `/v1/events/${targetId}/comments`,
        { params: { limit: pageSize, offset } },
      );
      return response.data;
    },
    {
      onSuccess: (response, offset) => {
        setComments((current) => (offset === 0 ? response.data : [...current, ...response.data]));
        setTotal(response.meta.total);
        setHasMore(response.meta.hasMore);
        setHasLoaded(true);
      },
      onError: () => setHasLoaded(true),
    },
  );

  const {
    mutate: postComment,
    isLoading: isPostingComment,
    error: createCommentError,
  } = useMutation<EventComment, string>(
    async (text) => {
      const response = await api.post<EventComment>(`/v1/events/${targetId}/comments`, {
        content: text,
      });
      return response.data;
    },
    {
      onSuccess: (comment) => {
        setComments((current) => [comment, ...current]);
        setTotal((current) => current + 1);
        setContent("");
      },
    },
  );

  useEffect(() => {
    void fetchComments(0).catch(() => undefined);
  }, [fetchComments, targetId]);

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!user) {
      router.push("/login");
      return;
    }
    if (trimmed && trimmed.length <= 1000 && !isPostingComment) {
      void postComment(trimmed).catch(() => undefined);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-[#14171F] p-5 shadow-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-300">
          <MessageSquare className="h-4 w-4 text-[#D4FF00]" /> {title}
        </h3>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4FF00]">
          {total} comentarios
        </span>
      </div>

      {user ? (
        <form onSubmit={submitComment} className="space-y-2">
          <div className="flex items-start gap-2">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Escribí un comentario sobre el evento..."
              className="min-h-20 flex-1 resize-none rounded-2xl border border-white/10 bg-[#0B0D10] px-4 py-3 text-xs text-white placeholder-neutral-500 focus:border-[#D4FF00] focus:outline-none"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Publicar comentario"
              disabled={!content.trim() || isPostingComment}
              className="h-10 w-10 shrink-0"
            >
              {isPostingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-right text-[10px] font-semibold text-neutral-500">
            {content.length}/1000
          </p>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4FF00]/25 bg-[#D4FF00]/10 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#D4FF00]"
        >
          <LogIn className="h-4 w-4" /> Iniciá sesión para comentar
        </button>
      )}

      {createCommentError && (
        <p className="text-center text-[11px] font-semibold text-rose-400">
          No pudimos publicar el comentario. Intentá nuevamente.
        </p>
      )}

      <div className="space-y-3 pt-1">
        {!hasLoaded && isLoadingComments ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4FF00]" />
          </div>
        ) : commentsError && comments.length === 0 ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-xs font-semibold text-rose-400">No pudimos cargar los comentarios.</p>
            <Button size="sm" variant="outline" onClick={() => void fetchComments(0)}>
              Reintentar
            </Button>
          </div>
        ) : comments.length === 0 ? (
          <div className="space-y-2 py-8 text-center text-neutral-500">
            <Sparkles className="mx-auto h-5 w-5 text-[#D4FF00]" />
            <p className="text-xs font-semibold">Sé la primera persona en comentar.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const timestamp = new Date(comment.timestamp);
            const formattedTime = Number.isNaN(timestamp.getTime())
              ? comment.timestamp
              : new Intl.DateTimeFormat("es-AR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(timestamp);
            return (
              <article
                key={comment.id}
                className="space-y-2 rounded-2xl border border-white/5 bg-[#0B0D10]/60 p-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      src={comment.authorAvatar}
                      fallback={comment.authorName}
                      size="sm"
                      className="h-7 w-7 border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-white">{comment.authorName}</p>
                      <p className="truncate text-[10px] font-semibold text-neutral-500">
                        @{comment.authorUsername}
                      </p>
                    </div>
                  </div>
                  <time className="shrink-0 text-[10px] font-semibold text-neutral-500">
                    {formattedTime}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words pl-9 text-xs leading-relaxed text-neutral-300">
                  {comment.content}
                </p>
              </article>
            );
          })
        )}
      </div>

      {hasMore && (
        <Button
          type="button"
          variant="outline"
          size="full"
          disabled={isLoadingComments}
          onClick={() => void fetchComments(comments.length)}
        >
          {isLoadingComments ? "Cargando..." : "Cargar más comentarios"}
        </Button>
      )}
    </section>
  );
}
