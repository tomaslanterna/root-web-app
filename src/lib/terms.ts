import type { AuthUser } from "@/types/auth";
import { isFullName } from "@/lib/fullName";

/** Versión de Términos y Privacidad que se acepta al registrarse. Subirla cuando cambien `/terms` o `/privacy`. */
export const TERMS_VERSION = "2026-11";

/** Tiene nombre y apellido, fecha de nacimiento, documento y país (lo que pide /complete-profile). */
export function hasCompleteProfile(user: AuthUser): boolean {
  return Boolean(user.dob && user.documentId && user.country && isFullName(user.name));
}

/**
 * Le faltan datos al perfil (incluye nombre sin apellido, por ejemplo el de Google): primero pasa por
 * /complete-profile, donde también acepta los términos.
 */
export function needsProfileCompletion(user: AuthUser): boolean {
  return !hasCompleteProfile(user);
}

/**
 * Perfil completo pero sin los términos aceptados (cuentas anteriores al checkbox): no hace falta el formulario,
 * alcanza con la hoja de aceptación (TermsAcceptanceSheet), que aparece en cualquier pantalla.
 */
export function needsTermsAcceptance(user: AuthUser): boolean {
  return hasCompleteProfile(user) && !user.termsAcceptedAt;
}
