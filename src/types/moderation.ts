/** Qué se denuncia. Las denuncias generales las revisa el equipo de root (no los managers de una comunidad). */
export type ReportTargetType = "post" | "comment" | "message" | "user";

/** Motivo de la denuncia: spam, abuso (acoso, odio, contenido inapropiado) u otro. */
export type ReportReason = "spam" | "abuse" | "other";

/** Cuerpo de `POST /v1/reports`. */
export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

/**
 * Lo que se va a denunciar. Si tiene `communityId` (post o comentario de una comunidad), la denuncia va a la
 * administración de esa comunidad; si no, al equipo de root.
 */
export interface ReportTarget {
  targetType: ReportTargetType;
  targetId: string;
  communityId?: string;
}

/** Cuenta que bloqueaste (`GET /v1/users/me/blocks`). */
export interface BlockedUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  blockedAt: string;
}
