import { api } from "@/lib/api";
import type { AuthUser, FollowStatus } from "@/types/auth";
import type { Post } from "@/types/posts";
import type { FollowListKind, FollowListResponse, FollowListUser } from "@/types/follows";
import type { BlockedUser } from "@/types/moderation";

export interface MusicInterests {
  genres: string[];
  answered: boolean;
  options: string[];
}

export interface UpdateMeInput {
  name?: string;
  username?: string;
  avatarUrl?: string;
  documentId?: string;
  dob?: string;
  country?: string;
  /** Aceptación de Términos y Privacidad (usuarios que entraron con Google o anteriores a los términos). */
  acceptedTerms?: boolean;
  termsVersion?: string;
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

  /** Sube la foto de perfil (multipart, campo "image") y devuelve el usuario con la nueva `avatarUrl`. */
  updateAvatar: async (image: File): Promise<AuthUser> => {
    const formData = new FormData();
    formData.append("image", image);
    const { data } = await api.post<AuthUser>("/v1/users/me/avatar", formData, { timeout: 30000 });
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

  /**
   * Si la identidad de la cuenta ya está verificada, según el perfil público. La sesión guarda el valor del login
   * y puede quedar vieja si la verificación se aprobó después. No cierra la sesión si falla.
   */
  getKycStatus: async (username: string): Promise<boolean> => {
    const { data } = await api.get<{ isKycVerified?: boolean }>(`/v1/users/${encodeURIComponent(username)}`, {
      skipAuthRedirect: true,
      timeout: 8000,
    });
    return Boolean(data?.isKycVerified);
  },

  /** Sigue al perfil o, si es privado, le manda una solicitud. Devuelve el estado resultante. */
  followUser: async (username: string): Promise<FollowStatus> => {
    const { data } = await api.post<{ status?: string }>(`/v1/users/${username}/follow`);
    return data?.status === "requested" ? "requested" : "following";
  },

  unfollowUser: async (username: string) => {
    const { data } = await api.delete(`/v1/users/${username}/follow`);
    return data;
  },

  /** Posts de un perfil. Si es privado y no lo seguís, el backend responde 403. */
  getUserPosts: async (username: string): Promise<Post[]> => {
    const { data } = await api.get<{ data: Post[] }>(`/v1/users/${encodeURIComponent(username)}/posts`);
    return data.data ?? [];
  },

  /** Perfil privado: solo quien sigue ve posts, insignias, eventos y listas. */
  setPrivacy: async (isPrivate: boolean): Promise<boolean> => {
    const { data } = await api.put<{ isPrivate: boolean }>("/v1/users/me/privacy", { isPrivate });
    return data.isPrivate;
  },
  /** Solicitudes de seguimiento pendientes (perfil privado). */
  getFollowRequests: async (): Promise<FollowListUser[]> => {
    const { data } = await api.get<{ data: FollowListUser[] }>("/v1/users/me/follow-requests");
    return data.data ?? [];
  },
  acceptFollowRequest: async (username: string) => {
    await api.post(`/v1/users/me/follow-requests/${encodeURIComponent(username)}/accept`);
  },
  rejectFollowRequest: async (username: string) => {
    await api.delete(`/v1/users/me/follow-requests/${encodeURIComponent(username)}`);
  },

  /**
   * Elimina la cuenta: queda dada de baja al instante y el token deja de valer. El backend guarda una copia
   * privada 30 días y después la borra.
   */
  deleteAccount: async (): Promise<void> => {
    await api.delete("/v1/users/me");
  },
  /** Bloqueo simétrico: ninguno ve al otro, no pueden escribirse y se dejan de seguir. */
  blockUser: async (username: string): Promise<void> => {
    await api.post(`/v1/users/${encodeURIComponent(username)}/block`);
  },
  unblockUser: async (username: string): Promise<void> => {
    await api.delete(`/v1/users/${encodeURIComponent(username)}/block`);
  },
  getBlockedUsers: async (): Promise<BlockedUser[]> => {
    const { data } = await api.get<{ data: BlockedUser[] }>("/v1/users/me/blocks");
    return data?.data ?? [];
  },

  /** Intereses musicales: géneros elegidos, si ya respondió y la lista de géneros posibles. */
  getInterests: async (): Promise<MusicInterests> => {
    const { data } = await api.get<MusicInterests>("/v1/users/me/interests");
    return { genres: data.genres ?? [], answered: !!data.answered, options: data.options ?? [] };
  },
  /** Guarda los géneros elegidos. Una lista vacía es "ahora no": no se vuelve a preguntar. */
  setInterests: async (genres: string[]): Promise<string[]> => {
    const { data } = await api.put<{ genres: string[] }>("/v1/users/me/interests", { genres });
    return data.genres ?? [];
  },

  /** Seguidores o seguidos de un perfil, del más reciente al más viejo. */
  getFollowList: async (
    username: string,
    kind: FollowListKind,
    params?: { limit?: number; offset?: number },
  ): Promise<FollowListResponse> => {
    const { data } = await api.get<FollowListResponse>(
      `/v1/users/${encodeURIComponent(username)}/${kind}`,
      { params },
    );
    return data;
  },
  
  createDirectChat: async (targetUserId: string) => {
    // Actually this should probably be in chatApi but it's used here, we can put it here or chatApi
    const { data } = await api.post("/v1/chats/direct", { target_user_id: targetUserId });
    return data;
  }
};
