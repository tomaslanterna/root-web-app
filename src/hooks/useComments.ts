"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { getComments, createComment } from "@/services/comments";
import type { EventComment } from "@/types/events";

export function useComments(targetId: string, type: "events" | "posts", isMock: boolean, mockComments: EventComment[]) {
  const { user } = useAuth();
  const [comments, setComments] = useState<EventComment[]>(isMock ? mockComments : []);
  const [total, setTotal] = useState(isMock ? mockComments.length : 0);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(isMock);
  const list = useMutation((offset: number) => getComments(type, targetId, offset), {
    onSuccess: (response, offset) => { setComments((current) => offset ? [...current, ...response.data] : response.data); setTotal(response.meta.total); setHasMore(response.meta.hasMore); setHasLoaded(true); },
    onError: () => setHasLoaded(true),
  });
  const create = useMutation(async (text: string) => {
    if (!isMock) return createComment(type, targetId, text);
    return { id: crypto.randomUUID(), targetId, authorId: user?.id || "mock-author", authorName: user?.name || "Usuario", authorUsername: user?.username || "usuario", authorAvatar: user?.avatarUrl, content: text, timestamp: new Date().toISOString() };
  }, { onSuccess: (comment) => { setComments((current) => [comment, ...current]); setTotal((current) => current + 1); } });
  const fetchComments = list.mutate;
  useEffect(() => { if (!isMock) void fetchComments(0).catch(() => undefined); }, [isMock, targetId, type, fetchComments]);
  return { comments, total, hasMore, hasLoaded, fetchComments, postComment: create.mutate, isLoadingComments: list.isLoading, isPostingComment: create.isLoading, commentsError: list.error, createCommentError: create.error };
}
