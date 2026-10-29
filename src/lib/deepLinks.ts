const IGNORED_GENERIC_HOSTS = new Set([
  "",
  "open",
  "app",
  "home",
  "urlroot",
  "root-web-app.vercel.app",
  "192.168.1.9",
  "localhost",
]);

function normalizeInternalPath(path: string): string {
  const withoutOpenPrefix = path.replace(/^\/open(\/|$)/i, "/");
  return withoutOpenPrefix.startsWith("/") ? withoutOpenPrefix : `/${withoutOpenPrefix}`;
}

/**
 * Convierte un deep link (ej: `root://events/123`, `root://crews/abc`,
 * `root://urlroot`, `https://root-web-app.vercel.app/open/crews/abc`)
 * en una ruta interna segura de Next.js (ej: `/events/123`).
 */
export function resolveDeepLinkPath(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol === "root:") {
      const host = parsed.hostname.toLowerCase();
      const rawPath = parsed.pathname || "";
      const searchAndHash = `${parsed.search || ""}${parsed.hash || ""}`;

      if (IGNORED_GENERIC_HOSTS.has(host)) {
        const cleanedPath = rawPath.replace(/^\/+/, "");
        return cleanedPath
          ? normalizeInternalPath(`/${cleanedPath}${searchAndHash}`)
          : "/feed";
      }

      const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
      const combined = normalizeInternalPath(
        `/${host}${normalizedPath === "/" ? "" : normalizedPath}${searchAndHash}`,
      );
      return combined.startsWith("//") ? "/feed" : combined;
    }

    if (protocol === "http:" || protocol === "https:") {
      const path = normalizeInternalPath(
        `${parsed.pathname || "/"}${parsed.search || ""}${parsed.hash || ""}`,
      );
      return path.startsWith("/") && !path.startsWith("//") ? path : "/feed";
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Genera una URL clickeable (http/https) para WhatsApp, Instagram, SMS, etc.
 * que al tocarla dispara automáticamente el deep link nativo `root://...`
 */
export function buildShareableDeepLink(internalPath: string): string {
  const clean = internalPath.replace(/^\/+/, "");
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://root-web-app.vercel.app";
  return `${origin}/open/${clean}`;
}
