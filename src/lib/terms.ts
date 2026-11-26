import type { AuthUser } from "@/types/auth";
import { isFullName } from "@/lib/fullName";

/** Versión de Términos y Privacidad que se acepta al registrarse. Subirla cuando cambien `/terms` o `/privacy`. */
export const TERMS_VERSION = "2026-11";

/**
 * Le faltan datos al perfil (incluye nombre sin apellido, por ejemplo el de Google) o todavía no aceptó los
 * términos: primero pasa por /complete-profile.
 */
export function needsProfileCompletion(user: AuthUser): boolean {
  return !user.dob || !user.documentId || !user.country || !isFullName(user.name) || !user.termsAcceptedAt;
}
