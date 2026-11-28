import type {
  AfterAccess,
  AfterDetail,
  AfterEventRef,
  AfterHost,
  AfterInput,
  AfterJoinRequest,
  AfterListParams,
  AfterListResponse,
  AfterPerson,
  AfterSummary,
  AfterUpdateInput,
  AfterViewerStatus,
  AftersEventSummary,
  UploadedImage,
} from "@/types/afters";
import type { EventSubmission, EventSubmissionInput } from "@/types/eventSubmissions";
import type { Event } from "@/types/events";
import { isAfterOver, nightKey, zonedDate } from "@/lib/afters";

/**
 * Datos de ejemplo de afters y de "Mandanos tu evento", guardados en este navegador.
 * Solo fuera de producción y con `localStorage["root:afters-demo"] = "1"`: sirven para probar las pantallas
 * mientras el backend no tenga los endpoints. Las personas, lugares y direcciones son inventados.
 * Imita las reglas del contrato (KYC, edad, cupo, 3 activos, dirección privada) para que se vean los errores.
 */

const FLAG_KEY = "root:afters-demo";
const STORE_KEY = "root:afters-demo-store";
const DEMO_PREFIX = "demo-af-";
const NIGHT_PREFIX = `${DEMO_PREFIX}n-`;
const ME = "me";

export function isAftersDemo(): boolean {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

type AttendeeStatus = "requested" | "accepted" | "rejected" | "going" | "cancelled";

interface DemoAfter {
  id: string;
  name: string;
  coverUrl: string | null;
  coverKey?: string | null;
  startsAt: string;
  endsAt: string | null;
  zone: string;
  address: string;
  access: AfterAccess;
  price: string | null;
  ticketUrl: string | null;
  capacity: number | null;
  genres: string[];
  lineup: string | null;
  rules: string | null;
  notice: string | null;
  noticeUpdatedAt: string | null;
  isOfficial: boolean;
  /** "me" = quien mira. */
  hostId: string;
  event: AfterEventRef | null;
  status: "active" | "hidden" | "removed";
  /** Gente inventada que ya va (o fue aceptada). */
  baseCount: number;
}

interface DemoAttendee {
  afterId: string;
  person: AfterPerson;
  status: AttendeeStatus;
  message: string | null;
  createdAt: string;
}

interface DemoStore {
  afters: DemoAfter[];
  attendees: DemoAttendee[];
  reports: string[];
  seededNight: string | null;
  seededEvents: string[];
  knownEvents: Record<string, AfterEventRef & { endDate?: string | null }>;
  submissions: EventSubmission[] | null;
}

const PEOPLE: AfterHost[] = [
  { userId: "demo-u1", name: "Martina Ríos", username: "martirios", isKycVerified: true },
  { userId: "demo-u2", name: "Joaquín Pérez", username: "joaco.p", isKycVerified: true },
  { userId: "demo-u3", name: "Lucía Fernández", username: "luferz", isKycVerified: true },
  { userId: "demo-u4", name: "Bruno Silva", username: "brunosilva", isKycVerified: true },
  { userId: "demo-u5", name: "Camila Duarte", username: "camiduarte", isKycVerified: true },
  { userId: "demo-u6", name: "Nico Varela", username: "nicovarela", isKycVerified: true },
  { userId: "demo-u7", name: "The Cube", username: "thecube.uy", isKycVerified: true },
];
const person = (username: string) => PEOPLE.find((p) => p.username === username) ?? PEOPLE[0];

const wait = () => new Promise((resolve) => setTimeout(resolve, 90));
const newId = () => `${DEMO_PREFIX}${Math.random().toString(36).slice(2, 10)}`;
const HOUR = 3_600_000;

function demoError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), { response: { status, data: { status, message, code } } });
}

interface Viewer extends AfterHost {
  dob?: string;
}

