/** Errores del backend con forma {status, message, code}. */
export interface ApiErrorLike {
  response?: { status?: number; data?: unknown };
}

export function apiErrorCode(error: unknown): string | null {
  const data = (error as ApiErrorLike | null)?.response?.data;
  const code = data && typeof data === "object" ? (data as { code?: unknown }).code : undefined;
  return typeof code === "string" ? code : null;
}

export function apiErrorStatus(error: unknown): number | null {
  const status = (error as ApiErrorLike | null)?.response?.status;
  return typeof status === "number" ? status : null;
}

/** 403 "kyc_required": la acción pide la identidad verificada. */
export const isKycRequiredError = (error: unknown) => apiErrorCode(error) === "kyc_required";

const MESSAGES: Record<string, string> = {
  kyc_required: "Necesitás verificar tu identidad.",
  underage: "Los afters son solo para mayores de 18. Si no cargaste tu fecha de nacimiento, completala en tu perfil.",
  content_policy: "Algo del texto no cumple las reglas de root. Revisá el nombre, las reglas o el mensaje y probá de nuevo.",
  invalid_request: "Revisá los datos: hay algo que no está bien.",
  invalid_id: "El enlace no es válido.",
  forbidden: "No tenés permiso para hacer esto.",
  request_not_found: "Esa solicitud ya no existe.",
  event_not_found: "No encontramos esa fiesta.",
  request_not_pending: "Esa solicitud ya fue respondida.",
  not_pending: "Ya no está pendiente.",
  host_cannot_leave: "Sos quien organiza: no podés dejar de ir a tu propio after.",
  too_large: "La imagen es muy pesada (máximo 8 MB).",
  unsupported_media_type: "Usá una imagen JPG, PNG o WebP.",
  unavailable: "No pudimos subir la imagen ahora. Probá en un rato.",
  after_full: "El after se llenó.",
  already_joined: "Ya pediste entrar o ya vas a este after.",
  after_ended: "Este after ya terminó.",
  too_many_active: "Ya tenés 3 afters activos. Borrá uno para subir otro.",
  invalid_event: "Esa fiesta no existe o ya terminó hace más de 12 h.",
  not_host: "Solo quien organiza el after puede hacer esto.",
  not_found: "Este after ya no está disponible.",
  too_many_pending: "Ya tenés 5 eventos en revisión. Esperá a que revisemos alguno.",
  invalid_starts_at: "El after tiene que empezar entre ahora y 7 días adelante (y después de la fiesta).",
  invalid_ticket_url: "El link de entradas tiene que empezar con https://.",
};

/** Texto para mostrar: primero el código conocido, después el mensaje del backend y si no, `fallback`. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const code = apiErrorCode(error);
  if (code && MESSAGES[code]) return MESSAGES[code];
  const status = apiErrorStatus(error);
  if (status === 401) return "Tenés que iniciar sesión.";
  if (status === 429) return "Hiciste muchos intentos. Probá más tarde.";
  const data = (error as ApiErrorLike | null)?.response?.data;
  const message = data && typeof data === "object" ? (data as { message?: unknown }).message : undefined;
  if (typeof message === "string" && message.trim() && status !== null && status < 500) return message.trim();
  return fallback;
}
