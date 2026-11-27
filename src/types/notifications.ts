export type NotificationCategory =
  | "messages"
  | "events"
  | "social"
  | "crews"
  | "communities"
  | "activity"
  | "account";

export interface AppNotification {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  data: Record<string, string>;
  readAt?: string;
  scheduledAt: string;
  createdAt: string;
}

export interface NotificationPage {
  data: AppNotification[];
  total: number;
  unreadCount: number;
}

export interface NotificationPreferences {
  messages: boolean;
  events: boolean;
  social: boolean;
  crews: boolean;
  communities: boolean;
  activity: boolean;
  account: boolean;
}