function viewer(): Viewer {
  try {
    const raw = JSON.parse(window.localStorage.getItem("root_user") || "{}");
    return {
      userId: String(raw.id ?? "demo-me"),
      name: raw.name || "Vos",
      username: raw.username || "vos",
      avatarUrl: raw.avatarUrl ?? null,
      isKycVerified: Boolean(raw.isKycVerified),
      dob: typeof raw.dob === "string" ? raw.dob : undefined,
    };
  } catch {
    return { userId: "demo-me", name: "Vos", username: "vos", isKycVerified: false };
  }
}

function requireSession() {
  try {
    if (!window.localStorage.getItem("root_jwt_token")) throw demoError(401, "unauthorized", "Iniciá sesión");
  } catch (error) {
    if ((error as { response?: unknown }).response) throw error;
  }
}

function requireKyc() {
  requireSession();
  if (!viewer().isKycVerified) throw demoError(403, "kyc_required", "Necesitás verificar tu identidad");
}

function requireAdult() {
  requireSession();
  const dob = viewer().dob;
  if (!dob) return;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return;
  const adult = new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate());
  if (adult.getTime() > Date.now()) throw demoError(403, "underage", "Tenés que ser mayor de 18");
}

function load(): DemoStore {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoStore>;
      return {
        afters: parsed.afters ?? [],
        attendees: parsed.attendees ?? [],
        reports: parsed.reports ?? [],
        seededNight: parsed.seededNight ?? null,
        seededEvents: parsed.seededEvents ?? [],
        knownEvents: parsed.knownEvents ?? {},
        submissions: parsed.submissions ?? null,
      };
    }
  } catch {
    // datos rotos: se arranca de cero
  }
  return { afters: [], attendees: [], reports: [], seededNight: null, seededEvents: [], knownEvents: {}, submissions: null };
}

function save(store: DemoStore) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // sin espacio (por ejemplo, una portada grande): los cambios quedan solo en memoria
  }
}

/** Instante a esa hora de Montevideo, `dayOffset` días después del día en que empieza la noche `key`. */
function at(key: string, dayOffset: number, hour: number, minute = 0) {
  const [y, m, d] = key.split("-").map(Number);
  return zonedDate(y, m, d + dayOffset, hour, minute).toISOString();
}

const RULES_APPROVAL = "Solo mayores de 18.\nEntrás si te aceptan: no hay lista en la puerta.\nSin fotos ni videos en la pista.";

interface Seed extends Omit<DemoAfter, "id" | "startsAt" | "endsAt" | "status" | "notice" | "noticeUpdatedAt" | "coverUrl"> {
  slug: string;
  day: number;
  hour: number;
  minute?: number;
  endHour?: number;
}

