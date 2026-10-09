import type { AxiosError } from "axios";

export function recoveryError(error: AxiosError | null): string {
  if (!error) return "";
  if (error.response?.status === 429) return "Hiciste demasiados intentos. Esperá unos minutos antes de volver a probar.";
  if (error.response?.status === 503) return "La recuperación no está disponible en este momento. Intentá más tarde.";
  if (error.response?.status === 400) return "El enlace es inválido o venció, o los datos ingresados no son válidos. Solicitá otro enlace si es necesario.";
  return "No pudimos completar la solicitud. Revisá tu conexión e intentá nuevamente.";
}

export function resetPasswordValidation(password: string, confirm: string): string {
  if (password !== confirm) return "Las contraseñas no coinciden.";
  if (Array.from(password).length < 8 || new TextEncoder().encode(password).length > 72 || !password.trim()) return "Usá al menos 8 caracteres y como máximo 72 bytes.";
  return "";
}
