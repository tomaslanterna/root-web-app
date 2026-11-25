/**
 * Crews temporales: grupos armados para ir juntos a un evento puntual.
 * Contrato del backend en `root-backend-service/TEMP_CREWS.md`.
 */

export type TempCrewRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type TempCrewViewerRole = "host" | "member";

export interface TempCrewPerson {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
}

export interface TempCrewEventRef {
  id: string;
  title: string;
  date: string;
  location: string;
  cinematicBannerUrl?: string | null;
}

export interface TempCrewSummary {
  id: string;
  name: string;
  /** Texto libre con el plan ("Previa en Pocitos desde las 22…"). */
  plan: string;
  /** Lugares totales, contando a quien la creó. De 2 a 10. */
  capacity: number;
  memberCount: number;
  /** false cuando quien la creó cerró las solicitudes o la crew se llenó. */
  isAdmitting: boolean;
  host: TempCrewPerson;
  /** Hasta 4 integrantes para las caritas de las tarjetas. */
  membersPreview: TempCrewPerson[];
  event: TempCrewEventRef;
  viewerRole: TempCrewViewerRole | null;
  viewerRequestStatus: TempCrewRequestStatus | null;
  /** Solo viene para quien la creó. */
  pendingRequestsCount?: number;
  /** El evento terminó: la crew sigue en la app pero ya no admite a nadie. */
  eventEnded?: boolean;
  /** @deprecated El backend ya no archiva crews. */
  archivesAt?: string | null;
}

export interface TempCrewListMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  /** Crew temporal del usuario en este evento (creada o integrada), si tiene una. */
  viewerCrewId?: string | null;
}

export interface TempCrewListResponse {
  data: TempCrewSummary[];
  meta: TempCrewListMeta;
}

/**
 * Resumen que puede venir dentro de `GET /v1/events/:id` (campo `tempCrews`): así la sección del evento
 * llega con el evento, sin otra llamada.
 */
export interface TempCrewsEventSummary {
  /** Cuántas crews admiten gente. */
  total: number;
  viewerCrewId: string | null;
  /** Hasta 3, con el mismo orden que `GET /v1/events/:id/temp-crews`. */
  preview: TempCrewSummary[];
}

/** Datos extra que trae `GET /v1/crews/:id` cuando la crew es temporal (`type: "temporary"`). */
export interface TempCrewDetailExtras {
  event: TempCrewEventRef;
  plan: string;
  capacity: number;
  isAdmitting: boolean;
  hostId: string;
  viewerRequestStatus: TempCrewRequestStatus | null;
  pendingRequestsCount?: number;
  eventEnded?: boolean;
  /** @deprecated El backend ya no archiva crews. */
  archivesAt?: string | null;
}

export interface TempCrewJoinRequest {
  id: string;
  crewId: string;
  status: TempCrewRequestStatus;
  message?: string | null;
  createdAt: string;
  user: TempCrewPerson & { isKycVerified?: boolean };
  /** Si quien pide marcó Voy en el evento. */
  isGoingToEvent?: boolean;
  mutualFriendsCount?: number;
}

export interface CreateTempCrewInput {
  name: string;
  capacity: number;
  plan: string;
}

export const TEMP_CREW_MIN_CAPACITY = 2;
export const TEMP_CREW_MAX_CAPACITY = 10;
export const TEMP_CREW_NAME_MAX = 40;
export const TEMP_CREW_PLAN_MAX = 280;
export const TEMP_CREW_MESSAGE_MAX = 280;