function nightSeeds(): Seed[] {
  const unreal: AfterEventRef = { id: "demo-ev-unreal", title: "Unreal 2nd anniversary", date: "", location: "The Cube" };
  const dizco: AfterEventRef = { id: "demo-ev-dizco", title: "Dizco aniversario", date: "", location: "Canelones 1963" };
  const reverb: AfterEventRef = { id: "demo-ev-reverb", title: "Reverb presenta Ezequiel Arias", date: "", location: "Hangar 33" };
  return [
    { slug: "unreal", day: 1, hour: 6, endHour: 12, name: "After Unreal", zone: "Centro", address: "Soriano 1210", access: "ticket", price: "$300", ticketUrl: "https://example.com/entradas/after-unreal", capacity: null, genres: ["Techno", "Hard Techno"], lineup: "Residentes de The Cube", rules: "Solo mayores de 18.\nEntrada en la puerta o con link.", isOfficial: true, hostId: "demo-u7", event: unreal, baseCount: 41 },
    { slug: "palermo", day: 1, hour: 6, name: "Afterhours en Palermo", zone: "Palermo", address: "Gaboto 1442, apto 2", access: "approval", price: null, ticketUrl: null, capacity: 30, genres: ["House", "Tech House"], lineup: "Martina Ríos", rules: RULES_APPROVAL, isOfficial: false, hostId: "demo-u1", event: dizco, baseCount: 12 },
    { slug: "desayuno", day: 1, hour: 7, endHour: 13, name: "Desayuno techno", zone: "Parque Rodó", address: "Bulevar España 2310", access: "approval", price: null, ticketUrl: null, capacity: 30, genres: ["Techno", "Minimal"], lineup: null, rules: "Traé algo para compartir.\nSin fotos en la pista.", isOfficial: false, hostId: ME, event: null, baseCount: 9 },
    { slug: "rooftop", day: 1, hour: 6, minute: 30, name: "Rooftop al amanecer", zone: "Punta Carretas", address: "Ellauri 350, azotea", access: "approval", price: null, ticketUrl: null, capacity: 20, genres: ["Melodic Techno"], lineup: "Lucía Fernández b2b Camila Duarte", rules: RULES_APPROVAL, isOfficial: false, hostId: "demo-u3", event: dizco, baseCount: 8 },
    { slug: "reverb", day: 2, hour: 7, endHour: 13, name: "After oficial Reverb", zone: "Ciudad Vieja", address: "Rincón 620", access: "ticket", price: "$400", ticketUrl: "https://example.com/entradas/after-reverb", capacity: null, genres: ["Techno"], lineup: "Ezequiel Arias (extended)", rules: null, isOfficial: true, hostId: "demo-u7", event: reverb, baseCount: 64 },
    { slug: "cordon", day: 2, hour: 6, minute: 30, endHour: 12, name: "After en Cordón", zone: "Cordón", address: "Constituyente 1820, apto 3", access: "approval", price: null, ticketUrl: null, capacity: 40, genres: ["Techno", "Hard Techno", "Minimal"], lineup: "Bruno Silva b2b Nico Varela", rules: RULES_APPROVAL, isOfficial: false, hostId: "demo-u4", event: reverb, baseCount: 18 },
    { slug: "rambla", day: 2, hour: 7, name: "Sunrise en la Rambla", zone: "Pocitos", address: "Rambla y Brito del Pino", access: "free", price: null, ticketUrl: null, capacity: null, genres: ["House", "Afro House"], lineup: null, rules: null, isOfficial: false, hostId: "demo-u5", event: reverb, baseCount: 32 },
    { slug: "malvin", day: 2, hour: 6, name: "Techno en Malvín", zone: "Malvín", address: "Orinoco 4890", access: "approval", price: null, ticketUrl: null, capacity: 25, genres: ["Hard Techno"], lineup: null, rules: RULES_APPROVAL, isOfficial: false, hostId: "demo-u6", event: null, baseCount: 7 },
  ];
}

const REQUEST_SEED = [
  { username: "brunosilva", message: "Salgo de Hangar con dos amigos, ¿hay lugar?" },
  { username: "camiduarte", message: "Voy sola, llevo hielo." },
  { username: "nicovarela", message: null },
];

function fromSeed(seed: Seed, key: string, id: string): DemoAfter {
  const { slug: _slug, day, hour, minute = 0, endHour, ...rest } = seed;
  void _slug;
  return {
    ...rest,
    id,
    coverUrl: null,
    startsAt: at(key, day, hour, minute),
    endsAt: endHour ? at(key, day, endHour) : null,
    status: "active",
    notice: null,
    noticeUpdatedAt: null,
  };
}

