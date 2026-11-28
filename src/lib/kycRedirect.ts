/**
 * Vuelta desde /kyc a la pantalla de origen. Solo se aceptan rutas internas: empiezan con "/" y no con "//"
 * (ni "/\", que algunos navegadores tratan igual), sin esquema ni caracteres de control. Cualquier otra cosa se ignora.
 */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\u007f\\]/.test(path)) return null;
  if (path === "/kyc" || path.startsWith("/kyc?") || path.startsWith("/kyc/")) return null;
  try {
    // Una ruta interna siempre se resuelve contra el mismo origen.
    const resolved = new URL(path, "https://root.invalid");
    if (resolved.origin !== "https://root.invalid") return null;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return null;
  }
}

/** Link al flujo de verificación que, al terminar, vuelve a `returnTo`. */
export function kycHref(returnTo: string | null | undefined): string {
  const safe = safeInternalPath(returnTo);
  return safe ? `/kyc?redirect=${encodeURIComponent(safe)}` : "/kyc";
}

/** Destino al terminar la verificación, leído de `?redirect=` (sin useSearchParams, para no necesitar Suspense). */
export function kycReturnPath(search: string): string | null {
  return safeInternalPath(new URLSearchParams(search).get("redirect"));
}

export type KycGateDecision = "login" | "verify" | "allow";

/** Qué hacer al tocar subir un after o mandar un evento: sin sesión, login; sin verificación, la hoja. */
export function kycGateDecision(user: { isKycVerified?: boolean } | null | undefined): KycGateDecision {
  if (!user) return "login";
  return user.isKycVerified === true ? "allow" : "verify";
}
