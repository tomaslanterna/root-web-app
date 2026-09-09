import { api } from "@/lib/api";
import type { Event } from "@/types/events";

export interface SurveyArtistRatingPayload {
  artist_id: string;
  rating: number;
}

export interface SubmitSurveyPayload {
  general_rating: number;
  organization_rating?: number | null;
  vibe_rating?: number | null;
  sound_visual_rating?: number | null;
  pricing_rating?: number | null;
  space_rating?: string | null;
  would_return?: boolean | null;
  comment?: string | null;
  artist_ratings: SurveyArtistRatingPayload[];
}

export const surveysApi = {
  getPendingSurveys: async (): Promise<Event[]> => {
    const { data } = await api.get("/v1/users/me/pending-surveys");
    return data || [];
  },

  submitSurvey: async (eventId: string, payload: SubmitSurveyPayload): Promise<any> => {
    const { data } = await api.post(`/v1/events/${eventId}/surveys`, payload);
    return data;
  }
};
