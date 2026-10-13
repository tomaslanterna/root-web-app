import type { EventBadge } from "@/types/badges";

export const badgeCalendarTimeZone = "America/Montevideo";
const stepsFormat = new Intl.NumberFormat("es-UY", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
export function badgeSteps(steps: number | null | undefined): string {
  return steps == null || !Number.isFinite(steps) || steps < 0 ? "— pasos" : `${stepsFormat.format(steps / 1000)} k pasos`;
}
export function badgeStepValue(steps: number | null | undefined): string {
  return steps == null || !Number.isFinite(steps) || steps < 0 ? "—" : `${stepsFormat.format(steps / 1000)} K`;
}
export function badgeRatingValue(rating: number | null | undefined): string {
  return rating == null || !Number.isFinite(rating) ? "—" : rating.toFixed(1);
}
export function badgeDJ(badge: Pick<EventBadge, "headliner" | "headliners"> & Partial<Pick<EventBadge, "title">>): string {
  const registered = badge.headliner?.name?.trim() || badge.headliners?.find(artist => artist.name.trim())?.name.trim();
  if (registered) return registered;
  const titleParts = badge.title?.split(/\s+[-–—]\s+/u).map(part => part.trim()).filter(Boolean) || [];
  return titleParts.length > 1 ? titleParts.at(-1)! : "DJ no informado";
}
export function badgeProgress(rating: number | null | undefined) {
  return rating == null || !Number.isFinite(rating) ? 0 : Math.min(100, Math.max(0, rating * 20));
}
export function attendanceDate(value: string) {
  return new Date(value).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric", timeZone: badgeCalendarTimeZone });
}
const venueLocalities: Record<string, string> = {
  "OPEN PARK": "Punta del Este",
  "SITIO": "Montevideo",
  "HANGAR 33": "Canelones",
  "PLAZA MATEO": "Montevideo",
};
export function badgeLocality(badge: Pick<EventBadge, "department" | "location">) {
  const venue = badge.location?.trim() || "Venue no informado";
  return badge.department?.trim() || venueLocalities[venue.toLocaleUpperCase("es-UY")] || "Uruguay";
}
export function badgeProducer(badge: Pick<EventBadge, "producerName" | "title">) {
  const explicit = badge.producerName?.trim();
  if (explicit) return explicit;
  const title = badge.title.toLocaleUpperCase("es-UY");
  if (title.includes("REVERB")) return "REVERB";
  if (title.includes("KEY") || title.includes("MUSIC ON")) return "KEY";
  return "ROOT";
}
export function badgeRingDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "FECHA PENDIENTE";
  return new Intl.DateTimeFormat("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: badgeCalendarTimeZone }).format(date).replaceAll("/", ".");
}
export function badgeRingLabel(badge: Pick<EventBadge, "department" | "location" | "eventDate" | "headliner" | "headliners" | "title">) {
  return [badgeLocality(badge), badge.location?.trim() || "Venue no informado", badgeRingDate(badge.eventDate), badgeDJ(badge)].join(" · ");
}
export function groupBadges(badges: EventBadge[]) {
  const months = new Map<string, { key: string; label: string; badges: EventBadge[] }>();
  const keyFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: badgeCalendarTimeZone });
  const labelFormat = new Intl.DateTimeFormat("es-UY", { year: "numeric", month: "long", timeZone: badgeCalendarTimeZone });
  // Backend order is authoritative: confirmedAt DESC, eventId DESC. Pages append
  // to the same month rather than creating duplicate headings at a page boundary.
  for (const badge of badges) {
    const date = new Date(badge.confirmedAt);
    const valid = Number.isFinite(date.getTime());
    const parts = valid ? keyFormat.formatToParts(date) : [];
    const key = valid ? `${parts.find(p => p.type === "year")?.value}-${parts.find(p => p.type === "month")?.value}` : "unknown";
    const label = valid ? labelFormat.format(date).replace(/^./u, c => c.toUpperCase()) : "Fecha de asistencia no disponible";
    if (!months.has(key)) months.set(key, { key, label, badges: [] });
    months.get(key)!.badges.push(badge);
  }
  return [...months.values()];
}
