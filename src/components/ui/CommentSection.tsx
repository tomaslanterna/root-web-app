"use client";

import { FormEvent, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useComments } from "@/hooks/useComments";
import { ReportContentAction } from "@/components/communities/ReportContentAction";
import type { EventComment } from "@/types/events";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  targetId: string;
  title?: string;
  isMock?: boolean;
  mockComments?: EventComment[];
  className?: string;
  endpointType?: "events" | "posts";
  reportCommunityId?: string;
  fixedInput?: boolean;
}


export function CommentSection({
  targetId,
  title = "Comentarios",
  isMock = false,
  mockComments = [],
  className = "",
  endpointType = "events",
  reportCommunityId,
  fixedInput = false,
}: CommentSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [content, setContent] = useState("");
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const commentsTopRef = useRef<HTMLDivElement>(null);

  const { comments, total, hasMore, hasLoaded, fetchComments, postComment, isLoadingComments, isPostingComment, commentsError } = useComments(targetId, endpointType, isMock, mockComments);

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (policyError) setPolicyError(null);
    if (generalError) setGeneralError(null);
  };

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!user) {
      router.push("/login");
      return;
    }
    if (trimmed && trimmed.length <= 1000 && !isPostingComment) {
      setPolicyError(null);
      setGeneralError(null);
      void postComment(trimmed)
        .then(() => {
          setContent("");
          setPolicyError(null);
          setGeneralError(null);
          commentsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        })
        .catch((err: any) => {
          const errMsg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "";
          if (
            typeof errMsg === "string" &&
            (errMsg.toLowerCase().includes("políticas de violencia") ||
              errMsg.toLowerCase().includes("politicas de violencia") ||
              errMsg.toLowerCase().includes("violencia"))
          ) {
            setPolicyError("este mensaje infringe nuestras politicas de violencia");
          } else {
            setGeneralError("No pudimos publicar el comentario. Intentá nuevamente.");
          }
        });
    }
  };

  return (
    <>
      <section className={`max-w-2xl mx-auto w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="tech-label text-sm flex items-center gap-2 text-white">
          <MessageCircle className="w-4 h-4 text-[#D4FF00]" /> {title}
        </h2>
        <span className="flex items-center gap-1 bg-[#D4FF00]/10 px-2.5 py-1 rounded-full border border-[#D4FF00]/20">
          <span className="num-display text-xs text-white">{total}</span>
          <span className="tech-label text-[9px] text-[#D4FF00]">Respuestas</span>
        </span>
      </div>

      {/* Input box (Inline si fixedInput es false) */}
      {!fixedInput && (
        user ? (
          <form onSubmit={submitComment} className="mb-10">
            <div className="flex gap-3">
              <Avatar src={user.avatarUrl} fallback={user.name || "Tú"} size="sm" className="ring-1 ring-white/10 shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "bg-[#14171F] rounded-2xl p-1 pr-1.5 flex items-center shadow-inner transition-all",
                    policyError
                      ? "border border-rose-500 ring-2 ring-rose-500/40 bg-rose-500/[0.04]"
                      : "border border-white/10 focus-within:border-white/30"
                  )}
                >
                  <input 
                    type="text" 
                    maxLength={1000}
                    aria-label="Escribir comentario"
                    placeholder="Deja tu opinión..." 
                    value={content}
                    onChange={handleContentChange}
                    className="min-w-0 flex-1 bg-transparent border-none text-sm text-white px-3 focus:outline-none placeholder:text-neutral-500 font-medium"
                  />
                  <button 
                    type="submit"
                    disabled={!content.trim() || isPostingComment}
                    aria-label="Enviar comentario"
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#D4FF00] text-neutral-950 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#bce400] active:scale-95 transition-all cursor-pointer shrink-0 ml-1 shadow-md shadow-[#D4FF00]/15"
                  >
                    {isPostingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-950" /> : <Send className="w-3.5 h-3.5 text-neutral-950" />}
                  </button>
                </div>

                {policyError && (
                  <p className="mt-2 text-xs font-semibold text-rose-500 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {policyError}
                  </p>
                )}
              </div>
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
        )
      )}

      {generalError && (
        <p className="text-center text-[11px] font-semibold text-rose-400 mb-6">
          {generalError}
        </p>
      )}

      {/* Lista de comentarios */}
      <div ref={commentsTopRef} className="space-y-6">
        {!hasLoaded && isLoadingComments ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4FF00]" />
          </div>
        ) : commentsError && comments.length === 0 ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-xs font-semibold text-rose-400">No pudimos cargar los comentarios.</p>
            <Button size="sm" variant="outline" onClick={() => void fetchComments(0).catch(() => undefined)}>
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-bold text-neutral-200">{comment.authorName || "Usuario"}</span>
                    <span className="tech-mono text-[10px] text-neutral-500">
                      {formattedTime}
                    </span>
                  </div>
                  <p className="break-words text-sm text-neutral-400 font-medium leading-relaxed">{comment.content}</p>
                  {reportCommunityId && <ReportContentAction communityId={reportCommunityId} targetType="comment" targetId={comment.id} />}
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
            onClick={() => void fetchComments(comments.length).catch(() => undefined)}
          >
            {isLoadingComments ? "Cargando..." : "Cargar más respuestas"}
          </Button>
        </div>
      )}
    </section>

    {/* Fixed bottom comment bar */}
    {fixedInput && (
      <footer className="fixed bottom-0 inset-x-0 z-40 liquid-glass-bar shadow-[0_-12px_40px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="liquid-glass-specular" />
        <div className="relative z-10 mx-auto w-full max-w-xl px-3.5 pt-2.5 pb-[calc(0.75rem+var(--root-safe-bottom,env(safe-area-inset-bottom,0px)))] sm:px-6 sm:py-3.5">
          {policyError && (
            <p className="mb-2 text-xs font-semibold text-rose-500 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {policyError}
            </p>
          )}
          {generalError && (
            <p className="mb-2 text-xs font-semibold text-rose-400 pl-1">
              {generalError}
            </p>
          )}
          {user ? (
            <form onSubmit={submitComment} className="relative flex items-center gap-2.5">
              <Avatar
                src={user.avatarUrl}
                fallback={user.name || "Tú"}
                size="sm"
                className="shrink-0 h-9 w-9 ring-1 ring-white/10"
              />
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  maxLength={1000}
                  aria-label="Escribir comentario"
                  placeholder="Deja tu opinión..."
                  value={content}
                  onChange={handleContentChange}
                  disabled={isPostingComment}
                  className={cn(
                    "h-11 w-full rounded-2xl border-0 px-4 text-xs sm:text-sm font-medium text-white outline-none transition-colors shadow-sm",
                    policyError
                      ? "border border-rose-500 ring-2 ring-rose-500/40 bg-rose-500/[0.04]"
                      : "bg-black/50 placeholder:text-neutral-500 focus:ring-1 focus:ring-[#D4FF00]/50 backdrop-blur-md"
                  )}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!content.trim() || isPostingComment}
                aria-label="Enviar comentario"
                className="h-11 px-3.5 sm:px-4 rounded-2xl shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isPostingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-950" />
                ) : (
                  <Send className="h-4 w-4 text-neutral-950" />
                )}
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4FF00]/25 bg-[#D4FF00]/10 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#D4FF00] transition-colors hover:bg-[#D4FF00]/20"
            >
              <LogIn className="h-4 w-4" /> Iniciá sesión para comentar
            </button>
          )}
        </div>
      </footer>
    )}
  </>
  );
}
