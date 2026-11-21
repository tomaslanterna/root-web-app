/**
 * Nombre y apellido obligatorios. Misma regla que el backend (domain.IsFullName): al menos dos palabras,
 * cada una con dos letras o más, y solo letras, apóstrofos, guiones o puntos.
 */
const WORD = /^[\p{L}'’.-]+$/u;

export function normalizeFullName(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).join(" ");
}

export function isFullName(name: string | null | undefined) {
  const words = normalizeFullName(name ?? "").split(" ").filter(Boolean);
  if (words.length < 2) return false;
  return words.every((word) => WORD.test(word) && (word.match(/\p{L}/gu)?.length ?? 0) >= 2);
}

export const FULL_NAME_ERROR = "Ingresá tu nombre y apellido.";