/** Los afters de ejemplo de la noche actual y la siguiente se regeneran cada noche. */
function seedNight(store: DemoStore) {
  const key = nightKey(new Date());
  if (store.seededNight === key) return;
  const stale = new Set(store.afters.filter((a) => a.id.startsWith(NIGHT_PREFIX)).map((a) => a.id));
  store.afters = store.afters.filter((a) => !stale.has(a.id));
  store.attendees = store.attendees.filter((a) => !stale.has(a.afterId));
  const me = viewer();
  for (const seed of nightSeeds()) {
    const after = fromSeed(seed, key, `${NIGHT_PREFIX}${seed.slug}`);
    store.afters.push(after);
  }
  // Uno al que ya te aceptaron (con dirección y aviso) y solicitudes para el tuyo.
  const rooftop = store.afters.find((a) => a.id === `${NIGHT_PREFIX}rooftop`);
  if (rooftop) {
    rooftop.notice = "Timbre azotea. Si traés algo para tomar, mejor. Arrancamos apenas cierra Dizco.";
    rooftop.noticeUpdatedAt = new Date(Date.now() - 20 * 60_000).toISOString();
    store.attendees.push({ afterId: rooftop.id, person: me, status: "accepted", message: "Voy con una amiga.", createdAt: new Date(Date.now() - 2 * HOUR).toISOString() });
  }
  REQUEST_SEED.forEach((seed, index) => {
    store.attendees.push({
      afterId: `${NIGHT_PREFIX}desayuno`,
      person: person(seed.username),
      status: "requested",
      message: seed.message,
      createdAt: new Date(Date.now() - (index + 3) * HOUR).toISOString(),
    });
  });
  store.seededNight = key;
}

/** Afters de ejemplo atados a un evento real (se crean la primera vez que se abre). */
function seedEvent(store: DemoStore, event: AfterEventRef & { endDate?: string | null }) {
  store.knownEvents[event.id] = event;
  if (store.seededEvents.includes(event.id)) return;
  store.seededEvents.push(event.id);
  const start = eventStart(event.date) ?? new Date();
  const short = event.title.split(/\s+/).slice(0, 2).join(" ");
  const base = (hours: number) => new Date(start.getTime() + hours * HOUR).toISOString();
  const prefix = `${DEMO_PREFIX}e-${event.id.slice(0, 8)}-`;
  const make = (slug: string, after: Omit<DemoAfter, "id" | "status" | "notice" | "noticeUpdatedAt" | "coverUrl">) =>
    store.afters.push({ ...after, id: `${prefix}${slug}`, status: "active", notice: null, noticeUpdatedAt: null, coverUrl: null });
  make("oficial", { name: `After oficial ${short}`, startsAt: base(7.5), endsAt: base(13), zone: "Ciudad Vieja", address: "Rincón 620", access: "ticket", price: "$400", ticketUrl: "https://example.com/entradas/after-oficial", capacity: null, genres: ["Techno"], lineup: null, rules: null, isOfficial: true, hostId: "demo-u7", event, baseCount: 64 });
  make("cordon", { name: "After en Cordón", startsAt: base(7), endsAt: base(12.5), zone: "Cordón", address: "Constituyente 1820, apto 3", access: "approval", price: null, ticketUrl: null, capacity: 40, genres: ["Techno", "Hard Techno", "Minimal"], lineup: "Bruno Silva b2b Nico Varela", rules: RULES_APPROVAL, isOfficial: false, hostId: "demo-u4", event, baseCount: 18 });
  make("rambla", { name: "Sunrise en la Rambla", startsAt: base(7.5), endsAt: null, zone: "Pocitos", address: "Rambla y Brito del Pino", access: "free", price: null, ticketUrl: null, capacity: null, genres: ["House"], lineup: null, rules: null, isOfficial: false, hostId: "demo-u5", event, baseCount: 32 });
  make("prado", { name: "Hasta que salga el sol", startsAt: base(8), endsAt: null, zone: "Prado", address: "Agraciada 3500", access: "approval", price: null, ticketUrl: null, capacity: 15, genres: ["Minimal"], lineup: null, rules: RULES_APPROVAL, isOfficial: false, hostId: "demo-u2", event, baseCount: 6 });
}

