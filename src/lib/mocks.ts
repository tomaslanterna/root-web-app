export type UserRole = 'USER' | 'RRPP' | 'ADMIN';
export type TicketStatus = 'AVAILABLE' | 'PENDING_CONFIRMATION' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatarUrl: string;
  isKycVerified: boolean;
}

export interface Event {
  id: string;
  title: string;
  producerId: string;
  date: string;
  location: string;
  cinematicBannerUrl: string;
  description: string;
  lineup?: string[];
  goingCount?: number;
  notGoingCount?: number;
}

export interface Post {
  id: string;
  authorId: string;
  title?: string;
  eventId?: string;
  communityId?: string;
  headerImageUrl?: string;
  content: string;
  longContent?: string;
  timestamp: string;
  likesCount: number;
}

export interface Comment {
  id: string;
  targetId: string; // eventId or postId
  authorId: string;
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  participants: User[]; 
  lastMessage: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface ResaleTicket {
  id: string;
  eventId: string;
  sellerId: string;
  buyerId?: string;
  price: number;
  status: TicketStatus;
}

export interface Community {
  id: string;
  name: string;
  prOwnerId: string;
  coverImageUrl: string;
  membersCount: number;
  description: string;
}

// Squad Matcher Interfaces
export type PartyStyle = 'chill_previa' | 'full_night' | 'main_act_only';
export type SquadStatus = 'forming' | 'active' | 'in_event' | 'post_event' | 'archived';

export interface UserVibeProfile {
  userId: string;
  favoriteGenres: string[];
  departureZone: string;
  partyStyle: PartyStyle;
  verifiedKycOnly: boolean;
  spotifyConnected?: boolean;
}

export interface EventSwipeAction {
  id: string;
  userId: string;
  eventId: string;
  direction: 'like' | 'pass' | 'superlike';
  lookingForSquad: boolean;
  timestamp: string;
}

export interface SquadMember {
  userId: string;
  hasTicket: boolean;
  joinedAt: string;
  role: 'member' | 'host';
}

export interface EventSquad {
  id: string;
  eventId: string;
  name: string;
  members: SquadMember[];
  matchScore: number;
  departureZone: string;
  chatRoomId: string;
  status: SquadStatus;
  createdAt: string;
  expiresAt: string;
}

export interface SquadChatMessage {
  id: string;
  squadId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'system_icebreaker' | 'meeting_point' | 'ticket_share';
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// Mock Data
export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Admin Root',
    username: 'admin',
    role: 'ADMIN',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin',
    isKycVerified: true,
  },
  {
    id: '2',
    name: 'Alex RRPP',
    username: 'alex_rrpp',
    role: 'RRPP',
    avatarUrl: 'https://i.pravatar.cc/150?u=alex',
    isKycVerified: false,
  },
  {
    id: '3',
    name: 'Santi User',
    username: 'santi_v',
    role: 'USER',
    avatarUrl: 'https://i.pravatar.cc/150?u=santi',
    isKycVerified: false,
  },
];

export const MOCK_EVENTS: Event[] = [];


