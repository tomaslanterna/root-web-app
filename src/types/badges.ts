import type { PaginationMeta } from "./communities";
import type { EventArtist } from "./events";

export interface EventReview {
  id: string;
  eventId: string;
  generalRating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  organizationRating?: number | null;
  vibeRating?: number | null;
  soundVisualRating?: number | null;
  pricingRating?: number | null;
  spaceRating?: string | null;
  wouldReturn?: boolean | null;
  artistRatings?: { artistId: string; rating: number }[];
}

export interface EventBadge {
  eventId: string;
  title: string;
  imageUrl: string;
  eventDate: string;
  location: string;
  genre?: string | null;
  headliner?: { id: string; name: string; imageUrl: string } | null;
  confirmedAt: string;
  source?: "geofence" | "manual";
  departedAt?: string | null;
  department?: string | null;
  country?: string | null;
  producerName?: string | null;
  headliners?: { id: string; name: string; imageUrl: string }[];
  review: EventReview | null;
  steps?: number | null;
  stepsPreview?: boolean;
  mostDanced?: boolean;
  mostDancedPreview?: boolean;
  lineupNames?: string[];
  lineup?: EventArtist[];
}
export interface BadgeLineup { artists: EventArtist[]; names: string[] }
export interface BadgePage { data: EventBadge[]; meta: PaginationMeta }
