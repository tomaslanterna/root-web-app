import { api } from "@/lib/api";

export type SearchType = "USERS" | "POSTS" | "EVENTS" | "COMMUNITIES" | "CREWS" | "ALL";

export interface SearchRequest {
  query: string;
  type: SearchType;
}

export interface SearchResponse {
  results?: any[];
}

export const searchApi = {
  search: async (params: SearchRequest): Promise<SearchResponse> => {
    const { data } = await api.post("/v1/search", params);
    return data;
  },
  
  searchUsers: async (query: string): Promise<any[]> => {
    const { data } = await api.post("/v1/search", { query, type: "USER", country: "AR" });
    return data?.results || [];
  }
};
