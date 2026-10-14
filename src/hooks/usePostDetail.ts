"use client";
import { useEffect, useState } from "react";
import { useMutation } from "@/hooks/useMutation";
import { getPostDetail } from "@/services/postDetail";
import { MOCK_POSTS } from "@/lib/mocks";
import { api } from "@/lib/api";
import type { Post } from "@/types/posts";

export function usePostDetail(id: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { mutate, isLoading } = useMutation(getPostDetail, {
    onSuccess: (data) => {
      setPost(data);
      setHasLoaded(true);
    },
    onError: async () => {
      // 1. Fallback a posts en localStorage
      let candidate: Post | null = null;
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("root_user_posts_")) {
            try {
              const posts: Post[] = JSON.parse(localStorage.getItem(key) || "[]");
              const found = posts.find((p) => p.id === id);
              if (found) {
                candidate = found;
                break;
              }
            } catch (e) {}
          }
        }
      }

      // 2. Si candidate tiene una imagen con key cruda (posts/...), intentar resolver URL firmada desde el feed global
      if (candidate) {
        if (candidate.headerImageUrl && !candidate.headerImageUrl.startsWith("http") && !candidate.headerImageUrl.startsWith("data:") && !candidate.headerImageUrl.startsWith("blob:")) {
          try {
            const { data: feedData } = await api.get("/v1/posts?include_feeds=global");
            const globalPosts: Post[] = feedData?.global?.data || [];
            const foundInFeed = globalPosts.find(
              (gp) => gp.id === candidate?.id || (gp.content && gp.content === candidate?.content)
            );
            if (foundInFeed?.headerImageUrl?.startsWith("http")) {
              candidate = {
                ...candidate,
                id: foundInFeed.id,
                headerImageUrl: foundInFeed.headerImageUrl,
              };
            }
          } catch {}
        }
        setPost(candidate);
        setHasLoaded(true);
        return;
      }

      // 3. Fallback a MOCK_POSTS
      const mockFound = MOCK_POSTS.find((p) => p.id === id);
      if (mockFound) {
        setPost(mockFound);
      }
      setHasLoaded(true);
    },
  });

  useEffect(() => {
    if (!id) return;

    // Si el ID es claramente un ID generado localmente (post_...), no pegarle al backend con UUID inválido
    if (id.startsWith("post_")) {
      void (async () => {
        let candidate: Post | null = null;
        if (typeof window !== "undefined") {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("root_user_posts_")) {
              try {
                const posts: Post[] = JSON.parse(localStorage.getItem(key) || "[]");
                const found = posts.find((p) => p.id === id);
                if (found) {
                  candidate = found;
                  break;
                }
              } catch (e) {}
            }
          }
        }

        // Si encontramos el post local pero su imagen es una key cruda o queremos enlazarlo con el backend
        if (candidate) {
          try {
            const { data: feedData } = await api.get("/v1/posts?include_feeds=global");
            const globalPosts: Post[] = feedData?.global?.data || [];
            const foundInFeed = globalPosts.find(
              (gp) => gp.content && gp.content === candidate?.content
            );
            if (foundInFeed?.headerImageUrl?.startsWith("http")) {
              candidate = {
                ...candidate,
                id: foundInFeed.id,
                headerImageUrl: foundInFeed.headerImageUrl,
              };
            }
          } catch {}
          setPost(candidate);
          setHasLoaded(true);
          return;
        }

        const mockFound = MOCK_POSTS.find((p) => p.id === id);
        if (mockFound) {
          setPost(mockFound);
        }
        setHasLoaded(true);
      })();
      return;
    }

    // ID UUID real del backend
    void mutate(id).catch(() => undefined);
  }, [id, mutate]);

  return { post, hasLoaded, isLoading };
}
