/** Abre el perfil propio en Insignias con la reseña de ese evento abierta. */
export function badgeReviewHref(username: string, eventId: string) {
  return `/profile/${encodeURIComponent(username)}?badge=${encodeURIComponent(eventId)}`;
}