export const MOCK_COMMUNITIES: Community[] = [
  {
    id: 'c1',
    name: 'Techno Argentina',
    prOwnerId: '2',
    coverImageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop',
    membersCount: 1250,
    description: 'Comunidad oficial para amantes del techno en Argentina. Noticias, lanzamientos y recomendaciones de fechas.',
  },
  {
    id: 'c2',
    name: 'Melodic & Progressive BA',
    prOwnerId: '1',
    coverImageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1974&auto=format&fit=crop',
    membersCount: 840,
    description: 'Espacio dedicado al sonido progresivo, melodic techno y deep house en Buenos Aires.',
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: '2',
    eventId: 'e1',
    title: 'Lanzamiento de tickets para Afterlife 2024',
    headerImageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop',
    content: '¡Ya están disponibles los tickets para Afterlife! No se queden afuera de la odisea visual de este año.',
    longContent: 'La preventa oficial de Afterlife Buenos Aires ya está habilitada para todos los miembros registrados. En esta edición contaremos con un nuevo diseño de escenario 360 grados y un sistema de sonido mejorado en Mandarine Park.\n\nRecomendamos adquirir sus entradas únicamente a través de canales verificados para evitar estafas. Los miembros con KYC verificado en root contarán con transferencia asegurada de tickets.',
    timestamp: '2024-02-15T10:00:00Z',
    likesCount: 145,
  },
  {
    id: 'p2',
    authorId: '3',
    communityId: 'c1',
    title: '¿A qué hora arranca Time Warp?',
    headerImageUrl: 'https://images.unsplash.com/photo-1514525253344-93168e974686?q=80&w=1974&auto=format&fit=crop',
    content: '¿Alguien sabe los horarios oficiales y por qué puerta se ingresa más rápido en Costa Salguero?',
    longContent: 'Hola a todos en la comunidad Techno Argentina. Quería consultar si alguno tiene el timetable filtrado o confirmado de Time Warp. El año pasado la fila por la puerta 2 demoraba bastante pasadas las 02:00 hs. ¿Recomiendan ir temprano o ingresar antes de la medianoche?',
    timestamp: '2024-02-16T12:00:00Z',
    likesCount: 24,
  },
  {
    id: 'p3',
    authorId: '1',
    communityId: 'c2',
    title: 'Guía de recomendaciones para disfrutar la noche con seguridad',
    headerImageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1974&auto=format&fit=crop',
    content: 'Consejos de hidratación, puntos de encuentro e identificación segura en grandes festivales.',
    longContent: 'Para asegurar que la experiencia en los próximos eventos masivos sea óptima para todos, desde la administración de root preparamos esta guía de buenas prácticas:\n\n1. Puntos de encuentro: Definir un lugar físico visible al ingresar al predio.\n2. Hidratación constante: Ubicar los puestos de agua gratuita antes de ingresar a la pista principal.\n3. Entradas verificadas: Utilizar el módulo de reventa segura en root para validar transferencias con protección KYC.\n\n¡Cuidémonos entre todos dentro y fuera de la pista!',
    timestamp: '2024-02-17T14:30:00Z',
    likesCount: 89,
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'cm1',
    targetId: 'e1',
    authorId: '2',
    content: '¡Increíble la puesta en escena que están armando! No se pierdan el set de Tale Of Us.',
    timestamp: '2024-02-16T14:20:00Z',
  },
  {
    id: 'cm2',
    targetId: 'e1',
    authorId: '3',
    content: '¿Alguien que venda 2 entradas VIP? Compro con transferencia verificada.',
    timestamp: '2024-02-16T16:45:00Z',
  },
  {
    id: 'cm3',
    targetId: 'p1',
    authorId: '3',
    content: 'Excelente data, recién compré mis pases por la plataforma.',
    timestamp: '2024-02-15T11:30:00Z',
  },
  {
    id: 'cm4',
    targetId: 'p2',
    authorId: '2',
    content: 'Abren puertas a las 22:00hs. Conviene ir antes de las 00:00hs para evitar demoras en el acceso.',
    timestamp: '2024-02-16T13:10:00Z',
  },
];

export const MOCK_TICKETS: ResaleTicket[] = [
  {
    id: 't1',
    eventId: 'e1',
    sellerId: '2',
    price: 45000,
    status: 'AVAILABLE',
  },
  {
    id: 't2',
    eventId: 'e1',
    sellerId: '3',
    buyerId: '1',
    price: 40000,
    status: 'PENDING_CONFIRMATION',
  },
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'ch1',
    participants: [MOCK_USERS[0], MOCK_USERS[1]],
    lastMessage: 'Perfecto, te paso el ticket por acá.',
    updatedAt: '2024-02-17T15:30:00Z',
  },
];

// Squad Matcher Mock Constants & Data
export const VIBE_GENRES = [
  'Melodic Techno',
  'Hard Techno',
  'Tech House',
  'Progressive House',
  'Minimal / Deep',
  'Afro House',
  'Psytrance',
];

export const DEPARTURE_ZONES = [
  'Palermo / Recoleta',
  'Costanera / Puerto Madero',
  'Zona Norte (San Isidro/Olivos)',
  'Zona Sur (Quilmes/Lomas)',
  'Zona Oeste (Ramos/Morón)',
  'La Plata',
];

