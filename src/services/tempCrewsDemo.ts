import type {
  CreateTempCrewInput,
  TempCrewDetailExtras,
  TempCrewEventRef,
  TempCrewJoinRequest,
  TempCrewListResponse,
  TempCrewPerson,
  TempCrewRequestStatus,
  TempCrewSummary,
} from "@/types/tempCrews";

/**
 * Datos de ejemplo de crews temporales, guardados en este navegador.
 * Solo fuera de producción y con `localStorage["root:temp-crews-demo"] = "1"`: sirven para probar
 * las pantallas mientras el backend no tenga los endpoints. Las personas son inventadas.
 */

const FLAG_KEY = "root:temp-crews-demo";
const STORE_KEY = "root:temp-crews-demo-store";
const DEMO_PREFIX = "demo-tc-";

export function isTempCrewsDemo(): boolean {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export const isDemoTempCrewId = (id: string) => id.startsWith(DEMO_PREFIX);

interface DemoCrew {
  id: string;
  name: string;
  plan: string;
  capacity: number;
  open: boolean;
  eventId: string;
  host: TempCrewPerson;
  members: TempCrewPerson[];
  createdAt: string;
}

interface DemoRequest {
  id: string;
  crewId: string;
  user: TempCrewPerson;
  message: string | null;
  status: TempCrewRequestStatus;
  createdAt: string;
}

interface DemoStore {
  events: Record<string, TempCrewEventRef>;
  crews: DemoCrew[];
  requests: DemoRequest[];
}

const PEOPLE: TempCrewPerson[] = [
  { userId: "demo-u1", name: "Martina Ríos", username: "martirios" },
  { userId: "demo-u2", name: "Joaquín Pérez", username: "joaco.p" },
  { userId: "demo-u3", name: "Lucía Fernández", username: "luferz" },
  { userId: "demo-u4", name: "Bruno Silva", username: "brunosilva" },
  { userId: "demo-u5", name: "Camila Duarte", username: "camiduarte" },
  { userId: "demo-u6", name: "Nico Varela", username: "nicovarela" },
];

const SEED = [
  { name: "Los del fondo", plan: "Previa en Pocitos desde las 22 y vamos juntos en Uber.", capacity: 5, members: [0, 1, 2] },
  { name: "Techno y a casa", plan: "Nos encontramos en la puerta a las 00:30.", capacity: 4, members: [1, 3] },
  { name: "Primera vez acá", plan: "Para quienes van solos. Nos juntamos antes para conocernos.", capacity: 6, members: [2, 4, 5, 3] },
  { name: "Previa en el Rodó", plan: "Previa en Parque Rodó y salimos a las 23:45 caminando.", capacity: 8, members: [4, 0, 5, 1] },
  { name: "Hasta el cierre", plan: "Nos quedamos hasta que prendan las luces y desayunamos después.", capacity: 6, members: [5, 2] },
];

const REQUEST_SEED = [
  { person: 3, message: "Voy solo, me sumo a la previa." },
  { person: 4, message: "¿Hay lugar para mí? Llego 23 h." },
  { person: 5, message: null },
];

const wait = () => new Promise((resolve) => setTimeout(resolve, 80));
const newId = () => `${DEMO_PREFIX}${Math.random().toString(36).slice(2, 10)}`;

function demoError(status: number, message: string) {
  return Object.assign(new Error(message), { response: { status, data: { error: message } } });
}

function me(): TempCrewPerson {
  try {
    const raw = JSON.parse(window.localStorage.getItem("root_user") || "{}");
    return { userId: String(raw.id ?? "demo-me"), name: raw.name || "Vos", username: raw.username || "vos", avatarUrl: raw.avatarUrl ?? null };
  } catch {
    return { userId: "demo-me", name: "Vos", username: "vos" };
  }
}

function load(): DemoStore {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as DemoStore;
  } catch {
    // datos rotos: se arranca de cero
  }
  return { events: {}, crews: [], requests: [] };
}

function save(store: DemoStore) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // sin espacio: los cambios quedan solo en memoria
  }
}

