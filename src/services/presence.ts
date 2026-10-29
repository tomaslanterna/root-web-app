import { api } from "@/lib/api";
import type { Event } from "@/types/events";

export interface LiveEvent extends Pick<Event, "id" | "title" | "date" | "endDate"> {
  bannerUrl?: string;
  location?: string;
  lineup?: string[];
  genre?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofenceRadiusMeters?: number | null;
}
export interface LiveStatus {
  isLive: boolean;
  isAtVenue?: boolean;
  event: LiveEvent | null;
  attendanceConfirmed?: boolean;
  userSteps?: number;
}
export async function getLiveStatus(lat: number, lng: number): Promise<LiveStatus> {
  const { data } = await api.get<LiveStatus>("/v1/events/live-status", { params: { lat, lng } });
  return data;
}
export async function syncDance(input: { eventId: string; stepsCount: number; startTime: string; endTime: string; lat: number; lng: number }): Promise<void> {
  await api.post("/v1/dance/sync", input);
}