export const PARTY_STYLES: { id: PartyStyle; label: string; description: string }[] = [
  { id: 'chill_previa', label: 'Previa Chill', description: 'Juntada previa con buena música antes del club' },
  { id: 'full_night', label: 'All-Night Crew', description: 'Desde la apertura hasta el after hours' },
  { id: 'main_act_only', label: 'Main Act Only', description: 'Foco exclusivo en el horario del DJ principal' },
];

export const DEFAULT_CURRENT_VIBE_PROFILE: UserVibeProfile = {
  userId: '3', // Santi User (default current user)
  favoriteGenres: ['Melodic Techno', 'Hard Techno', 'Tech House'],
  departureZone: 'Palermo / Recoleta',
  partyStyle: 'full_night',
  verifiedKycOnly: false,
  spotifyConnected: true,
};

export const MOCK_VIBE_PROFILES: Record<string, UserVibeProfile> = {
  '1': {
    userId: '1',
    favoriteGenres: ['Melodic Techno', 'Progressive House'],
    departureZone: 'Palermo / Recoleta',
    partyStyle: 'full_night',
    verifiedKycOnly: true,
    spotifyConnected: true,
  },
  '2': {
    userId: '2',
    favoriteGenres: ['Hard Techno', 'Tech House', 'Minimal / Deep'],
    departureZone: 'Costanera / Puerto Madero',
    partyStyle: 'chill_previa',
    verifiedKycOnly: true,
    spotifyConnected: true,
  },
  '3': DEFAULT_CURRENT_VIBE_PROFILE,
};

export const MOCK_SQUADS: EventSquad[] = [
  {
    id: 'sq1',
    eventId: 'e1',
    name: 'Afterlife Melodic Crew BA',
    members: [
      { userId: '1', hasTicket: true, joinedAt: '2024-02-17T10:00:00Z', role: 'host' },
      { userId: '2', hasTicket: true, joinedAt: '2024-02-17T10:15:00Z', role: 'member' },
      { userId: '3', hasTicket: false, joinedAt: '2024-02-17T10:30:00Z', role: 'member' },
    ],
    matchScore: 96,
    departureZone: 'Palermo / Recoleta',
    chatRoomId: 'sq_chat_1',
    status: 'active',
    createdAt: '2024-02-17T10:00:00Z',
    expiresAt: '2024-03-10T12:00:00Z',
  },
  {
    id: 'sq2',
    eventId: 'e2',
    name: 'Time Warp Underground Crew',
    members: [
      { userId: '2', hasTicket: true, joinedAt: '2024-02-16T18:00:00Z', role: 'host' },
      { userId: '1', hasTicket: true, joinedAt: '2024-02-16T18:20:00Z', role: 'member' },
    ],
    matchScore: 91,
    departureZone: 'Costanera / Puerto Madero',
    chatRoomId: 'sq_chat_2',
    status: 'forming',
    createdAt: '2024-02-16T18:00:00Z',
    expiresAt: '2024-04-07T12:00:00Z',
  },
];

export const MOCK_SQUAD_MESSAGES: SquadChatMessage[] = [
  {
    id: 'sqm_1',
    squadId: 'sq1',
    senderId: 'system',
    content: '¡Match de Crew completado para Afterlife Buenos Aires! 🎧 3 miembros conectados desde Palermo y Costanera. Todos en modo All-Night.',
    type: 'system_icebreaker',
    timestamp: '2024-02-17T10:30:00Z',
  },
  {
    id: 'sqm_2',
    squadId: 'sq1',
    senderId: '1',
    content: '¡Buenas gente! ¿Cómo andan? Yo salgo en auto desde Palermo por si alguno se suma.',
    type: 'text',
    timestamp: '2024-02-17T10:32:00Z',
  },
  {
    id: 'sqm_3',
    squadId: 'sq1',
    senderId: '2',
    content: '¡De una! Yo estoy a 5 cuadras de Plaza Serrano. Hacemos previa tranqui antes de arrancar tipo 23hs.',
    type: 'text',
    timestamp: '2024-02-17T10:35:00Z',
  },
];

