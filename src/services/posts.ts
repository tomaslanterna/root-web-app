import { api } from "@/lib/api";
import { FeedsResponse, FetchFeedsParams } from "@/types/posts";

export const postsApi = {
  getFeeds: async (params: FetchFeedsParams): Promise<FeedsResponse> => {
    const { data } = await api.get("/v1/posts", { params });
    return data;
  },

  createPost: async (content: string, communityId?: string): Promise<any> => {
    const { data } = await api.post("/v1/posts", { content, communityId });
    return data;
  },

  likePost: async (postId: string): Promise<any> => {
    const { data } = await api.post(`/v1/posts/${postId}/like`);
    return data;
  },

  commentPost: async (postId: string, content: string): Promise<any> => {
    const { data } = await api.post(`/v1/posts/${postId}/comments`, { content });
    return data;
  }
};