function seedEvent(store: DemoStore, event: TempCrewEventRef) {
  // Sin pisar datos reales con los vacíos que llegan antes de que cargue el evento.
  const known = Object.fromEntries(Object.entries(event).filter(([, value]) => value)) as Partial<TempCrewEventRef>;
  store.events[event.id] = { ...{ id: event.id, title: "Evento", date: "", location: "" }, ...store.events[event.id], ...known };
  if (store.crews.some((crew) => crew.eventId === event.id)) return;
  SEED.forEach((seed, index) => {
    const members = seed.members.map((i) => PEOPLE[i]);
    store.crews.push({
      id: `${DEMO_PREFIX}${event.id.slice(0, 8)}-${index}`,
      name: seed.name,
      plan: seed.plan,
      capacity: seed.capacity,
      open: true,
      eventId: event.id,
      host: members[0],
      members,
      createdAt: new Date(Date.now() - index * 3_600_000).toISOString(),
    });
  });
}

function archivesAt(event: TempCrewEventRef) {
  const date = new Date(event.date);
  return Number.isNaN(date.getTime()) ? null : new Date(date.getTime() + 36 * 3_600_000).toISOString();
}

function summary(store: DemoStore, crew: DemoCrew): TempCrewSummary {
  const viewer = me();
  const isHost = crew.host.userId === viewer.userId;
  const isMember = crew.members.some((m) => m.userId === viewer.userId);
  const myRequest = [...store.requests].reverse().find((r) => r.crewId === crew.id && r.user.userId === viewer.userId);
  const event = store.events[crew.eventId];
  return {
    id: crew.id,
    name: crew.name,
    plan: crew.plan,
    capacity: crew.capacity,
    memberCount: crew.members.length,
    isAdmitting: crew.open && crew.members.length < crew.capacity,
    host: crew.host,
    membersPreview: crew.members.slice(0, 4),
    event,
    viewerRole: isHost ? "host" : isMember ? "member" : null,
    viewerRequestStatus: isMember ? null : myRequest?.status ?? null,
    pendingRequestsCount: isHost ? store.requests.filter((r) => r.crewId === crew.id && r.status === "pending").length : undefined,
    archivesAt: archivesAt(event),
  };
}

const freeSpots = (crew: TempCrewSummary) => crew.capacity - crew.memberCount;

function requestOut(store: DemoStore, request: DemoRequest): TempCrewJoinRequest {
  return { ...request, isGoingToEvent: true, mutualFriendsCount: request.user.userId === "demo-u4" ? 2 : 0 };
}

function hostedCrew(store: DemoStore, crewId: string) {
  const crew = store.crews.find((c) => c.id === crewId);
  if (!crew) throw demoError(404, "La crew no existe");
  if (crew.host.userId !== me().userId) throw demoError(403, "Solo quien creó la crew puede hacer esto");
  return crew;
}

