export type EventRSVPStatus = "going" | "not_going";

export interface Artist {
  id: string;
  name: string;
  artistType: string;
  genres: string[];
  avatarUrl?: string;
  socialLinks?: any;
}

export interface EventArtist {
  eventId: string;
  artistId: string;
  performanceTime?: string;
  isHeadliner: boolean;
  artist?: Artist;
}

export interface TicketTier {
  name: string;
  price: number;
  currency: string;
  soldOut: boolean;
  fewRemaining: boolean;
}

export interface Event {
  id: string;
  title: string;
  producerId?: string;
  date: string;
  endDate?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  cinematicBannerUrl: string;
  description: string;
  lineup: string[];
  artists?: EventArtist[];
  genre?: string;
  price?: number;
  isFree: boolean;
  isFeatured: boolean;
  goingCount: number;
  notGoingCount: number;
  userRsvp?: EventRSVPStatus | null;
  ticketTiers?: TicketTier[];
  ticketSource?: string;
  ticketUrl?: string;
  ticketInfoFetchedAt?: string;
  createdAt: string;
}

export interface EventAttendee {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isKycVerified: boolean;
}

export interface EventComment {
  id: string;
  targetId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
}

export interface PageMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PageMeta;
}

export type EventListResponse = PaginatedResponse<Event>;

export interface RSVPResponse {
  success: boolean;
  goingCount: number;
  notGoingCount: number;
  userRsvp: EventRSVPStatus;
}

export interface EventFilters {
  genre: string;
  location: string;
  priceType: "all" | "free" | "paid";
  minPrice: string;
  maxPrice: string;
  startDate: string;
  endDate: string;
}
