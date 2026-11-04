import { api } from "@/lib/api";

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
  artist_ratings?: SurveyArtistRatingPayload[];
}

export const surveysApi = {
  submitSurvey: async (eventId: string, payload: SubmitSurveyPayload): Promise<{ status: string; message: string }> => {
    const { data } = await api.post(`/v1/events/${eventId}/surveys`, payload);
    return data;
  }
};
