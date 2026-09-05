"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { api } from "@/lib/api";
import type { EventComment, PaginatedResponse } from "@/types/events";
import { Avatar } from "./Avatar";
import { Button } from "./Button";

interface CommentSectionProps {
  targetId: string;
  title?: string;
  isMock?: boolean;
  mockComments?: EventComment[];
  className?: string;
  endpointType?: "events" | "posts";
}

const pageSize = 20;

export function CommentSection({
  targetId,
  title = "Comentarios",
  isMock = false,
  mockComments = [],
  className = "",
  endpointType = "events",
}: CommentSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [comments, setComments] = useState<EventComment[]>(isMock ? mockComments : []);
  const [total, setTotal] = useState(isMock ? mockComments.length : 0);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(isMock);
  const [content, setContent] = useState("");

  const {
    mutate: fetchComments,
    isLoading: isLoadingComments,
    error: commentsError,
  } = useMutation<PaginatedResponse<EventComment>, number>(
    async (offset) => {
      if (isMock) return { data: [], meta: { total: mockComments.length, hasMore: false } };
      const response = await api.get<PaginatedResponse<EventComment>>(
        `/v1/${endpointType}/${targetId}/comments`,
        { params: { limit: pageSize, offset } },
      );
      return response.data;
    },
    {
      onSuccess: (response, offset) => {
        if (!isMock) {
          setComments((current) => (offset === 0 ? response.data : [...current, ...response.data]));
          setTotal(response.meta.total);
          setHasMore(response.meta.hasMore);
          setHasLoaded(true);
        }
      },
      onError: () => {
        if (!isMock) setHasLoaded(true);
      },
    },
  );

  const {
    mutate: postComment,
    isLoading: isPostingComment,
    error: createCommentError,
  } = useMutation<EventComment, string>(
    async (text) => {
      if (isMock) {
        // Return a mock response immediately
        return {
          id: Math.random().toString(),
          targetId,
          authorId: user?.id || "mock-author",
          authorName: user?.name || "Usuario",
          authorUsername: user?.username || "usuario",
          authorAvatar: user?.avatarUrl,
          content: text,
          timestamp: new Date().toISOString(),
        } as EventComment;
      }
      const response = await api.post<EventComment>(`/v1/${endpointType}/${targetId}/comments`, {
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
    if (!isMock) {
      void fetchComments(0).catch(() => undefined);
    }
  }, [fetchComments, isMock, targetId, endpointType]);

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
    <section className={`max-w-2xl mx-auto w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
          <MessageCircle className="w-4 h-4 text-[#D4FF00]" /> {title}
        </h2>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4FF00] bg-[#D4FF00]/10 px-2 py-1 rounded-full border border-[#D4FF00]/20">
          {total} Respuestas
        </span>
      </div>

      {/* Input box */}
      {user ? (
        <form onSubmit={submitComment} className="flex gap-3 mb-10">
          <Avatar src={user.avatarUrl} fallback={user.name || "Tú"} size="sm" className="ring-1 ring-white/10" />
          <div className="flex-1 bg-[#14171F] border border-white/10 rounded-2xl p-1 flex items-center shadow-inner focus-within:border-white/30 transition-colors">
            <input 
              type="text" 
              placeholder="Deja tu opinión..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm text-white px-3 focus:outline-none placeholder:text-neutral-500 font-medium"
            />
            <button 
              type="submit"
              disabled={!content.trim() || isPostingComment}
              className="bg-[#D4FF00] text-neutral-950 text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 sm:px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#bce400] transition-colors cursor-pointer flex items-center gap-2"
            >
              {isPostingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Enviar
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-10">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4FF00]/25 bg-[#D4FF00]/10 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#D4FF00] transition-colors hover:bg-[#D4FF00]/20"
          >
            <LogIn className="h-4 w-4" /> Iniciá sesión para comentar
          </button>
        </div>
      )}

      {createCommentError && (
        <p className="text-center text-[11px] font-semibold text-rose-400 mb-6">
          No pudimos publicar el comentario. Intentá nuevamente.
        </p>
      )}

      {/* Lista de comentarios */}
      <div className="space-y-6">
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
          <p className="text-center text-sm text-neutral-500 py-8 italic font-medium">No hay comentarios todavía. ¡Sé el primero!</p>
        ) : (
          comments.map((comment) => {
            const timestamp = new Date(comment.timestamp);
            const formattedTime = Number.isNaN(timestamp.getTime())
              ? comment.timestamp
              : new Intl.DateTimeFormat("es-AR", {
                  month: "short",
                  day: "numeric",
                }).format(timestamp);
                
            return (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar 
                  src={comment.authorAvatar} 
                  fallback={comment.authorName?.charAt(0) || "U"} 
                  size="sm" 
                  className="ring-1 ring-white/5 shrink-0" 
                />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-bold text-neutral-200">{comment.authorName || "Usuario"}</span>
                    <span className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase">
                      {formattedTime}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400 font-medium leading-relaxed">{comment.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {hasMore && (
        <div className="pt-6">
          <Button
            type="button"
            variant="outline"
            size="full"
            disabled={isLoadingComments}
            onClick={() => void fetchComments(comments.length)}
          >
            {isLoadingComments ? "Cargando..." : "Cargar más respuestas"}
          </Button>
        </div>
      )}
    </section>
  );
}
