import { api } from "@/lib/api";

export type SearchType = "USER" | "POST" | "EVENT" | "COMMUNITY" | "CREW" | "ALL";

export interface SearchUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isKycVerified: boolean;
}

export interface SearchRequest {
  query: string;
  type: SearchType;
  country?: string;
}

export interface SearchResponse<TResult> {
  results?: TResult[];
}

export const searchApi = {
  search: async <TResult>(params: SearchRequest): Promise<TResult[]> => {
    const { data } = await api.post<SearchResponse<TResult>>("/v1/search", params);
    return data.results ?? [];
  },
  
  searchUsers: async (query: string): Promise<SearchUser[]> => {
    const { data } = await api.post<SearchResponse<SearchUser>>("/v1/search", {
      query,
      type: "USER",
      country: "AR",
    });
    return data?.results || [];
  }
};
