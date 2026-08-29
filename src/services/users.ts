import { api } from "@/lib/api";

export const usersApi = {
  checkUsername: async (username: string) => {
    const { data } = await api.get(`/v1/users/check-username?username=${username}`);
    return data;
  },
  
  updateMe: async (userData: any) => {
    const { data } = await api.put("/v1/users/me", userData);
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
