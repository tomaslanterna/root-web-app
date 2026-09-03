export interface Post {
  id: string;
  authorId: string;
  eventId?: string;
  communityId?: string;
  title?: string;
  content: string;
  longContent?: string;
  headerImageUrl?: string;
  timestamp: string;
  isFeatured?: boolean;
  authorName?: string;
  authorAvatar?: string;
  isVerified?: boolean;
  likesCount?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  has_more: boolean;
}

export interface FeedData {
  data: Post[];
  pagination: PaginationMeta;
}

export interface FeedsResponse {
  global?: FeedData;
  featured?: FeedData;
  following?: FeedData;
}

export interface FetchFeedsParams {
  include_feeds: string; // ej: "global,featured,following"
  global_page?: number;
  global_limit?: number;
  featured_page?: number;
  featured_limit?: number;
  following_page?: number;
  following_limit?: number;
  community_id?: string;
  event_id?: string;
  author_id?: string;
}