export const tempCrewsDemo = {
  async listForEvent(event: TempCrewEventRef, params: { limit?: number; offset?: number }): Promise<TempCrewListResponse> {
    await wait();
    const store = load();
    seedEvent(store, event);
    save(store);
    const open = store.crews
      .filter((crew) => crew.eventId === event.id)
      .map((crew) => summary(store, crew))
      .filter((crew) => crew.isAdmitting)
      .sort((a, b) => freeSpots(b) - freeSpots(a));
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    const viewer = me();
    const mine = store.crews.find((c) => c.eventId === event.id && c.members.some((m) => m.userId === viewer.userId));
    return {
      data: open.slice(offset, offset + limit),
      meta: { total: open.length, limit, offset, hasMore: offset + limit < open.length, viewerCrewId: mine?.id ?? null },
    };
  },

  async create(event: TempCrewEventRef, input: CreateTempCrewInput): Promise<TempCrewSummary> {
    await wait();
    const store = load();
    seedEvent(store, event);
    const viewer = me();
    const already = store.crews.some((c) => c.eventId === event.id && c.members.some((m) => m.userId === viewer.userId));
    if (already) throw demoError(409, "Ya estás en una crew para este evento");
    const crew: DemoCrew = {
      id: newId(),
      name: input.name.trim(),
      plan: input.plan.trim(),
      capacity: input.capacity,
      open: true,
      eventId: event.id,
      host: viewer,
      members: [viewer],
      createdAt: new Date().toISOString(),
    };
    store.crews.unshift(crew);
    REQUEST_SEED.forEach((seed, index) => {
      store.requests.push({
        id: newId(),
        crewId: crew.id,
        user: PEOPLE[seed.person],
        message: seed.message,
        status: "pending",
        createdAt: new Date(Date.now() - (index + 1) * 900_000).toISOString(),
      });
    });
    save(store);
    return summary(store, crew);
  },

  async getMine(): Promise<TempCrewSummary[]> {
    await wait();
    const store = load();
    const viewer = me();
    const pending = new Set(store.requests.filter((r) => r.user.userId === viewer.userId && r.status === "pending").map((r) => r.crewId));
    return store.crews
      .filter((crew) => crew.members.some((m) => m.userId === viewer.userId) || pending.has(crew.id))
      .map((crew) => summary(store, crew));
  },

  async discover(): Promise<TempCrewSummary[]> {
    await wait();
    const store = load();
    return store.crews
      .map((crew) => summary(store, crew))
      .filter((crew) => crew.isAdmitting && !crew.viewerRole && crew.viewerRequestStatus !== "pending")
      .sort((a, b) => a.event.date.localeCompare(b.event.date) || freeSpots(b) - freeSpots(a));
  },

  async requestToJoin(crewId: string, message?: string): Promise<TempCrewJoinRequest> {
    await wait();
    const store = load();
    const crew = store.crews.find((c) => c.id === crewId);
    if (!crew) throw demoError(404, "La crew no existe");
    const current = summary(store, crew);
    if (current.viewerRole) throw demoError(409, "Ya estás en esta crew");
    if (!current.isAdmitting) throw demoError(409, "La crew no está admitiendo gente");
    const request: DemoRequest = {
      id: newId(),
      crewId,
      user: me(),
      message: message?.trim() || null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    store.requests.push(request);
    save(store);
    return requestOut(store, request);
  },

  async cancelMyRequest(crewId: string): Promise<void> {
    await wait();
    const store = load();
    const viewer = me();
    store.requests.forEach((r) => {
      if (r.crewId === crewId && r.user.userId === viewer.userId && r.status === "pending") r.status = "cancelled";
    });
    save(store);
  },

  async listRequests(crewId: string, status: "pending" | "rejected"): Promise<TempCrewJoinRequest[]> {
    await wait();
    const store = load();
    hostedCrew(store, crewId);
    return store.requests
      .filter((r) => r.crewId === crewId && r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => requestOut(store, r));
  },

  async respondToRequest(crewId: string, requestId: string, decision: "accept" | "reject"): Promise<TempCrewJoinRequest> {
    await wait();
    const store = load();
    const crew = hostedCrew(store, crewId);
    const request = store.requests.find((r) => r.id === requestId && r.crewId === crewId);
    if (!request || request.status !== "pending") throw demoError(409, "La solicitud ya no está pendiente");
    if (decision === "accept") {
      if (crew.members.length >= crew.capacity) throw demoError(409, "La crew está completa");
      crew.members.push(request.user);
      request.status = "accepted";
    } else {
      request.status = "rejected";
    }
    save(store);
    return requestOut(store, request);
  },

  async setAdmitting(crewId: string, isAdmitting: boolean): Promise<boolean> {
    await wait();
    const store = load();
    const crew = hostedCrew(store, crewId);
    crew.open = isAdmitting;
    save(store);
    return isAdmitting;
  },

  /** Lo que devolvería `GET /v1/crews/:id` para una crew temporal de ejemplo. */
  async getCrewDetail(crewId: string) {
    await wait();
    const store = load();
    const crew = store.crews.find((c) => c.id === crewId);
    if (!crew) throw demoError(404, "La crew no existe");
    const s = summary(store, crew);
    const tempCrew: TempCrewDetailExtras = {
      event: s.event,
      plan: s.plan,
      capacity: s.capacity,
      isAdmitting: s.isAdmitting,
      hostId: crew.host.userId,
      viewerRequestStatus: s.viewerRequestStatus,
      pendingRequestsCount: s.pendingRequestsCount,
      archivesAt: s.archivesAt,
    };
    const members = crew.members.map((m) => ({
      userId: m.userId,
      name: m.name,
      username: m.username,
      avatarUrl: m.avatarUrl ?? undefined,
      role: m.userId === crew.host.userId ? "host" : "member",
      steps: 0,
    }));
    return {
      id: crew.id,
      name: crew.name,
      type: "temporary" as const,
      isPublic: false,
      memberCount: members.length,
      totalSteps: 0,
      members,
      leaderboardAllTime: members,
      events: [s.event],
      tempCrew,
    };
  },
};
