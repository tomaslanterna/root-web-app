import { api } from "@/lib/api";
import type { BadgePage, BadgeLineup, EventBadge } from "@/types/badges";
import { eventsApi } from "./events";

export function badgeFlyerUrl(eventId: string) { return `${api.defaults.baseURL}/v1/events/${encodeURIComponent(eventId)}/badge/flyer`; }
export function badgeArtistImageUrl(eventId: string, artistId: string) { return `${api.defaults.baseURL}/v1/events/${encodeURIComponent(eventId)}/badge/artists/${encodeURIComponent(artistId)}/image`; }
export async function getBadgeFlyer(eventId: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/v1/events/${encodeURIComponent(eventId)}/badge/flyer`, { responseType: "blob" });
  return data;
}
export async function getBadgeArtistImage(eventId: string, artistId: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/v1/events/${encodeURIComponent(eventId)}/badge/artists/${encodeURIComponent(artistId)}/image`, { responseType: "blob" });
  return data;
}
export async function checkoutEvent(eventId: string): Promise<void> {
  await api.post(`/v1/events/${encodeURIComponent(eventId)}/attendance/checkout`);
}
export async function openReviewReminder(openingId: string): Promise<{ badge: EventBadge | null }> {
  const { data } = await api.post<{ badge: EventBadge | null }>("/v1/users/me/review-reminder/open", { openingId });
  return data;
}

export async function getBadges(username: string, offset = 0): Promise<BadgePage> {
  const { data } = await api.get<BadgePage>(`/v1/users/${encodeURIComponent(username)}/badges`, { params: { limit: 12, offset } });
  return data;
}
export async function getMyEventBadge(eventId: string): Promise<EventBadge> {
  const { data } = await api.get<EventBadge>(`/v1/events/${encodeURIComponent(eventId)}/badge`);
  return data;
}
export async function getBadgeLineup(eventId: string, isOwner: boolean): Promise<BadgeLineup> {
  if (isOwner) {
    const badge = await getMyEventBadge(eventId);
    return { artists: badge.lineup || [], names: badge.lineupNames || [] };
  }
  const event = await eventsApi.getEventById(eventId);
  return { artists: event.artists || [], names: event.lineup || [] };
}
