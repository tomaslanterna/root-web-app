export interface SquadMember {
  userId: string;
  name?: string;
  username?: string;
  avatarUrl?: string | null;
  hasTicket: boolean;
  joinedAt: string;
  role: string;
}

export interface EventSquad {
  id: string;
  eventId: string;
  name: string;
  eventTitle?: string;
  eventImage?: string;
  location?: string;
  members: SquadMember[];
  matchScore?: number;
  chatRoomId: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}
