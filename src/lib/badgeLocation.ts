import type { EventBadge } from "@/types/badges";

export function badgeLocation(badge: Pick<EventBadge, "location" | "department" | "country">) {
  let country = badge.country?.trim() || "";
  if (/^[A-Za-z]{2}$/.test(country)) {
    try { country = new Intl.DisplayNames(["es"], { type: "region" }).of(country.toUpperCase()) || country; } catch { /* Preserve the recorded country. */ }
  }
  return [badge.location?.trim(), [badge.department?.trim(), country].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
}
