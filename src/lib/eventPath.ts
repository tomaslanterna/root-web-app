/**
 * URLs de eventos: /events/danzeria-presenta-greggio en lugar del UUID.
 *
 * El backend arma el slug al crear el evento y no lo cambia (ver `root-backend-service/.../event_slug.go`).
 * GET /v1/events/:id acepta el UUID o el slug, así que los links viejos (notificaciones, compartidos, deep links)
 * siguen andando: el detalle carga igual y cambia la URL por la del slug.
 */

export interface EventLinkRef {
  id: string;
  slug?: string | null;
}

export type EventSection = "afters" | "crews" | "live";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isEventUuid(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

/** Lo que va en la URL: el slug si vino, si no el id. */
export function eventUrlKey(event: EventLinkRef): string {
  return event.slug?.trim() || event.id;
}

/** `/events/<slug>` (o `/events/<id>` si el evento todavía no tiene slug), con la sección opcional. */
export function eventPath(event: EventLinkRef, section?: EventSection): string {
  const base = `/events/${encodeURIComponent(eventUrlKey(event))}`;
  return section ? `${base}/${section}` : base;
}

/**
 * Si la URL del navegador tiene el UUID (o un slug con otras mayúsculas), la ruta equivalente con el slug,
 * conservando la sección, el query y el hash. null si no hay que cambiar nada.
 */
export function canonicalEventUrl(currentPath: string, param: string, event: EventLinkRef, suffix = ""): string | null {
  const slug = event.slug?.trim();
  if (!slug || param === slug) return null;
  const prefix = `/events/${encodeURIComponent(param)}`;
  const decoded = `/events/${param}`;
  const rest = currentPath.startsWith(prefix) ? currentPath.slice(prefix.length) : currentPath.startsWith(decoded) ? currentPath.slice(decoded.length) : null;
  if (rest === null || (rest !== "" && !rest.startsWith("/"))) return null;
  return `/events/${encodeURIComponent(slug)}${rest}${suffix}`;
}
