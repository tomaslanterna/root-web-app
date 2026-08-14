"use client";

import * as React from "react";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { MOCK_USERS, MOCK_COMMENTS, Comment } from "@/lib/mocks";
import { MessageSquare, Send, Sparkles } from "lucide-react";

interface CommentSectionProps {
  targetId: string;
  title?: string;
}

export function CommentSection({ targetId, title = "Comentarios de la Comunidad" }: CommentSectionProps) {
  const currentUser = MOCK_USERS[2]; // Santi User
  const initialComments = MOCK_COMMENTS.filter((c) => c.targetId === targetId);

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState("");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const createdComment: Comment = {
      id: `cm_${Date.now()}`,
      targetId,
      authorId: currentUser.id,
      content: newCommentText.trim(),
      timestamp: new Date().toISOString(),
    };

    setComments((prev) => [createdComment, ...prev]);
    setNewCommentText("");
  };

  return (
    <div className="space-y-6 pt-6 border-t border-white/10 text-white">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#D4FF00]" />
          {title}
        </h3>
        <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#14171F] text-[#D4FF00] border border-white/10">
          {comments.length} COMENTARIOS
        </span>
      </div>

      {/* Write New Comment Input Form */}
      <form onSubmit={handleAddComment} className="space-y-3 bg-[#14171F] p-4 rounded-3xl border border-white/10 shadow-lg">
        <div className="flex items-start gap-3">
          <Avatar
            src={currentUser.avatarUrl}
            fallback={currentUser.name}
            size="sm"
            className="ring-2 ring-[#D4FF00]/40 shrink-0"
          />
          <div className="flex-1 space-y-2">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Escribe tu opinión o pregunta aquí..."
              rows={2}
              className="w-full text-xs sm:text-sm p-3 rounded-2xl bg-[#0B0D10] border border-white/10 focus:outline-none focus:border-[#D4FF00] transition-all resize-none text-white placeholder:text-neutral-500 font-medium"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newCommentText.trim()}
                className="gap-1.5 px-4"
              >
                <span>Comentar</span>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List Feed */}
      <div className="space-y-3">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const author = MOCK_USERS.find((u) => u.id === comment.authorId) || currentUser;
            return (
              <div
                key={comment.id}
                className="p-4 rounded-2xl bg-[#14171F] border border-white/10 shadow-md space-y-2 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={author.avatarUrl}
                      fallback={author.name}
                      size="sm"
                      className="ring-1 ring-white/20"
                    />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-white">{author.name}</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                        {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {author.isKycVerified && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30">
                      Verificado
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed font-medium pl-10">
                  {comment.content}
                </p>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center bg-[#14171F] rounded-3xl border border-white/10 p-6 space-y-1">
            <Sparkles className="w-6 h-6 text-[#D4FF00] mx-auto" />
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
              Aún no hay comentarios. ¡Sé el primero en aportar a la conversación!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

