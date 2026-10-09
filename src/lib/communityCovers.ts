// Reuse the party imagery already used by Root instead of changing stored covers.
const ELECTRONIC_COVER = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop";
const PARTY_COVER = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop";
export const LOCAL_COMMUNITY_COVER = "/images/communities/default.svg";

export function getCommunityCoverSources(coverImageUrl?: string | null, category?: string | null): string[] {
  const normalizedCategory = (category ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const defaultCover = normalizedCategory === "electronica" ? ELECTRONIC_COVER : PARTY_COVER;
  return [...new Set([coverImageUrl?.trim(), defaultCover, LOCAL_COMMUNITY_COVER].filter((source): source is string => Boolean(source)))];
}
