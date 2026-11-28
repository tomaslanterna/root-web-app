/**
 * "Mandanos tu evento": eventos que manda la gente y el equipo revisa antes de publicar.
 * Contrato del backend en `root-backend-service/AFTERS.md`.
 */

export type EventSubmitterRole = "organizer" | "rrpp" | "fan";
export type EventSubmissionStatus = "pending" | "published" | "rejected";

export interface EventSubmission {
  id: string;
  name: string;
  startsAt: string;
  venueName: string;
  venueAddress: string;
  flyerUrl: string;
  ticketUrl: string | null;
  lineup: string | null;
  genres: string[];
  submitterRole: EventSubmitterRole;
  status: EventSubmissionStatus;
  rejectReason: string | null;
  /** Evento creado al publicarlo. */
  eventId: string | null;
  createdAt: string;
}

export interface EventSubmissionInput {
  name: string;
  startsAt: string;
  venueName: string;
  venueAddress: string;
  flyerKey: string;
  ticketUrl?: string;
  lineup?: string;
  genres: string[];
  submitterRole: EventSubmitterRole;
  contact: string;
  rightsConfirmed: true;
}

export const EVENT_SUBMISSION_GENRES = ["Techno", "House", "Tech House", "Melodic Techno", "Afro House", "Hard Techno", "Cachengue", "Reggaetón"] as const;

export const SUBMITTER_ROLE_LABELS: Record<EventSubmitterRole, string> = {
  organizer: "Organizo el evento",
  rrpp: "Soy RRPP",
  fan: "Lo vi y quiero que esté",
};
