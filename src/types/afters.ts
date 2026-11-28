/**
 * Afters: fiestas posteriores que sube un usuario con la identidad verificada.
 * Contrato del backend en `root-backend-service/AFTERS.md` (base /v1, errores {status, message, code}).
 */

export type AfterAccess = "free" | "approval" | "ticket";
export type AfterStatus = "active" | "hidden" | "removed" | "archived";
export type AfterViewerStatus = "host" | "requested" | "accepted" | "rejected" | "going";

export interface AfterPerson {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
}

export interface AfterHost extends AfterPerson {
  isKycVerified: boolean;
}

export interface AfterEventRef {
  id: string;
  /** Para la URL (/events/<slug>). Si no viene, el link usa el id. */
  slug?: string | null;
  title: string;
  date: string;
  location: string;
  image?: string | null;
}

/**
 * Lo que sale en listados, embeds y tarjetas. Nunca trae la dirección exacta: solo la zona.
 */
export interface AfterSummary {
  id: string;
  name: string;
  coverUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  /** startsAt + 24 h. */
  archivesAt: string;
  /** Barrio o zona pública. */
  zone: string;
  access: AfterAccess;
  /** Texto libre ("$300"), solo con access = ticket. */
  price: string | null;
  ticketUrl: string | null;
  capacity: number | null;
  acceptedCount: number;
  goingCount: number;
  /** Lo calcula el backend: el host es organizador o RRPP del evento. */
  isOfficial: boolean;
  host: AfterHost;
  event: AfterEventRef | null;
  genres: string[];
  viewerStatus: AfterViewerStatus | null;
}

export interface AfterFollowedGoing {
  count: number;
  /** Hasta 4. */
  preview: AfterPerson[];
}

export interface AfterDetail extends AfterSummary {
  rules: string | null;
  lineup: string | null;
  addressVisible: boolean;
  /** null si quien mira no puede verla. */
  address: string | null;
  /** Solo para el host y los aceptados o los que van. */
  notice: string | null;
  noticeUpdatedAt: string | null;
  followedGoing: AfterFollowedGoing;
  canEdit: boolean;
  /** El host ve su after aunque esté archivado, oculto o sacado. */
  status?: AfterStatus;
}

export interface AfterListMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AfterListResponse {
  data: AfterSummary[];
  meta: AfterListMeta;
}

/** Lo que viene dentro de `GET /v1/events/:id` (campo `afters`), en la misma consulta. */
export interface AftersEventSummary {
  total: number;
  /** Hasta 3: el oficial primero y después por startsAt. */
  preview: AfterSummary[];
  /** Afters del evento en los que quien mira es host, pidió entrar, fue aceptado o va. */
  viewerAfterIds: string[];
}

export interface AfterJoinRequest extends AfterPerson {
  message: string | null;
  createdAt: string;
  status?: "requested" | "accepted" | "rejected" | "going" | "cancelled";
}

export interface AfterListParams {
  from?: string;
  until?: string;
  zone?: string;
  limit?: number;
  offset?: number;
}

export interface AfterInput {
  name: string;
  eventId?: string;
  startsAt: string;
  endsAt?: string;
  zone: string;
  address: string;
  access: AfterAccess;
  price?: string;
  ticketUrl?: string;
  capacity?: number;
  genres?: string[];
  lineup?: string;
  rules?: string;
  coverKey?: string;
}

/** Campos opcionales que se pueden vaciar al editar: el backend (PATCH) toma `null` como "quitarlo". */
type AfterClearableField = "eventId" | "endsAt" | "price" | "ticketUrl" | "capacity" | "lineup" | "rules" | "coverKey";

/** PATCH /v1/afters/:id. Un campo ausente no cambia; `null` en uno opcional lo vacía (por ejemplo, quitar la fiesta). */
export type AfterUpdateInput = Partial<Omit<AfterInput, AfterClearableField>> & {
  [K in AfterClearableField]?: AfterInput[K] | null;
} & {
  notice?: string;
};

export interface UploadedImage {
  key: string;
  url: string;
}

export const AFTER_NAME_MAX = 60;
export const AFTER_ZONE_MAX = 60;
export const AFTER_ADDRESS_MAX = 200;
export const AFTER_LINEUP_MAX = 120;
export const AFTER_RULES_MAX = 500;
export const AFTER_NOTICE_MAX = 280;
export const AFTER_MESSAGE_MAX = 280;
export const AFTER_REPORT_MAX = 280;
export const AFTER_MIN_CAPACITY = 2;
export const AFTER_MAX_CAPACITY = 500;
export const AFTER_MAX_GENRES = 5;
/** Cuánto antes de que empiece se puede subir: hasta 7 días adelante. */
export const AFTER_MAX_DAYS_AHEAD = 7;
export const AFTER_COVER_MAX_BYTES = 8 * 1024 * 1024;

export const AFTER_GENRES = ["Techno", "Hard Techno", "Minimal", "House", "Afro House", "Tech House", "Melodic Techno", "Cachengue", "Reggaetón"] as const;
