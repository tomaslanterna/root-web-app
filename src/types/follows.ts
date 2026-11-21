import type { PaginatedResponse } from "@/types/events";

/** Lista de un perfil: quienes lo siguen o a quienes sigue. */
export type FollowListKind = "followers" | "following";

/** Una persona dentro de la lista de seguidores o seguidos. */
export interface FollowListUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  isKycVerified: boolean;
  /** Si quien mira la lista ya sigue a esta persona (false sin sesión). */
  isFollowing: boolean;
}

export type FollowListResponse = PaginatedResponse<FollowListUser>;
