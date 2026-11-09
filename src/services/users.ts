import { api } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

export interface UpdateMeInput {
  name?: string;
  username?: string;
  avatarUrl?: string;
  documentId?: string;
  dob?: string;
  country?: string;
}

export const usersApi = {
  checkUsername: async (username: string) => {
    const { data } = await api.get(`/v1/users/check-username?username=${username}`);
    return data;
  },
  
  updateMe: async (userData: UpdateMeInput): Promise<AuthUser> => {
    const { data } = await api.put<AuthUser>("/v1/users/me", userData);
    return data;
  },

  getUserCommunities: async (username: string) => {
    const { data } = await api.get(`/v1/users/${username}/communities`);
    return data;
  },
  getUserEvents: async (username: string) => {
    const { data } = await api.get(`/v1/users/${username}/events`);
    return data;
  },
  getUserProfile: async (username: string) => {
    const { data } = await api.get(`/v1/users/${username}`);
    return data;
  },

  followUser: async (username: string) => {
    const { data } = await api.post(`/v1/users/${username}/follow`);
    return data;
  },

  unfollowUser: async (username: string) => {
    const { data } = await api.delete(`/v1/users/${username}/follow`);
    return data;
  },
  
  createDirectChat: async (targetUserId: string) => {
    // Actually this should probably be in chatApi but it's used here, we can put it here or chatApi
    const { data } = await api.post("/v1/chats/direct", { target_user_id: targetUserId });
    return data;
  }
};
