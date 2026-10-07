"use client";
import { useEffect, useState } from "react";
import { useMutation } from "@/hooks/useMutation";
import { getPostDetail } from "@/services/postDetail";
import type { Post } from "@/types/posts";
export function usePostDetail(id: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { mutate, isLoading } = useMutation(getPostDetail, { onSuccess: (data) => { setPost(data); setHasLoaded(true); }, onError: () => setHasLoaded(true) });
  useEffect(() => { void mutate(id).catch(() => undefined); }, [id, mutate]);
  return { post, hasLoaded, isLoading };
}
