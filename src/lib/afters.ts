import type { AfterAccess, AfterSummary } from "@/types/afters";

/**
 * Fechas y textos de los afters. Todo se calcula en la hora de Montevideo, igual que los eventos.
 * Sin imports de runtime: los tests lo transpilan y lo corren aislado.
 */

export const AFTERS_TIME_ZONE = "America/Montevideo";
/** La "noche" va de las 12:00 de un día a las 12:00 del siguiente. */
const NIGHT_BREAK_HOUR = 12;
/** La franja "Afters de esta noche" se ve de 18:00 a 12:00. */
const STRIP_FROM_HOUR = 18;

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: AFTERS_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

export function zonedParts(date: Date): ZonedParts {
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/** Instante que en Montevideo marca esa fecha y hora (mes de 1 a 12; los desbordes de día se normalizan). */
export function zonedDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const p = zonedParts(new Date(guess));
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - guess;
  return new Date(guess - offset);
}

const pad = (n: number) => String(n).padStart(2, "0");
const capitalize = (text: string) => text.replace(/^\p{L}/u, (c) => c.toUpperCase());

/** Día (YYYY-MM-DD) en que empieza la noche de ese instante: antes de las 12:00 cuenta para la noche anterior. */
export function nightKey(date: Date): string {
  const p = zonedParts(date);
  const start = p.hour < NIGHT_BREAK_HOUR ? zonedDate(p.year, p.month, p.day - 1, 12) : zonedDate(p.year, p.month, p.day, 12);
  const s = zonedParts(start);
  return `${s.year}-${pad(s.month)}-${pad(s.day)}`;
}

const weekdayDay = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", timeZone: AFTERS_TIME_ZONE });
const shortDay = (date: Date) => weekdayDay.format(date).replace(/\./g, "").replace(",", "");

/** "Vie 27 → sáb 28" para la noche que empieza ese día. */
export function nightLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const first = zonedDate(year, month, day, 12);
  const second = zonedDate(year, month, day + 1, 12);
  return `${capitalize(shortDay(first))} → ${shortDay(second)}`;
}

export interface AfterNight<T> {
  key: string;
  label: string;
  isTonight: boolean;
  afters: T[];
}

/** Agrupa por noche y ordena por hora. La noche en curso queda marcada como "Esta noche". */
export function groupAftersByNight<T extends Pick<AfterSummary, "startsAt">>(afters: T[], now: Date = new Date()): AfterNight<T>[] {
  const tonight = nightKey(now);
  const groups = new Map<string, T[]>();
  const sorted = [...afters]
    .filter((after) => !Number.isNaN(new Date(after.startsAt).getTime()))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  for (const after of sorted) {
    // Lo que sigue en curso de una noche anterior va con "esta noche".
    const own = nightKey(new Date(after.startsAt));
    const key = own < tonight ? tonight : own;
    const list = groups.get(key);
    if (list) list.push(after);
    else groups.set(key, [after]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => ({
      key,
      isTonight: key === tonight,
      label: key === tonight ? `Esta noche · ${nightLabel(tonight)}` : nightLabel(key),
      afters: list,
    }));
}

/** Entre las 18:00 y las 12:00 se muestra la franja "Afters de esta noche". */
export function isAftersStripTime(now: Date = new Date()): boolean {
  const { hour } = zonedParts(now);
  return hour >= STRIP_FROM_HOUR || hour < NIGHT_BREAK_HOUR;
}

/** Desde ahora hasta las próximas 12:00 de Montevideo. */
export function tonightRange(now: Date = new Date()): { from: string; until: string } {
  const p = zonedParts(now);
  const noon = zonedDate(p.year, p.month, p.day + (p.hour < NIGHT_BREAK_HOUR ? 0 : 1), NIGHT_BREAK_HOUR);
  return { from: now.toISOString(), until: noon.toISOString() };
}

const timeFormatter = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: AFTERS_TIME_ZONE });

export function formatAfterTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isNaN(date.getTime()) ? "" : timeFormatter.format(date);
}

/** "Dom 29 · 06:30". */
export function formatAfterDay(iso: string | Date, withTime = true): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "";
  const day = capitalize(shortDay(date));
  return withTime ? `${day} · ${formatAfterTime(date)}` : day;
}

const longDay = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: AFTERS_TIME_ZONE });

/** "lun 30 nov". */
export function formatAfterLongDay(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return Number.isNaN(date.getTime()) ? "" : longDay.format(date).replace(/\./g, "").replace(",", "");
}

export function accessLabel(access: AfterAccess, price?: string | null): string {
  if (access === "free") return "Libre";
  if (access === "approval") return "Con aprobación";
  const text = price?.trim();
  return text ? `Entrada ${text}` : "Con entrada";
}

/** Con aprobación cuentan los aceptados; si no, los que marcaron Voy. */
export const attendeesOf = (after: Pick<AfterSummary, "access" | "acceptedCount" | "goingCount">) =>
  after.access === "approval" ? after.acceptedCount : after.goingCount;

/** "12/30" con cupo y aprobación; si no, "41 van". */
export function attendanceText(after: Pick<AfterSummary, "access" | "acceptedCount" | "goingCount" | "capacity">): string {
  const count = attendeesOf(after);
  if (after.access === "approval" && after.capacity) return `${count}/${after.capacity}`;
  return `${count} van`;
}

export function spotsLeft(after: Pick<AfterSummary, "access" | "acceptedCount" | "goingCount" | "capacity">): number | null {
  if (!after.capacity) return null;
  return Math.max(0, after.capacity - attendeesOf(after));
}

/** Se considera en curso o próximo mientras no pasó su fin (o 12 h desde que empezó). */
export function isAfterOver(after: Pick<AfterSummary, "startsAt" | "endsAt">, now: Date = new Date()): boolean {
  const start = new Date(after.startsAt).getTime();
  const end = after.endsAt ? new Date(after.endsAt).getTime() : start + 12 * 3_600_000;
  return Number.isFinite(end) && now.getTime() >= end;
}

/** "hace 20 min", "hace 3 h", "hace 2 d". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(1, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (Number.isNaN(minutes)) return "";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

/** Primer instante con esa hora de Montevideo estrictamente después de `after`. */
export function nextOccurrence(hour: number, minute: number, after: Date): Date {
  const p = zonedParts(after);
  for (let offset = 0; offset < 3; offset += 1) {
    const candidate = zonedDate(p.year, p.month, p.day + offset, hour, minute);
    if (candidate.getTime() > after.getTime()) return candidate;
  }
  return zonedDate(p.year, p.month, p.day + 1, hour, minute);
}

export interface StartShortcut {
  label: string;
  /** HH:MM */
  time: string;
}

/** Atajos de hora del formulario: "Al cierre · 07:00" (si la fiesta tiene hora de fin), 05:00, 06:00 y 06:30. */
export function startShortcuts(eventEnd: Date | null): StartShortcut[] {
  const base = ["05:00", "06:00", "06:30"].map((time) => ({ label: time, time }));
  if (!eventEnd || Number.isNaN(eventEnd.getTime())) return base;
  const close = formatAfterTime(eventEnd);
  return [{ label: `Al cierre · ${close}`, time: close }, ...base.filter((shortcut) => shortcut.time !== close)];
}

/** Hora elegida → instante: la primera vez que se da después del inicio de la fiesta (o de ahora). */
export function startsAtFor(time: string, reference: Date): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return nextOccurrence(hour, minute, reference);
}