/** Los eventos guardan la hora de Montevideo con "Z": se corrige igual que `parseEventRealDate`. */
function eventStart(raw: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(" ", "T");
  const withOffset = trimmed.replace(/(?:Z|[+-]00(?::?00)?)$/i, "-03:00");
  const date = new Date(/[+-]\d{2}:?\d{2}$/.test(withOffset) ? withOffset : `${withOffset}-03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hostOf(after: DemoAfter): AfterHost {
  if (after.hostId === ME) return viewer();
  return PEOPLE.find((p) => p.userId === after.hostId) ?? PEOPLE[0];
}

function myRecord(store: DemoStore, after: DemoAfter) {
  const me = viewer();
  return [...store.attendees].reverse().find((a) => a.afterId === after.id && a.person.userId === me.userId && a.status !== "cancelled");
}

function viewerStatus(store: DemoStore, after: DemoAfter): AfterViewerStatus | null {
  if (after.hostId === ME) return "host";
  const status = myRecord(store, after)?.status;
  return status && status !== "cancelled" ? status : null;
}

function counts(store: DemoStore, after: DemoAfter) {
  const real = store.attendees.filter((a) => a.afterId === after.id);
  const accepted = real.filter((a) => a.status === "accepted").length;
  const going = real.filter((a) => a.status === "going").length;
  return after.access === "approval"
    ? { acceptedCount: after.baseCount + accepted, goingCount: after.baseCount + accepted }
    : { acceptedCount: 0, goingCount: after.baseCount + going };
}

function summary(store: DemoStore, after: DemoAfter): AfterSummary {
  return {
    id: after.id,
    name: after.name,
    coverUrl: after.coverUrl,
    startsAt: after.startsAt,
    endsAt: after.endsAt,
    archivesAt: new Date(new Date(after.startsAt).getTime() + 24 * HOUR).toISOString(),
    zone: after.zone,
    access: after.access,
    price: after.access === "ticket" ? after.price : null,
    ticketUrl: after.access === "ticket" ? after.ticketUrl : null,
    capacity: after.capacity,
    ...counts(store, after),
    isOfficial: after.isOfficial,
    host: hostOf(after),
    event: after.event ? { id: after.event.id, title: after.event.title, date: after.event.date, location: after.event.location, image: after.event.image ?? null } : null,
    genres: after.genres,
    viewerStatus: viewerStatus(store, after),
  };
}

function detail(store: DemoStore, after: DemoAfter): AfterDetail {
  const base = summary(store, after);
  const isHost = base.viewerStatus === "host";
  const isIn = base.viewerStatus === "accepted" || base.viewerStatus === "going";
  const addressVisible = isHost || after.access !== "approval" || base.viewerStatus === "accepted";
  return {
    ...base,
    rules: after.rules,
    lineup: after.lineup,
    addressVisible,
    // Igual que el backend: si no la puede ver, ni siquiera viaja.
    address: addressVisible ? after.address : null,
    notice: isHost || isIn ? after.notice : null,
    noticeUpdatedAt: isHost || isIn ? after.noticeUpdatedAt : null,
    followedGoing: isHost ? { count: 0, preview: [] } : { count: 4, preview: PEOPLE.slice(0, 4).map(({ userId, name, username }) => ({ userId, name, username })) },
    canEdit: isHost,
    status: isHost ? after.status : undefined,
  };
}

const isVisible = (after: DemoAfter, now = new Date()) =>
  after.status === "active" && !isAfterOver(after, now);

function findAfter(store: DemoStore, id: string) {
  const after = store.afters.find((a) => a.id === id);
  if (!after) throw demoError(404, "not_found", "El after no existe");
  return after;
}

function hosted(store: DemoStore, id: string) {
  const after = findAfter(store, id);
  if (after.hostId !== ME) throw demoError(403, "not_host", "Solo quien lo organiza puede hacer esto");
  return after;
}

function ordered(list: AfterSummary[]) {
  return [...list].sort((a, b) => Number(b.isOfficial) - Number(a.isOfficial) || a.startsAt.localeCompare(b.startsAt));
}

const MONTEVIDEO_ZONES = ["montevideo"];

function zoneMatches(after: DemoAfter, zone?: string) {
  const query = zone?.trim().toLowerCase();
  if (!query) return true;
  if (MONTEVIDEO_ZONES.includes(query)) return true;
  return after.zone.toLowerCase().includes(query);
}

function validateInput(store: DemoStore, input: AfterUpdateInput, current?: DemoAfter) {
  if (input.startsAt !== undefined) {
    const start = new Date(input.startsAt).getTime();
    if (Number.isNaN(start) || start < Date.now() - 5 * 60_000 || start > Date.now() + 7 * 24 * HOUR) {
      throw demoError(422, "invalid_starts_at", "El after tiene que empezar entre ahora y 7 días adelante");
    }
  }
  const access = input.access ?? current?.access;
  const ticketUrl = input.ticketUrl ?? current?.ticketUrl ?? "";
  if (access === "ticket" && !/^https:\/\//i.test(ticketUrl)) {
    throw demoError(422, "invalid_ticket_url", "El link de entradas tiene que empezar con https://");
  }
  if (input.eventId && !store.knownEvents[input.eventId]) throw demoError(422, "invalid_event", "La fiesta no existe o ya terminó");
}

async function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

/** Imágenes subidas en esta sesión (la clave que se manda después en el body). */
const uploads = new Map<string, string>();

export const aftersDemo = {
  async embedForEvent(event: Event): Promise<AftersEventSummary> {
    const store = load();
    seedNight(store);
    seedEvent(store, { id: event.id, title: event.title, date: event.date, location: event.location, image: event.cinematicBannerUrl || null, endDate: event.endDate ?? null });
    save(store);
    const list = ordered(store.afters.filter((a) => a.event?.id === event.id && isVisible(a)).map((a) => summary(store, a)));
    return { total: list.length, preview: list.slice(0, 3), viewerAfterIds: list.filter((a) => a.viewerStatus && a.viewerStatus !== "rejected").map((a) => a.id) };
  },

  async listForEvent(eventId: string, params: { limit?: number; offset?: number }): Promise<AfterListResponse> {
    await wait();
    const store = load();
    seedNight(store);
    save(store);
    const list = ordered(store.afters.filter((a) => a.event?.id === eventId && isVisible(a)).map((a) => summary(store, a)));
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return { data: list.slice(offset, offset + limit), meta: { total: list.length, limit, offset, hasMore: offset + limit < list.length } };
  },

  async list(params: AfterListParams): Promise<AfterListResponse> {
    await wait();
    const store = load();
    seedNight(store);
    save(store);
    const from = params.from ? new Date(params.from) : new Date();
    const until = params.until ? new Date(params.until).getTime() : Infinity;
    const list = store.afters
      .filter((a) => isVisible(a, from) && new Date(a.startsAt).getTime() < until && zoneMatches(a, params.zone))
      .map((a) => summary(store, a))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return { data: list.slice(offset, offset + limit), meta: { total: list.length, limit, offset, hasMore: offset + limit < list.length } };
  },

  async get(id: string): Promise<AfterDetail> {
    await wait();
    const store = load();
    seedNight(store);
    save(store);
    const after = findAfter(store, id);
    const archived = Date.now() > new Date(after.startsAt).getTime() + 24 * HOUR;
    if (after.hostId !== ME && (after.status !== "active" || archived)) throw demoError(404, "not_found", "El after no existe");
    const shown = detail(store, after);
    return archived && shown.status === "active" ? { ...shown, status: "archived" } : shown;
  },

  async uploadImage(file: Blob): Promise<UploadedImage> {
    await wait();
    requireKyc();
    const url = await readAsDataUrl(file);
    const key = `demo-img-${Math.random().toString(36).slice(2, 10)}`;
    uploads.set(key, url);
    return { key, url };
  },

  async create(input: AfterInput): Promise<AfterDetail> {
    await wait();
    requireKyc();
    const store = load();
    validateInput(store, input);
    const active = store.afters.filter((a) => a.hostId === ME && isVisible(a)).length;
    if (active >= 3) throw demoError(429, "too_many_active", "Ya tenés 3 afters activos");
    const event = input.eventId ? store.knownEvents[input.eventId] : null;
    const after: DemoAfter = {
      id: newId(),
      name: input.name.trim(),
      coverUrl: input.coverKey ? uploads.get(input.coverKey) ?? null : null,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      zone: input.zone.trim(),
      address: input.address.trim(),
      access: input.access,
      price: input.price?.trim() || null,
      ticketUrl: input.ticketUrl?.trim() || null,
      capacity: input.capacity ?? null,
      genres: input.genres ?? [],
      lineup: input.lineup?.trim() || null,
      rules: input.rules?.trim() || null,
      notice: null,
      noticeUpdatedAt: null,
      // Nunca viene del cliente: en el ejemplo, ningún after propio es oficial.
      isOfficial: false,
      hostId: ME,
      event: event ? { id: event.id, title: event.title, date: event.date, location: event.location, image: event.image ?? null } : null,
      status: "active",
      baseCount: 0,
    };
    store.afters.unshift(after);
    if (after.access === "approval") {
      REQUEST_SEED.forEach((seed, index) => {
        store.attendees.push({ afterId: after.id, person: person(seed.username), status: "requested", message: seed.message, createdAt: new Date(Date.now() - (index + 1) * 600_000).toISOString() });
      });
    }
    save(store);
    return detail(store, after);
  },

  async update(id: string, input: AfterUpdateInput): Promise<AfterDetail> {
    await wait();
    const store = load();
    const after = hosted(store, id);
    // El aviso solo no pide KYC en el ejemplo; el resto de la edición sí.
    const onlyNotice = Object.keys(input).every((k) => k === "notice");
    if (!onlyNotice) requireKyc();
    validateInput(store, input, after);
    const { eventId, coverKey, notice, ...rest } = input;
    Object.assign(after, Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)));
    if (eventId !== undefined) {
      const event = eventId ? store.knownEvents[eventId] : null;
      after.event = event ? { id: event.id, title: event.title, date: event.date, location: event.location, image: event.image ?? null } : null;
    }
    if (coverKey) after.coverUrl = uploads.get(coverKey) ?? after.coverUrl;
    if (notice !== undefined) {
      after.notice = notice.trim() || null;
      after.noticeUpdatedAt = new Date().toISOString();
    }
    save(store);
    return detail(store, after);
  },

  async remove(id: string): Promise<void> {
    await wait();
    const store = load();
    hosted(store, id).status = "removed";
    save(store);
  },

  async join(id: string, message?: string): Promise<AfterDetail> {
    await wait();
    requireAdult();
    const store = load();
    const after = findAfter(store, id);
    if (after.hostId === ME) throw demoError(409, "already_joined", "Sos quien lo organiza");
    if (isAfterOver(after)) throw demoError(409, "after_ended", "El after ya terminó");
    // Quien fue rechazado no puede volver a pedir; quien canceló, sí.
    if (myRecord(store, after)) throw demoError(409, "already_joined", "Ya pediste entrar o ya vas");
    const left = after.capacity ? after.capacity - (after.access === "approval" ? counts(store, after).acceptedCount : counts(store, after).goingCount) : Infinity;
    if (left <= 0) throw demoError(409, "after_full", "El after se llenó");
    const status: AttendeeStatus = after.access === "approval" ? "requested" : "going";
    store.attendees.push({ afterId: id, person: viewer(), status, message: message?.trim() || null, createdAt: new Date().toISOString() });
    save(store);
    return detail(store, after);
  },

  async leave(id: string): Promise<void> {
    await wait();
    const store = load();
    const me = viewer();
    store.attendees.forEach((a) => {
      if (a.afterId === id && a.person.userId === me.userId && a.status !== "rejected") a.status = "cancelled";
    });
    save(store);
  },

  async listRequests(id: string): Promise<AfterJoinRequest[]> {
    await wait();
    const store = load();
    hosted(store, id);
    return store.attendees
      .filter((a) => a.afterId === id && a.status === "requested")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => ({ ...a.person, message: a.message, createdAt: a.createdAt }));
  },

  async respond(id: string, userId: string, decision: "accept" | "reject"): Promise<void> {
    await wait();
    const store = load();
    const after = hosted(store, id);
    const request = store.attendees.find((a) => a.afterId === id && a.person.userId === userId && a.status === "requested");
    if (!request) throw demoError(409, "not_requested", "La solicitud ya no está pendiente");
    if (decision === "accept") {
      if (after.capacity && counts(store, after).acceptedCount >= after.capacity) throw demoError(409, "after_full", "El after se llenó");
      request.status = "accepted";
    } else {
      request.status = "rejected";
    }
    save(store);
  },

  async report(id: string): Promise<void> {
    await wait();
    requireSession();
    const store = load();
    findAfter(store, id);
    if (!store.reports.includes(id)) store.reports.push(id);
    save(store);
  },

  // --- Mandanos tu evento ---

  async similarEvents(name: string): Promise<Event[]> {
    await wait();
    const words = name.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
    if (words.length === 0) return [];
    const store = load();
    const catalog: (AfterEventRef & { endDate?: string | null })[] = [
      { id: "demo-ev-warehouse", title: "The Warehouse x La Fiesta de la X", date: "2026-12-11T18:00:00Z", location: "The Warehouse", image: null },
      { id: "demo-ev-reverb", title: "Reverb presenta Ezequiel Arias", date: "2026-11-28T23:30:00Z", location: "Hangar 33", image: null },
      ...Object.values(store.knownEvents),
    ];
    return catalog
      .filter((e) => words.some((w) => e.title.toLowerCase().includes(w)))
      .slice(0, 3)
      .map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        location: e.location,
        cinematicBannerUrl: e.image ?? "",
        description: "",
        lineup: [],
        isFree: false,
        isFeatured: false,
        goingCount: 0,
        notGoingCount: 0,
        createdAt: e.date,
      }));
  },

  async createSubmission(input: EventSubmissionInput): Promise<EventSubmission> {
    await wait();
    requireKyc();
    const store = load();
    const mine = submissionsOf(store);
    if (mine.filter((s) => s.status === "pending").length >= 5) throw demoError(429, "too_many_pending", "Tenés 5 eventos en revisión");
    const submission: EventSubmission = {
      id: newId(),
      name: input.name.trim(),
      startsAt: input.startsAt,
      venueName: input.venueName.trim(),
      venueAddress: input.venueAddress.trim(),
      flyerUrl: uploads.get(input.flyerKey) ?? "",
      ticketUrl: input.ticketUrl?.trim() || null,
      lineup: input.lineup?.trim() || null,
      genres: input.genres,
      submitterRole: input.submitterRole,
      status: "pending",
      rejectReason: null,
      eventId: null,
      createdAt: new Date().toISOString(),
    };
    store.submissions = [submission, ...mine];
    save(store);
    return submission;
  },

  async mySubmissions(): Promise<EventSubmission[]> {
    await wait();
    requireSession();
    const store = load();
    const mine = submissionsOf(store);
    store.submissions = mine;
    save(store);
    return [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};

function submissionsOf(store: DemoStore): EventSubmission[] {
  if (store.submissions) return store.submissions;
  const known = Object.values(store.knownEvents)[0];
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * HOUR).toISOString();
  return [
    { id: `${DEMO_PREFIX}s-pista3`, name: "Fin de año en Pista 3", startsAt: "2026-12-31T23:59:00-03:00", venueName: "Pista 3", venueAddress: "Rambla Sur 1200", flyerUrl: "", ticketUrl: "https://example.com/entradas/pista3", lineup: null, genres: ["Techno"], submitterRole: "organizer", status: "published", rejectReason: null, eventId: known?.id ?? null, createdAt: daysAgo(7) },
    { id: `${DEMO_PREFIX}s-fede`, name: "After en casa de Fede", startsAt: "2026-11-28T06:00:00-03:00", venueName: "Casa de Fede", venueAddress: "Privado", flyerUrl: "", ticketUrl: null, lineup: null, genres: ["House"], submitterRole: "fan", status: "rejected", rejectReason: "Es una juntada privada: subila como after desde el evento.", eventId: null, createdAt: daysAgo(5) },
  ];
}
