import { api } from "@/lib/api";
import type { Post } from "@/types/posts";
export async function getPostDetail(id: string): Promise<Post> {
  const { data } = await api.get<Post>(`/v1/posts/${encodeURIComponent(id)}`);
  return data;
}
