 "use client";

 import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
 import { useRouter } from "next/navigation";
 import {
   ArrowRight,
   Calendar,
   Check,
   ChevronDown,
   Film,
   Filter,
   Flame,
   LayoutGrid,
   List,
   Loader2,
   MapPin,
   MessageSquare,
   Moon,
   Music,
   Plus,
   RefreshCw,
   Search,
   Tag,
   X,
 } from "lucide-react";
 import { EventCard, FEATURED_FLYER_EXTRA } from "@/components/ui/EventCard";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { TabIndicator } from "@/components/ui/TabIndicator";
 import { Button } from "@/components/ui/Button";
 import { RootLoader } from "@/components/ui/RootLoader";
 import { SegmentedControl } from "@/components/ui/SegmentedControl";
 import { RootLogo } from "@/components/ui/RootLogo";
 import { SearchButton } from "@/components/ui/SearchButton";
 import { BottomSheet } from "@/components/ui/BottomSheet";
 import { useFeaturedEvents } from "@/hooks/useFeaturedEvents";
 import { PullToRefresh } from "@/components/ui/PullToRefresh";
 import { QuickActionMenu } from "@/components/ui/QuickActionMenu";
 import { LiveEventBanner } from "@/components/LiveEventBanner";
 import { parseEventRealDate } from "@/hooks/useDanceSync";
 import { EventCalendarView } from "@/components/events/EventCalendarView";
 import { useMutation } from "@/hooks/useMutation";
 import { useAuth } from "@/context/AuthContext";
 import { eventsApi } from "@/services/events";
 import { cn } from "@/lib/utils";
 import { useEventsInbox } from "@/context/FeedInboxContext";
 import { useMatchedFontSize } from "@/hooks/useMatchedFontSize";
 import type { Event, EventFilters, EventListResponse } from "@/types/events";
 import { useAftersList, useTonightAfters } from "@/hooks/useAfters";
 import { useRequireKyc } from "@/hooks/useRequireKyc";
 import { isAftersStripTime } from "@/lib/afters";
 import { AftersFilterResults, SubmitEventCta, TonightAftersStrip } from "@/components/afters/AftersFeed";

 const pageSize = 10;
 const emptyFilters: EventFilters = {
   genre: "all",
   location: "",
   priceType: "all",
   minPrice: "",
   maxPrice: "",
   startDate: "",
   endDate: "",
 };

 const genreOptions = [
   { id: "all", label: "Todas las categorías" },
   { id: "Electrónica", label: "Electrónica" },
   { id: "Cachengue", label: "Cachengue" },
   { id: "Reggaetón", label: "Reggaetón" },
   { id: "Otros", label: "Otros" },
 ];

 // Alto que pierde el flyer destacado en la fase 1 (de 4:5 a cuadrado) y lado del cuadrado compacto.
 const FEATURED_TEXT_HEIGHT = FEATURED_FLYER_EXTRA;
 const FEATURED_COMPACT_SIZE = 56;

 const viewOptions = [
   { id: "grid", label: "Grilla", icon: LayoutGrid },
   { id: "list", label: "Agenda", icon: List },
   { id: "calendar", label: "Mes", icon: Calendar },
 ] as const;

 type EventView = (typeof viewOptions)[number]["id"];

 // Solo lugares de Uruguay, escritos tal cual se guardan en events.department
 // (el filtro busca por ese valor). Si aparece un departamento nuevo en la base,
 // se agrega acá. Punta del Este se guarda como departamento "Maldonado".
 const citySuggestions = [
   "Montevideo",
   "Maldonado",
   "Canelones",
   "Rocha",
   "Colonia",
 ];

 /**
  * Primera página del listado sin filtros, por usuario. Al volver del detalle de un evento la pantalla se monta de
  * nuevo: con esto se ve al instante lo que ya se tenía y se actualiza por detrás, en vez de repetir los skeletons.
  */
 let eventsSnapshot: { userId: string; events: Event[]; hasMore: boolean } | null = null;
 const snapshotFor = (userId?: string) =>
   eventsSnapshot && eventsSnapshot.userId === (userId ?? "") ? eventsSnapshot : null;

 /**
  * Scroll del listado al abrir el detalle de un evento. El detalle vuelve con router.push, así que ni el navegador ni
  * Next lo restauran: se aplica una sola vez cuando el listado se vuelve a montar con el snapshot.
  */
 let pendingScrollY: number | null = null;

 interface LoadVariables {
   filters: EventFilters;
   offset: number;
   append: boolean;
   query?: string;
   limit?: number;
 }

 function localDayToISO(value: string, endOfDay: boolean): string {
   const [year, month, day] = value.split("-").map(Number);
   const date = new Date(
     year,
     month - 1,
     day,
     endOfDay ? 23 : 0,
     endOfDay ? 59 : 0,
     endOfDay ? 59 : 0,
     endOfDay ? 999 : 0,
   );
   return date.toISOString();
 }

 function getWeekendRange(): { startDate: string; endDate: string } {
   const now = new Date();
   const day = now.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
   const friday = new Date(now);
   if (day === 0) {
     friday.setDate(now.getDate() - 2);
   } else if (day === 6) {
     friday.setDate(now.getDate() - 1);
   } else {
     friday.setDate(now.getDate() + (5 - day));
   }

   const sunday = new Date(friday);
   sunday.setDate(friday.getDate() + 2);

   const format = (d: Date) => d.toISOString().split("T")[0];
   return { startDate: format(friday), endDate: format(sunday) };
 }

 function getNext7DaysRange(): { startDate: string; endDate: string } {
   const now = new Date();
   const next = new Date(now);
   next.setDate(now.getDate() + 7);
   const format = (d: Date) => d.toISOString().split("T")[0];
   return { startDate: format(now), endDate: format(next) };
 }

 function getThisMonthRange(): { startDate: string; endDate: string } {
   const now = new Date();
   const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
   const format = (d: Date) => d.toISOString().split("T")[0];
   return { startDate: format(now), endDate: format(endOfMonth) };
 }

 function toQueryParams(
   filters: EventFilters,
   offset: number,
   query?: string,
   limit: number = pageSize,
 ) {
   const params: Record<string, string | number | boolean> = { limit, offset };
   if (filters.genre !== "all") params.genre = filters.genre;
   if (filters.location.trim()) params.location = filters.location.trim();
   if (filters.priceType === "free") params.isFree = true;
   if (filters.priceType === "paid") params.isFree = false;
   if (filters.minPrice) params.minPrice = filters.minPrice;
   if (filters.maxPrice) params.maxPrice = filters.maxPrice;
   if (filters.startDate) params.startDate = localDayToISO(filters.startDate, false);
   if (filters.endDate) params.endDate = localDayToISO(filters.endDate, true);
   if (query && query.trim()) params.query = query.trim();
   return params;
 }

 type TemporalPreset = "all" | "weekend" | "week" | "month";

 export interface ChronologicalGroup {
   id: string;
   title: string;
   subtitle?: string;
   events: Event[];
 }

 function groupEventsChronologically(eventsList: Event[]): ChronologicalGroup[] {
   if (!eventsList || eventsList.length === 0) return [];

   const now = new Date();
   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

   const getDaysDiff = (target: Date) => {
     const d = new Date(target.getFullYear(), target.getMonth(), target.getDate());
     return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
   };

   const dayOfWeek = today.getDay();
   let fridayOffset = 5 - dayOfWeek;
   if (dayOfWeek === 0) fridayOffset = -2;
   else if (dayOfWeek === 6) fridayOffset = -1;

   const friday = new Date(today);
   friday.setDate(today.getDate() + fridayOffset);
   const sunday = new Date(friday);
   sunday.setDate(friday.getDate() + 2);

   const isThisWeekend = (target: Date) => {
     const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
     return t >= friday.getTime() && t <= sunday.getTime();
   };

   const groupsMap = new Map<string, ChronologicalGroup>();

   for (const event of eventsList) {
     const eventDate = parseEventRealDate(event.date);
     if (Number.isNaN(eventDate.getTime())) {
       const key = "nodate";
       if (!groupsMap.has(key)) {
         groupsMap.set(key, { id: key, title: "Próximos eventos", events: [] });
       }
       groupsMap.get(key)!.events.push(event);
       continue;
     }

     const diff = getDaysDiff(eventDate);

     if (diff === 0) {
       const key = "today";
       if (!groupsMap.has(key)) {
         groupsMap.set(key, { id: key, title: "Hoy", subtitle: "Esta noche", events: [] });
       }
       groupsMap.get(key)!.events.push(event);
     } else if (diff === 1) {
       const key = "tomorrow";
       if (!groupsMap.has(key)) {
         groupsMap.set(key, { id: key, title: "Mañana", events: [] });
       }
       groupsMap.get(key)!.events.push(event);
     } else if (isThisWeekend(eventDate)) {
       const key = "weekend";
       if (!groupsMap.has(key)) {
         const weekendSub = `${friday.getDate()} a ${sunday.getDate()} de ${new Intl.DateTimeFormat("es-AR", { month: "short" }).format(sunday).replace(".", "")}`;
         groupsMap.set(key, { id: key, title: "Este fin de semana", subtitle: weekendSub, events: [] });
       }
       groupsMap.get(key)!.events.push(event);
     } else if (diff > 0 && diff <= 10) {
       const key = "next-week";
       if (!groupsMap.has(key)) {
         groupsMap.set(key, { id: key, title: "Próximos días", events: [] });
       }
       groupsMap.get(key)!.events.push(event);
     } else {
       const monthYearKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
       if (!groupsMap.has(monthYearKey)) {
         const monthName = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(eventDate);
         const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
         groupsMap.set(monthYearKey, { id: monthYearKey, title: capitalizedMonth, events: [] });
       }
       groupsMap.get(monthYearKey)!.events.push(event);
     }
   }

   return Array.from(groupsMap.values());
 }

 export default function EventsPage() {
   const router = useRouter();
   const { user } = useAuth();
   const inbox = useEventsInbox();
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [events, setEvents] = useState<Event[]>(() => snapshotFor(user?.id)?.events ?? []);
   const [draftFilters, setDraftFilters] = useState<EventFilters>({ ...emptyFilters });
   const [appliedFilters, setAppliedFilters] = useState<EventFilters>({ ...emptyFilters });
   const [temporalPreset, setTemporalPreset] = useState<TemporalPreset>("all");
   const [searchQuery, setSearchQuery] = useState("");
   const [debouncedQuery, setDebouncedQuery] = useState("");
   const [hasMore, setHasMore] = useState(() => snapshotFor(user?.id)?.hasMore ?? false);
   const [hasLoaded, setHasLoaded] = useState(() => !!snapshotFor(user?.id));
   const [showFilters, setShowFilters] = useState(false);
   const [viewMode, setViewMode] = useState<EventView>("grid");
   const [showGoingOnly, setShowGoingOnly] = useState(false);
   // Filtro Afters: muestra solo afters (agrupados por noche), nunca mezclados con la grilla de eventos.
   const [showAfters, setShowAfters] = useState(false);
   const [sortBy, setSortBy] = useState<"date" | "popular">("date");
   const [isWhenOpen, setIsWhenOpen] = useState(false);
   const [isGenreOpen, setIsGenreOpen] = useState(false);
   const [activeSheetType, setActiveSheetType] = useState<"when" | "location">("when");
   const [cityQuery, setCityQuery] = useState("");
   const [isDatesOpen, setIsDatesOpen] = useState(false);
   const filtersContainerRef = useRef<HTMLDivElement>(null);
   const bottomSheetRef = useRef<HTMLDivElement>(null);
   const sentinelRef = useRef<HTMLDivElement>(null);
   const headerRef = useRef<HTMLElement>(null);
   const stickyBarRef = useRef<HTMLDivElement>(null);
   const featuredTitleRef = useRef<HTMLHeadingElement>(null);
   const sectionTitleRef = useRef<HTMLHeadingElement>(null);
   const collapseAnchorRef = useRef<HTMLDivElement>(null);
   const collapseSpacerRef = useRef<HTMLDivElement>(null);
   const featuredRowRef = useRef<HTMLDivElement>(null);
   const lastFetchedQueryRef = useRef("");
   const { featuredEvents, isLoading: isLoadingFeatured, refresh: refreshFeatured } = useFeaturedEvents();

   // Destacados que se achican con el scroll en 2 fases:
   // 1) El flyer pasa de 4:5 a cuadrado y se desvanece el texto que tiene encima.
   // 2) Ese cuadrado se achica proporcionalmente hasta 56px.
   useEffect(() => {
     let frame = 0;
     // Los rangos dependen solo del ancho de la fila: se miden al montar y al cambiar el tamaño, no en cada frame.
     let textRange = 0;
     let squareRange = 0;
     let range = 0;
     // Último valor aplicado: si no cambió (p. ej. ya colapsado y se sigue bajando la lista), no se escribe nada.
     let lastCollapse = -1;
     const measure = () => {
       const row = featuredRowRef.current;
       if (!row) {
         textRange = squareRange = range = 0;
         return;
       }
       const style = getComputedStyle(row);
       const inner = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
       const cols = window.matchMedia("(min-width: 1280px)").matches ? 4 : window.matchMedia("(min-width: 768px)").matches ? 3 : 2;
       const gap = cols > 2 ? 20 : 12;
       const column = (inner - (cols - 1) * gap) / cols;
       textRange = FEATURED_TEXT_HEIGHT;
       squareRange = Math.max(0, column - FEATURED_COMPACT_SIZE);
       range = Math.max(0, textRange + squareRange);
       lastCollapse = -1;
     };
     const update = () => {
       frame = 0;
       const bar = stickyBarRef.current;
       const anchor = collapseAnchorRef.current;
       const spacer = collapseSpacerRef.current;
       const header = headerRef.current;
       if (!bar || !anchor || !spacer || !header) return;
       const passed = header.getBoundingClientRect().bottom - anchor.getBoundingClientRect().top;
       const collapse = Math.min(range, Math.max(0, passed));
       if (collapse === lastCollapse) return;
       lastCollapse = collapse;
       const collapseFooter = Math.min(textRange, collapse);
       const pFooter = textRange > 0 ? collapseFooter / textRange : 0;
       const collapseSquare = Math.max(0, collapse - textRange);
       const pCard = squareRange > 0 ? collapseSquare / squareRange : 0;

       bar.style.setProperty("--p", range > 0 ? String(collapse / range) : "0");
       bar.style.setProperty("--p-footer", String(pFooter));
       bar.style.setProperty("--p-card", String(pCard));
       spacer.style.height = `${collapse}px`;
     };
     const schedule = () => {
       if (!frame) frame = requestAnimationFrame(update);
     };
     const remeasure = () => {
       measure();
       schedule();
     };
     measure();
     update();
     window.addEventListener("scroll", schedule, { passive: true });
     window.addEventListener("resize", remeasure);
     // La fila también cambia de ancho sin resize de ventana (p. ej. al cargar el layout de escritorio). Su alto cambia
     // en cada frame mientras se achica: solo el ancho dispara una nueva medición.
     const row = featuredRowRef.current;
     let rowWidth = row?.clientWidth ?? 0;
     const observer =
       row && typeof ResizeObserver !== "undefined"
         ? new ResizeObserver(() => {
             if (row.clientWidth === rowWidth) return;
             rowWidth = row.clientWidth;
             remeasure();
           })
         : null;
     if (row) observer?.observe(row);
     return () => {
       window.removeEventListener("scroll", schedule);
       window.removeEventListener("resize", remeasure);
       observer?.disconnect();
       if (frame) cancelAnimationFrame(frame);
     };
     // showAfters oculta los destacados: se vuelve a medir para que el espaciador no deje un hueco.
   }, [featuredEvents.length, showAfters]);

   const [headerHeight, setHeaderHeight] = useState<number>(0);

   useEffect(() => {
     const updateHeaderHeight = () => {
       if (headerRef.current) {
         setHeaderHeight(headerRef.current.offsetHeight);
       }
     };
     updateHeaderHeight();
     const observer = new ResizeObserver(updateHeaderHeight);
     if (headerRef.current) observer.observe(headerRef.current);
     return () => observer.disconnect();
   }, []);

   const openInbox = inbox?.open ?? (() => router.push("/chat?from=events"));
   // Los mensajes se abren solo con el botón: deslizar hacia el costado cambia de pestaña (TabSwipe).

   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       const target = event.target as Node;
       if (
         filtersContainerRef.current &&
         !filtersContainerRef.current.contains(target) &&
         (!bottomSheetRef.current || !bottomSheetRef.current.contains(target))
       ) {
         setIsWhenOpen(false);
         setIsGenreOpen(false);
         setIsDatesOpen(false);
       }
     };
     const handleKeyDown = (event: KeyboardEvent) => {
       if (event.key === "Escape") {
         setIsWhenOpen(false);
         setIsGenreOpen(false);
         setIsDatesOpen(false);
       }
     };
     if (isWhenOpen || isGenreOpen || isDatesOpen) {
       document.addEventListener("click", handleClickOutside);
       document.addEventListener("keydown", handleKeyDown);
     }
     return () => {
       document.removeEventListener("click", handleClickOutside);
       document.removeEventListener("keydown", handleKeyDown);
     };
   }, [isWhenOpen, isGenreOpen, isDatesOpen]);

   const {
     mutate: fetchEvents,
     isLoading: isLoadingEvents,
     error: eventsError,
   } = useMutation<EventListResponse, LoadVariables>(
     async ({ filters, offset, query, limit }) => {
       const response = await eventsApi.getEvents(
         toQueryParams(filters, offset, query, limit),
       );
       return response;
     },
     {
       onSuccess: (response, variables) => {
         setEvents((current) => {
           if (!variables.append) return response.data;
           const existingIds = new Set(current.map((ev) => ev.id));
           const uniqueNew = response.data.filter((ev) => !existingIds.has(ev.id));
           return [...current, ...uniqueNew];
         });
         const more = response.data.length > 0 && response.meta.hasMore;
         setHasMore(more);
         setHasLoaded(true);
         if (!variables.append && variables.offset === 0 && !variables.query && JSON.stringify(variables.filters) === JSON.stringify(emptyFilters)) {
           eventsSnapshot = { userId: user?.id ?? "", events: response.data, hasMore: more };
         }
       },
       onError: () => setHasLoaded(true),
     },
   );

   useEffect(() => {
     // Con snapshot se refresca la misma cantidad que ya se tenía: si no, la lista se acortaría y perdería el scroll.
     const cached = snapshotFor(user?.id)?.events.length ?? 0;
     const limit = cached > pageSize ? Math.min(cached, 100) : undefined;
     void fetchEvents({ filters: emptyFilters, offset: 0, append: false, limit }).catch(() => undefined);
     // Solo al montar.
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [fetchEvents]);

   // El snapshot guarda todas las páginas cargadas del listado sin filtros, no solo la primera.
   useEffect(() => {
     if (!hasLoaded || debouncedQuery || JSON.stringify(appliedFilters) !== JSON.stringify(emptyFilters)) return;
     eventsSnapshot = { userId: user?.id ?? "", events, hasMore };
   }, [events, hasMore, hasLoaded, appliedFilters, debouncedQuery, user?.id]);

   // Al volver del detalle: espera a que la lista tenga altura suficiente (Next sube al tope después de navegar).
   useEffect(() => {
     const target = pendingScrollY;
     if (target === null) return;
     if (!snapshotFor(user?.id)) {
       pendingScrollY = null;
       return;
     }
     // pendingScrollY se borra recién al aplicarlo: en desarrollo (Strict Mode) el efecto corre dos veces y la
     // limpieza de la primera cancela este frame.
     let frame = 0;
     let tries = 0;
     const restore = () => {
       const reachable = document.documentElement.scrollHeight - window.innerHeight >= target;
       if (reachable || tries++ > 60) {
         pendingScrollY = null;
         window.scrollTo({ top: target, behavior: "instant" });
         return;
       }
       frame = requestAnimationFrame(restore);
     };
     frame = requestAnimationFrame(() => (frame = requestAnimationFrame(restore)));
     return () => cancelAnimationFrame(frame);
     // Solo al montar.
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // Debounce búsqueda
   useEffect(() => {
     const timer = setTimeout(() => {
       setDebouncedQuery(searchQuery);
     }, 350);
     return () => clearTimeout(timer);
   }, [searchQuery]);

   // Buscar cuando el debouncedQuery cambia
   useEffect(() => {
     if (!hasLoaded || lastFetchedQueryRef.current === debouncedQuery) return;
     lastFetchedQueryRef.current = debouncedQuery;
     void fetchEvents({
       filters: appliedFilters,
       offset: 0,
       append: false,
       query: debouncedQuery,
     }).catch(() => undefined);
   }, [appliedFilters, debouncedQuery, fetchEvents, hasLoaded]);

   // Scroll infinito con IntersectionObserver
   useEffect(() => {
     if (!hasLoaded || !hasMore || isLoadingEvents) return;

     const observer = new IntersectionObserver(
       (entries) => {
         if (entries[0].isIntersecting) {
           void fetchEvents({
             filters: appliedFilters,
             offset: events.length,
             append: true,
             query: debouncedQuery,
           }).catch(() => undefined);
         }
       },
       { rootMargin: "300px" },
     );

     const el = sentinelRef.current;
     if (el) observer.observe(el);

     return () => {
       if (el) observer.unobserve(el);
     };
   }, [hasLoaded, hasMore, isLoadingEvents, events.length, appliedFilters, debouncedQuery, fetchEvents]);

   // Calendario y filtro "voy!" necesitan el set completo
   useEffect(() => {
     if ((viewMode !== "calendar" && !showGoingOnly) || !hasLoaded || !hasMore || isLoadingEvents) return;
     void fetchEvents({
       filters: appliedFilters,
       offset: events.length,
       append: true,
       query: debouncedQuery,
       limit: 50,
     }).catch(() => undefined);
   }, [viewMode, showGoingOnly, hasLoaded, hasMore, isLoadingEvents, events.length, appliedFilters, debouncedQuery, fetchEvents]);

   // Orden y filtrado en memoria
   const displayEvents = useMemo(() => {
     const visibleEvents = showGoingOnly
       ? events.filter((event) => event.userRsvp === "going")
       : events;
     if (sortBy === "popular") {
       return [...visibleEvents].sort((a, b) => (b.goingCount || 0) - (a.goingCount || 0));
     }
     return visibleEvents;
   }, [events, sortBy, showGoingOnly]);

   // Afters: la franja de esta noche (18:00 a 12:00) y la lista del filtro. Ubicación NO los filtra: elige
   // departamentos ("Montevideo") y la zona de un after es un barrio escrito a mano ("Pocitos").
   const requireKyc = useRequireKyc();
   const [isAftersHour] = useState(() => isAftersStripTime());
   const tonightAfters = useTonightAfters(isAftersHour && !showAfters && !debouncedQuery);
   const aftersList = useAftersList(
     {
       from: appliedFilters.startDate ? localDayToISO(appliedFilters.startDate, false) : undefined,
       until: appliedFilters.endDate ? localDayToISO(appliedFilters.endDate, true) : undefined,
       limit: 50,
     },
     showAfters,
   );
   const visibleAfters = useMemo(
     () =>
       showGoingOnly
         ? aftersList.afters.filter((after) => after.viewerStatus === "host" || after.viewerStatus === "accepted" || after.viewerStatus === "going")
         : aftersList.afters,
     [aftersList.afters, showGoingOnly],
   );
   const showTonightStrip =
     !showAfters && isAftersHour && !debouncedQuery && tonightAfters.status === "ready" && tonightAfters.afters.length > 0;
   const openAftersFilter = () => {
     setShowAfters(true);
     setIsWhenOpen(false);
     setIsGenreOpen(false);
     setIsDatesOpen(false);
     window.scrollTo({ top: 0, behavior: "smooth" });
   };

   // Agrupación cronológica para la vista de Agenda / Lista
   const chronologicalGroups = useMemo(() => {
     return groupEventsChronologically(displayEvents);
   }, [displayEvents]);

   const handleRefresh = async () => {
     try {
       await Promise.all([
         fetchEvents({ filters: appliedFilters, offset: 0, append: false, query: debouncedQuery }),
         refreshFeatured(),
       ]);
     } catch (e) {
       console.error(e);
     }
   };

   const applyFilters = (event?: FormEvent) => {
     event?.preventDefault();
     setShowFilters(false);
     setAppliedFilters({ ...draftFilters });
     setTemporalPreset("all");
     void fetchEvents({ filters: draftFilters, offset: 0, append: false, query: debouncedQuery })
       .catch(() => undefined);
   };

   const clearFilters = () => {
     const cleared = { ...emptyFilters };
     setDraftFilters(cleared);
     setAppliedFilters(cleared);
     setTemporalPreset("all");
     setSortBy("date");
     setShowGoingOnly(false);
     setShowAfters(false);
     setSearchQuery("");
     setIsWhenOpen(false);
     setIsGenreOpen(false);
     setIsDatesOpen(false);
     void fetchEvents({ filters: cleared, offset: 0, append: false, query: "" })
       .catch(() => undefined);
   };

   const selectTemporalPreset = (preset: TemporalPreset) => {
     setTemporalPreset(preset);
     let nextDates = { startDate: "", endDate: "" };
     if (preset === "weekend") nextDates = getWeekendRange();
     else if (preset === "week") nextDates = getNext7DaysRange();
     else if (preset === "month") nextDates = getThisMonthRange();

     const nextDraft = { ...draftFilters, ...nextDates };
     setDraftFilters(nextDraft);
     setAppliedFilters(nextDraft);
     void fetchEvents({ filters: nextDraft, offset: 0, append: false, query: debouncedQuery }).catch(() => undefined);
   };

   const handleSelectTemporal = (preset: TemporalPreset) => {
     selectTemporalPreset(preset);
     setIsWhenOpen(false);
   };

   const clearDateFilter = () => {
     setTemporalPreset("all");
     const next = { ...appliedFilters, startDate: "", endDate: "" };
     setDraftFilters(next);
     setAppliedFilters(next);
     setIsWhenOpen(false);
     setIsDatesOpen(false);
     void fetchEvents({ filters: next, offset: 0, append: false, query: debouncedQuery }).catch(() => undefined);
   };

   const applyCustomDates = () => {
     setTemporalPreset("all");
     const next = {
       ...appliedFilters,
       startDate: draftFilters.startDate,
       endDate: draftFilters.endDate,
     };
     setDraftFilters(next);
     setAppliedFilters(next);
     setIsDatesOpen(false);
     setIsWhenOpen(false);
     void fetchEvents({ filters: next, offset: 0, append: false, query: debouncedQuery }).catch(() => undefined);
   };

   const removeSingleFilter = (key: "genre" | "location" | "priceType" | "price" | "date") => {
     const nextDraft = { ...appliedFilters };
     if (key === "genre") nextDraft.genre = "all";
     if (key === "location") nextDraft.location = "";
     if (key === "priceType") nextDraft.priceType = "all";
     if (key === "price") {
       nextDraft.minPrice = "";
       nextDraft.maxPrice = "";
     }
     if (key === "date") {
       nextDraft.startDate = "";
       nextDraft.endDate = "";
       setTemporalPreset("all");
     }
     setDraftFilters(nextDraft);
     setAppliedFilters(nextDraft);
     void fetchEvents({ filters: nextDraft, offset: 0, append: false, query: debouncedQuery }).catch(() => undefined);
   };

   const isDateActive =
     temporalPreset !== "all" || !!appliedFilters.startDate || !!appliedFilters.endDate;

   const isCustomDateActive =
     temporalPreset === "all" && (!!appliedFilters.startDate || !!appliedFilters.endDate);

   const formatShortDate = (dateStr: string) => {
     const [year, month, day] = dateStr.split("-").map(Number);
     if (!year || !month || !day) return dateStr;
     return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" })
       .format(new Date(year, month - 1, day))
       .replace(".", "");
   };

   const getDateLabel = () => {
     if (temporalPreset === "weekend") return "Este finde";
     if (temporalPreset === "week") return "Próximos 7 días";
     if (temporalPreset === "month") return "Este mes";
     if (isCustomDateActive) {
       if (appliedFilters.startDate && appliedFilters.endDate) {
         if (appliedFilters.startDate === appliedFilters.endDate) {
           return formatShortDate(appliedFilters.startDate);
         }
         return `${formatShortDate(appliedFilters.startDate)} - ${formatShortDate(appliedFilters.endDate)}`;
       }
       if (appliedFilters.startDate) return `Desde ${formatShortDate(appliedFilters.startDate)}`;
       if (appliedFilters.endDate) return `Hasta ${formatShortDate(appliedFilters.endDate)}`;
     }
     return "¿Cuándo?";
   };

   const isLocationActive = Boolean(appliedFilters.location.trim());

   // Los dos títulos de sección comparten tamaño: si alguno no entra, se achican juntos.
   const showFeaturedTitle = featuredEvents.length > 0 || !hasLoaded || isLoadingFeatured;
   useMatchedFontSize(
     featuredTitleRef,
     sectionTitleRef,
     `${sortBy}|${showFeaturedTitle ? "featured" : "no-featured"}`,
   );

   const getLocationLabel = () => {
     if (isLocationActive) {
       return appliedFilters.location.trim();
     }
     return "Ubicación";
   };

   const applyLocationFilter = (cityValue: string) => {
     const trimmed = cityValue.trim();
     const next = { ...appliedFilters, location: trimmed };
     setDraftFilters(next);
     setAppliedFilters(next);
     setCityQuery(trimmed);
     setIsGenreOpen(false);
     void fetchEvents({ filters: next, offset: 0, append: false, query: debouncedQuery }).catch(
       () => undefined,
     );
   };

   const clearLocationFilter = () => {
     setCityQuery("");
     const next = { ...appliedFilters, location: "" };
     setDraftFilters(next);
     setAppliedFilters(next);
     setIsGenreOpen(false);
     void fetchEvents({ filters: next, offset: 0, append: false, query: debouncedQuery }).catch(
       () => undefined,
     );
   };

   const filteredCitySuggestions = useMemo(() => {
     const q = cityQuery.trim().toLowerCase();
     if (!q) return citySuggestions;
     return citySuggestions.filter((c) => c.toLowerCase().includes(q));
   }, [cityQuery]);

   const activeFilters =
     (appliedFilters.genre !== "all" ? 1 : 0) +
     (appliedFilters.location ? 1 : 0) +
     (appliedFilters.priceType !== "all" ? 1 : 0) +
     (appliedFilters.minPrice || appliedFilters.maxPrice ? 1 : 0) +
     (appliedFilters.startDate || appliedFilters.endDate ? 1 : 0) +
     (sortBy === "popular" ? 1 : 0) +
     (showGoingOnly ? 1 : 0);

   const hasActiveChips =
     appliedFilters.priceType !== "all" ||
     !!appliedFilters.minPrice ||
     !!appliedFilters.maxPrice ||
     sortBy === "popular" ||
     showGoingOnly ||
     !!debouncedQuery;

   return (
     <div
       className="feed-swipe events-swipe hide-scrollbar flex min-h-screen flex-col bg-bg text-ink"
       onClickCapture={(event) => {
         // Solo el listado sin filtros se restaura (es lo que guarda el snapshot).
         const link = (event.target as Element).closest?.('a[href^="/events/"]');
         if (link && !hasActiveChips && viewMode === "grid") pendingScrollY = window.scrollY;
       }}
     >
       {/* Header: marca, búsqueda y mensajes */}
       <header
         ref={headerRef}
         onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
         className="sticky top-0 z-40 w-full bg-bg/95 backdrop-blur-md border-b border-line lg:-mt-24 lg:h-24 lg:border-b-0"
       >
         <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center justify-between gap-3 lg:hidden">
           <h1 className="m-0 shrink-0 flex">
             <RootLogo size={30} />
           </h1>

           <div className="flex items-center gap-2 shrink-0">
             <button
               type="button"
               aria-label="Subir"
               onClick={(event) => {
                 event.stopPropagation();
                 setIsMenuOpen(true);
               }}
               className="shrink-0 size-11 flex items-center justify-center rounded-control bg-surface border border-line text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent transition-colors"
             >
               <Plus className="size-5" aria-hidden="true" />
             </button>
             <SearchButton />
             <button
               type="button"
               aria-label={user ? "Abrir mensajes" : "Iniciar sesión para ver mensajes"}
               onClick={(event) => {
                 event.stopPropagation();
                 if (!user) {
                   router.push("/login");
                   return;
                 }
                 openInbox();
               }}
               className="shrink-0 size-11 flex items-center justify-center rounded-control bg-surface border border-line text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent transition-colors"
             >
               <MessageSquare className="size-5" aria-hidden="true" />
             </button>
           </div>
         </div>
       </header>

       <PullToRefresh onRefresh={handleRefresh}>
         <div className="space-y-7 px-4 md:px-6 pt-0 pb-28 w-full max-w-7xl mx-auto">
           {/* Slide-over Drawer lateral para Filtros Avanzados */}
           {showFilters && (
             <div className="fixed inset-0 z-50 flex justify-end">
               <div
                 className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
                 onClick={() => setShowFilters(false)}
               />

               <div className="relative z-10 w-full max-w-md h-full bg-[#0B0D10] border-l border-white/10 shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
                 <form onSubmit={applyFilters} className="flex flex-col h-full justify-between space-y-6">
                   <div className="space-y-4">
                     <div className="flex items-center justify-between border-b border-white/10 pb-4">
                       <span className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#D4FF00]">
                         <Filter className="h-4 w-4" /> Filtros avanzados
                       </span>
                       <button
                         type="button"
                         onClick={() => setShowFilters(false)}
                         className="rounded-full bg-white/5 p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                       >
                         <X className="h-4 w-4" />
                       </button>
                     </div>

                     <fieldset className="space-y-1.5">
                       <legend className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                         <Flame className="h-3 w-3 text-[#D4FF00]" /> Ordenar por
                       </legend>
                       <div className="flex rounded-2xl border border-white/10 bg-[#14171F] p-1">
                         <button
                           type="button"
                           onClick={() => setSortBy("date")}
                           className={cn(
                             "flex-1 rounded-xl py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                             sortBy === "date"
                               ? "bg-[#D4FF00] text-neutral-950"
                               : "text-neutral-400 hover:text-white",
                           )}
                         >
                           Próximos
                         </button>
                         <button
                           type="button"
                           onClick={() => setSortBy("popular")}
                           className={cn(
                             "flex-1 rounded-xl py-1.5 text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                             sortBy === "popular"
                               ? "bg-[#D4FF00] text-neutral-950"
                               : "text-neutral-400 hover:text-white",
                           )}
                         >
                           <Flame
                             className={cn(
                               "h-3.5 w-3.5",
                               sortBy === "popular"
                                 ? "text-neutral-950 fill-neutral-950"
                                 : "text-[#D4FF00]",
                             )}
                           />
                           Más votados
                         </button>
                       </div>
                     </fieldset>

                     <div className="space-y-1.5">
                       <label className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                         <Music className="h-3 w-3 text-[#D4FF00]" /> Género
                       </label>
                       <select
                         value={draftFilters.genre}
                         onChange={(event) =>
                           setDraftFilters((current) => ({ ...current, genre: event.target.value }))
                         }
                         className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs font-semibold text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                       >
                         {genreOptions.map((option) => (
                           <option key={option.id} value={option.id}>
                             {option.label}
                           </option>
                         ))}
                       </select>
                     </div>

                     <div className="space-y-1.5">
                       <label className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                         <MapPin className="h-3 w-3 text-[#D4FF00]" /> Lugar / zona
                       </label>
                       <input
                         value={draftFilters.location}
                         onChange={(event) =>
                           setDraftFilters((current) => ({ ...current, location: event.target.value }))
                         }
                         placeholder="Ej. Montevideo, Palermo..."
                         className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs font-semibold text-white placeholder-neutral-500 focus:border-[#D4FF00] focus:outline-none transition-colors"
                       />
                     </div>

                     <fieldset className="space-y-1.5">
                       <legend className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                         <Tag className="h-3 w-3 text-[#D4FF00]" /> Tipo de precio
                       </legend>
                       <div className="flex rounded-2xl border border-white/[0.06] bg-black/40 p-1">
                         {[
                           { id: "all", label: "Todos" },
                           { id: "free", label: "Gratis" },
                           { id: "paid", label: "De pago" },
                         ].map((option) => (
                           <button
                             key={option.id}
                             type="button"
                             onClick={() =>
                               setDraftFilters((current) => ({
                                 ...current,
                                 priceType: option.id as EventFilters["priceType"],
                               }))
                             }
                             className={cn(
                               "flex-1 rounded-xl py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                               draftFilters.priceType === option.id
                                 ? "bg-[#D4FF00] text-neutral-950 shadow-sm"
                                 : "text-neutral-400 hover:text-white",
                             )}
                           >
                             {option.label}
                           </button>
                         ))}
                       </div>
                     </fieldset>

                     <div className="grid grid-cols-2 gap-3">
                       <label className="space-y-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                         Precio mínimo
                         <input
                           type="number"
                           min="0"
                           step="0.01"
                           value={draftFilters.minPrice}
                           onChange={(event) =>
                             setDraftFilters((current) => ({ ...current, minPrice: event.target.value }))
                           }
                           className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                         />
                       </label>
                       <label className="space-y-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                         Precio máximo
                         <input
                           type="number"
                           min="0"
                           step="0.01"
                           value={draftFilters.maxPrice}
                           onChange={(event) =>
                             setDraftFilters((current) => ({ ...current, maxPrice: event.target.value }))
                           }
                           className="w-full rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-3 py-2 text-xs text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                         />
                       </label>
                     </div>

                     <div className="grid grid-cols-2 gap-2.5">
                       <label className="min-w-0 flex flex-col gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                         <span>Desde</span>
                         <input
                           type="date"
                           value={draftFilters.startDate}
                           onChange={(event) =>
                             setDraftFilters((current) => ({ ...current, startDate: event.target.value }))
                           }
                           className="block w-full max-w-[136px] sm:max-w-full min-w-0 box-border appearance-none rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-2.5 py-2 text-[11px] text-white focus:border-[#D4FF00] focus:
 transition-colors"
                         />
                       </label>
                       <label className="min-w-0 flex flex-col gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                         <span>Hasta</span>
                         <input
                           type="date"
                           value={draftFilters.endDate}
                           onChange={(event) =>
                             setDraftFilters((current) => ({ ...current, endDate: event.target.value }))
                           }
                           className="block w-full max-w-[136px] sm:max-w-full min-w-0 box-border appearance-none rounded-2xl border border-white/[0.08] border-t-white/[0.14] bg-[#14171F] px-2.5 py-2 text-[11px] text-white focus:border-[#D4FF00] focus:
 transition-colors"
                         />
                       </label>
                     </div>
                   </div>

                   <div className="pt-4 border-t border-white/10 space-y-2">
                     <Button type="submit" size="full" disabled={isLoadingEvents}>
                       {isLoadingEvents ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                       Aplicar filtros
                     </Button>
                     {activeFilters > 0 && (
                       <Button
                         type="button"
                         variant="outline"
                         size="full"
                         onClick={() => {
                           clearFilters();
                           setSortBy("date");
                           setShowFilters(false);
                         }}
                       >
                         Limpiar todos los filtros
                       </Button>
                     )}
                   </div>
                 </form>
               </div>
             </div>
           )}

           {/* Live Activity Banner */}
           <LiveEventBanner />

           {/* Punto de anclaje para fijar el bloque bajo el header */}
           <div ref={collapseAnchorRef} aria-hidden="true" className="!my-0 !p-0 h-0" />

           {/* Bloque fijo: "Eventos destacados" + "Próximos eventos" */}
           <div
             ref={stickyBarRef}
             style={{ top: headerHeight }}
             className="sticky z-30 -mx-4 px-4 md:-mx-6 md:px-6 bg-bg/95 backdrop-blur-md !mt-0 !mb-0"
           >
             {showFeaturedTitle && !showAfters && (
               <section aria-labelledby="events-featured" className="pt-4 md:pt-6 pb-4">
                 <h2
                   id="events-featured"
                   ref={featuredTitleRef}
                   className="font-display text-[22px] md:text-[28px] m-0 mb-3 truncate"
                 >
                   Eventos destacados
                 </h2>
                 <div
                   ref={featuredRowRef}
                   className="-mx-4 px-4 md:-mx-6 md:px-6 flex items-start overflow-x-auto hide-scrollbar snap-x snap-mandatory scroll-px-4 md:scroll-px-6 [--cols:2] md:[--cols:3] xl:[--cols:4] [--gap:12px] md:[--gap:20px]"
                   style={{ gap: "calc(var(--gap) * (1 - var(--p-card, 0)) + 8px * var(--p-card, 0))" }}
                 >
                   {isLoadingFeatured && featuredEvents.length === 0
                     ? [1, 2, 3, 4].map((i) => (
                         <EventCardSkeleton key={i} variant="featured" />
                       ))
                     : featuredEvents.map((event, index) => (
                     <EventCard
                       key={event.id}
                       event={event}
                       variant="featured"
                       priority={index < 4}
                       loading="eager"
                     />
                   ))}
                 </div>
               </section>
             )}

             {/* Filtros del listado: voy!, ¿Cuándo?, Ubicación */}
             <div
               ref={filtersContainerRef}
               className="relative -mx-4 px-4 md:-mx-6 md:px-6 border-t border-line py-2.5"
             >
               <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar whitespace-nowrap py-0.5">
             {/* Filtro 1: voy! */}
             <div
               className={cn(
                 "shrink-0 h-8 md:h-8.5 flex items-center rounded-full border transition-colors select-none",
                 showGoingOnly
                   ? "bg-accent/12 text-accent border-accent/40"
                   : "border-white/10 bg-surface text-ink hover:bg-surface-2",
               )}
             >
               <button
                 type="button"
                 aria-pressed={showGoingOnly}
                 onClick={() => {
                   setShowGoingOnly((current) => !current);
                   setIsWhenOpen(false);
                   setIsGenreOpen(false);
                   setIsDatesOpen(false);
                 }}
                 className={cn(
                   "root-logo-type h-full inline-flex items-center rounded-full text-[11px] lowercase tracking-[-0.04em] focus-visible:outline-2 focus-visible:outline-accent",
                   showGoingOnly ? "pl-3 pr-1" : "px-3",
                 )}
               >
                 voy!
               </button>

               {showGoingOnly && (
                 <button
                   type="button"
                   onPointerDown={(e) => e.stopPropagation()}
                   onTouchStart={(e) => e.stopPropagation()}
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     setShowGoingOnly(false);
                   }}
                   className="relative z-20 w-6 h-full rounded-full flex items-center justify-center text-accent hover:bg-white/10 active:scale-90 transition-transform touch-manipulation"
                   title="Quitar filtro voy!"
                   aria-label="Quitar filtro voy!"
                 >
                   <X className="size-3 pointer-events-none" aria-hidden="true" />
                 </button>
               )}
             </div>

             {/* Filtro Afters: solo afters próximos o en curso, agrupados por noche. */}
             <div
               className={cn(
                 "shrink-0 h-8 md:h-8.5 flex items-center rounded-full border transition-colors select-none text-xs",
                 showAfters
                   ? "bg-accent/12 text-accent border-accent/40"
                   : "border-white/10 bg-surface text-ink hover:bg-surface-2",
               )}
             >
               <button
                 type="button"
                 aria-pressed={showAfters}
                 onClick={() => (showAfters ? setShowAfters(false) : openAftersFilter())}
                 className={cn(
                   "root-logo-type h-full flex items-center gap-1.5 text-[11px] tracking-[-0.04em] focus-visible:outline-2 focus-visible:outline-accent rounded-full",
                   showAfters ? "pl-2.5 pr-1" : "px-2.5",
                 )}
               >
                 <Moon aria-hidden="true" className={cn("size-3.5 shrink-0", showAfters ? "text-accent" : "text-ink-2")} />
                 Afters
               </button>
               {showAfters && (
                 <button
                   type="button"
                   onPointerDown={(e) => e.stopPropagation()}
                   onTouchStart={(e) => e.stopPropagation()}
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     setShowAfters(false);
                   }}
                   className="relative z-20 w-6 h-full rounded-full flex items-center justify-center text-accent hover:bg-white/10 active:scale-90 transition-transform touch-manipulation"
                   title="Quitar filtro Afters"
                   aria-label="Quitar filtro Afters"
                 >
                   <X className="size-3 pointer-events-none" aria-hidden="true" />
                 </button>
               )}
             </div>

             {/* Filtro 2: ¿Cuándo? */}
             <div
               className={cn(
                 "shrink-0 h-8 md:h-8.5 flex items-center rounded-full border transition-colors select-none text-xs",
                 isDateActive
                   ? "bg-accent/12 text-accent border-accent/40"
                   : "border-white/10 bg-surface text-ink hover:bg-surface-2",
               )}
             >
               <button
                 type="button"
                 onClick={() => {
                   setActiveSheetType("when");
                   setIsWhenOpen((prev) => !prev);
                   setIsGenreOpen(false);
                   setIsDatesOpen(false);
                 }}
                 className={cn(
                   "root-logo-type h-full flex items-center gap-1.5 text-[11px] tracking-[-0.04em]",
                   isDateActive ? "pl-2.5 pr-1" : "pl-2.5 pr-2.5",
                 )}
               >
                 <Calendar
                   aria-hidden="true"
                   className={cn("size-3.5 shrink-0", isDateActive ? "text-accent" : "text-ink-2")}
                 />
                 <span className="max-w-[80px] sm:max-w-none truncate">{getDateLabel()}</span>
                 {!isDateActive && (
                   <ChevronDown
                     className={cn(
                       "size-3.5 text-ink-2 transition-transform duration-200 shrink-0",
                       isWhenOpen && "rotate-180",
                     )}
                   />
                 )}
               </button>

               {isDateActive && (
                 <button
                   type="button"
                   onPointerDown={(e) => e.stopPropagation()}
                   onTouchStart={(e) => e.stopPropagation()}
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     clearDateFilter();
                   }}
                   className="relative z-20 w-6 h-full rounded-full flex items-center justify-center text-accent hover:bg-white/10 active:scale-90 transition-transform touch-manipulation"
                   title="Quitar filtro de fecha"
                   aria-label="Quitar filtro de fecha"
                 >
                   <X className="size-3 pointer-events-none" aria-hidden="true" />
                 </button>
               )}
             </div>

             {/* Filtro 3: Ubicación */}
             <div
               className={cn(
                 "shrink-0 h-8 md:h-8.5 flex items-center rounded-full border transition-colors select-none text-xs",
                 isLocationActive
                   ? "bg-accent/12 text-accent border-accent/40"
                   : "border-white/10 bg-surface text-ink hover:bg-surface-2",
               )}
             >
               <button
                 type="button"
                 onClick={() => {
                   setActiveSheetType("location");
                   setCityQuery(appliedFilters.location);
                   setIsGenreOpen((prev) => !prev);
                   setIsWhenOpen(false);
                   setIsDatesOpen(false);
                 }}
                 className={cn(
                   "root-logo-type h-full flex items-center gap-1.5 text-[11px] tracking-[-0.04em]",
                   isLocationActive ? "pl-2.5 pr-1" : "pl-2.5 pr-2.5",
                 )}
               >
                 <MapPin
                   aria-hidden="true"
                   className={cn("size-3.5 shrink-0", isLocationActive ? "text-accent" : "text-ink-2")}
                 />
                 <span className="max-w-[80px] sm:max-w-none truncate">{getLocationLabel()}</span>
                 {!isLocationActive && (
                   <ChevronDown
                     className={cn(
                       "size-3.5 text-ink-2 transition-transform duration-200 shrink-0",
                       isGenreOpen && "rotate-180",
                     )}
                   />
                 )}
               </button>

               {isLocationActive && (
                 <button
                   type="button"
                   onPointerDown={(e) => e.stopPropagation()}
                   onTouchStart={(e) => e.stopPropagation()}
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     clearLocationFilter();
                   }}
                   className="relative z-20 w-6 h-full rounded-full flex items-center justify-center text-accent hover:bg-white/10 active:scale-90 transition-transform touch-manipulation"
                   title="Quitar filtro de ubicación"
                   aria-label="Quitar filtro de ubicación"
                 >
                   <X className="size-3 pointer-events-none" aria-hidden="true" />
                 </button>
               )}
             </div>
               </div>

  
               {/* Menú flotante de ¿Cuándo? (Desktop) */}
               {isWhenOpen && (
                 <div className="hidden md:block absolute left-6 top-full mt-1.5 w-72 rounded-2xl border border-white/10 bg-[#14171F] p-1.5 shadow-2xl shadow-black/90 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                   <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                     ¿Cuándo?
                   </div>
                   {[
                     { id: "weekend", label: "Este finde", desc: "Vie a Dom" },
                     { id: "week", label: "Próximos 7 días", desc: "Semana entrante" },
                     { id: "month", label: "Este mes", desc: "Mes en curso" },
                   ].map((opt) => {
                     const isSelected = temporalPreset === opt.id;
                     return (
                       <button
                         key={opt.id}
                         type="button"
                         onClick={() => {
                           setIsDatesOpen(false);
                           handleSelectTemporal(opt.id as TemporalPreset);
                         }}
                         className={cn(
                           "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer",
                           isSelected
                             ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                             : "text-neutral-300 hover:bg-white/5 hover:text-white",
                         )}
                       >
                         <div className="flex flex-col text-left">
                           <span>{opt.label}</span>
                           <span className="text-[10px] font-normal text-neutral-500">{opt.desc}</span>
                         </div>
                         {isSelected && <Check className="h-3.5 w-3.5 text-[#D4FF00]" />}
                       </button>
                     );
                   })}
  
                   {/* Opción para seleccionar fechas específicas */}
                   <button
                     type="button"
                     onClick={() => setIsDatesOpen((prev) => !prev)}
                     className={cn(
                       "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer",
                       isCustomDateActive || isDatesOpen
                         ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                         : "text-neutral-300 hover:bg-white/5 hover:text-white",
                     )}
                   >
                     <div className="flex flex-col text-left">
                       <span>Seleccionar fechas</span>
                       <span className="text-[10px] font-normal text-neutral-500">
                         Elegir rango en el calendario
                       </span>
                     </div>
                     <ChevronDown
                       className={cn(
                         "h-3.5 w-3.5 transition-transform duration-200",
                         isDatesOpen && "rotate-180",
                       )}
                     />
                   </button>
  
                   {isDatesOpen && (
                     <div className="mt-1.5 border-t border-white/10 px-2 pt-2.5 pb-1.5 space-y-2.5 animate-in fade-in duration-150">
                       <div className="grid grid-cols-2 gap-2">
                         <label className="min-w-0 flex flex-col gap-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                           <span>Desde</span>
                           <input
                             type="date"
                             value={draftFilters.startDate}
                             onChange={(event) =>
                               setDraftFilters((current) => ({ ...current, startDate: event.target.value }))
                             }
                             className="block w-full max-w-[122px] min-w-0 box-border appearance-none rounded-xl border border-white/10 bg-[#0B0D10] px-2 py-1.5 text-[11px] text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                           />
                         </label>
                         <label className="min-w-0 flex flex-col gap-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                           <span>Hasta</span>
                           <input
                             type="date"
                             value={draftFilters.endDate}
                             onChange={(event) =>
                               setDraftFilters((current) => ({ ...current, endDate: event.target.value }))
                             }
                             className="block w-full max-w-[122px] min-w-0 box-border appearance-none rounded-xl border border-white/10 bg-[#0B0D10] px-2 py-1.5 text-[11px] text-white focus:border-[#D4FF00] focus:outline-none transition-colors"
                           />
                         </label>
                       </div>
                       <button
                         type="button"
                         onClick={applyCustomDates}
                         className="w-full rounded-xl bg-[#D4FF00] py-2 text-xs font-black uppercase tracking-wider text-neutral-950 hover:bg-[#bce400] transition-colors cursor-pointer"
                       >
                         Aplicar fechas
                       </button>
                     </div>
                   )}
  
                   {isDateActive && (
                     <>
                       <div className="my-1 border-t border-white/10" />
                       <button
                         type="button"
                         onClick={clearDateFilter}
                         className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                       >
                         <span>Cualquier fecha</span>
                         <X className="h-3 w-3" />
                       </button>
                     </>
                   )}
                 </div>
               )}
  
               {/* Menú flotante de Ubicación (Desktop) */}
               {isGenreOpen && (
                 <div className="hidden md:block absolute left-6 top-full mt-1.5 w-72 rounded-2xl border border-white/[0.08] border-t-white/[0.16] bg-[#14171F]/95 p-3 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blu
   space-y-2.5">
                   <div className="px-1 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                     Ubicación
                   </div>
                   <form
                     onSubmit={(e) => {
                       e.preventDefault();
                       applyLocationFilter(cityQuery);
                     }}
                     className="flex items-center gap-2 rounded-xl bg-[#0B0D10] px-3 py-2 border border-white/10 focus-within:border-[#D4FF00]"
                   >
                     <Search className="h-3.5 w-3.5 text-[#D4FF00] shrink-0" />
                     <input
                       type="text"
                       value={cityQuery}
                       onChange={(e) => setCityQuery(e.target.value)}
                       placeholder="Buscar ciudad..."
                       className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                     />
                     {cityQuery && (
                       <button
                         type="button"
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           clearLocationFilter();
                         }}
                         className="p-0.5 text-neutral-400 hover:text-white cursor-pointer"
                         aria-label="Limpiar ubicación"
                       >
                         <X className="size-4 pointer-events-none" aria-hidden="true" />
                       </button>
                     )}
                   </form>
                   <div className="max-h-48 overflow-y-auto space-y-1 hide-scrollbar">
                     {filteredCitySuggestions.map((city) => {
                       const isSelected =
                         appliedFilters.location.toLowerCase() === city.toLowerCase();
                       return (
                         <button
                           key={city}
                           type="button"
                           onClick={() => applyLocationFilter(city)}
                           className={cn(
                             "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all cursor-pointer",
                             isSelected
                               ? "bg-[#D4FF00]/15 text-[#D4FF00]"
                               : "text-neutral-300 hover:bg-white/5 hover:text-white",
                           )}
                         >
                           <span className="flex items-center gap-2">
                             <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                             {city}
                           </span>
                           {isSelected && <Check className="h-3.5 w-3.5 text-[#D4FF00]" />}
                         </button>
                       );
                     })}
                     {cityQuery.trim() &&
                       !filteredCitySuggestions.some(
                         (c) => c.toLowerCase() === cityQuery.trim().toLowerCase(),
                       ) && (
                         <button
                           type="button"
                           onClick={() => applyLocationFilter(cityQuery)}
                           className="flex w-full items-center justify-between rounded-xl bg-[#D4FF00]/15 px-2.5 py-2 text-xs font-bold text-[#D4FF00] cursor-pointer"
                         >
                           <span>Buscar &ldquo;{cityQuery.trim()}&rdquo;</span>
                           <ArrowRight className="h-3.5 w-3.5" />
                         </button>
                       )}
                   </div>
  
                   {isLocationActive && (
                     <>
                       <div className="my-1 border-t border-white/[0.06]" />
                       <button
                         type="button"
                         onClick={clearLocationFilter}
                         className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                       >
                         <span>Todas las ubicaciones</span>
                         <X className="h-3 w-3" />
                       </button>
                     </>
                   )}
                 </div>
               )}
             </div>
           </div>

           {/* Espaciador dinámico que recupera la altura colapsada */}
           <div ref={collapseSpacerRef} aria-hidden="true" className="!my-0 !p-0" />

           {/* Afters de esta noche: solo de 18:00 a 12:00 y si hay; nunca dentro de la grilla de eventos. */}
           {showTonightStrip && (
             <TonightAftersStrip afters={tonightAfters.afters} total={tonightAfters.total} onSeeAll={openAftersFilter} />
           )}

           {/* Filtros del listado: voy!, ¿Cuándo?, Ubicación y vista */}
           {/* Título de sección y selector de layout */}
           <div className="flex items-center justify-between gap-3 pt-2">
             <h2
               ref={sectionTitleRef}
               className="font-display text-[22px] md:text-[28px] m-0 truncate min-w-0"
             >
               {showAfters ? "Afters" : sortBy === "popular" ? "Más convocados" : "Próximos eventos"}
             </h2>

             {showAfters ? (
               <div className="flex items-center gap-3 shrink-0">
                 {aftersList.status === "ready" && (
                   <span className="text-[13px] text-ink-2">
                     <span className="num-mono text-ink">{visibleAfters.length}</span> próximos
                   </span>
                 )}
                 <Button
                   variant="secondary"
                   size="sm"
                   onClick={() => requireKyc(() => router.push("/afters/new"))}
                   className="hidden lg:inline-flex"
                 >
                   <Plus className="size-4" aria-hidden="true" /> Subir un after
                 </Button>
               </div>
             ) : (
               <>

                 <SegmentedControl
                   label="Vista"
                   className="hidden md:flex shrink-0"
                   options={viewOptions.map((option) => ({ ...option }))}
                   value={viewMode}
                   onChange={setViewMode}
                 />
  
                 {/* Selector de vista (mobile) */}
                 <div
                   role="radiogroup"
                   aria-label="Vista"
                   className="relative md:hidden shrink-0 flex p-[2px] rounded-lg bg-surface border border-line"
                 >
                   <TabIndicator variant="pill" />
                   {viewOptions.map(({ id, label, icon: Icon }) => (
                     <button
                       key={id}
                       type="button"
                       role="radio"
                       aria-checked={viewMode === id}
                       aria-label={label}
                       onClick={() => setViewMode(id)}
                       className={cn(
                         "relative z-[1] size-7 flex items-center justify-center rounded-[6px] transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                         viewMode === id ? "text-bg" : "text-ink-2 hover:text-ink",
                       )}
                     >
                       <Icon className="size-3.5" aria-hidden={true} />
                     </button>
                   ))}
                 </div>
               </>
             )}
           </div>

           {/* Chips de Filtros Activos */}
           {hasActiveChips && (
             <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-fade-in">
               <span className="label-mono text-ink-3 mr-0.5">Filtros</span>
               {appliedFilters.location && (
                 <span className="inline-flex items-center gap-1 h-9 pl-3 pr-1 rounded-full border border-white/10 bg-surface text-[13px] font-medium text-ink">
                   Zona: {appliedFilters.location}
                   <button
                     type="button"
                     onClick={() => removeSingleFilter("location")}
                     className="size-8 rounded-full flex items-center justify-center hover:bg-white/10"
                     title="Quitar zona"
                   >
                     <X className="h-3 w-3" />
                   </button>
                 </span>
               )}
               {appliedFilters.priceType !== "all" && (
                 <span className="inline-flex items-center gap-1 h-9 pl-3 pr-1 rounded-full border border-white/10 bg-surface text-[13px] font-medium text-ink">
                   {appliedFilters.priceType === "free" ? "Gratis" : "De pago"}
                   <button
                     type="button"
                     onClick={() => removeSingleFilter("priceType")}
                     className="size-8 rounded-full flex items-center justify-center hover:bg-white/10"
                     title="Quitar precio"
                   >
                     <X className="h-3 w-3" />
                   </button>
                 </span>
               )}
               {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
                 <span className="inline-flex items-center gap-1 h-9 pl-3 pr-1 rounded-full border border-white/10 bg-surface text-[13px] font-medium text-ink">
                   ${appliedFilters.minPrice || "0"} - ${appliedFilters.maxPrice || "∞"}
                   <button
                     type="button"
                     onClick={() => removeSingleFilter("price")}
                     className="size-8 rounded-full flex items-center justify-center hover:bg-white/10"
                     title="Quitar rango de precio"
                   >
                     <X className="h-3 w-3" />
                   </button>
                 </span>
               )}
               {sortBy === "popular" && (
                 <span className="inline-flex items-center gap-1 h-9 pl-3 pr-1 rounded-full border border-accent/40 bg-accent/12 text-[13px] font-semibold text-accent">
                   <Flame className="h-3 w-3 fill-[#D4FF00]" />
                   Más votados
                   <button
                     type="button"
                     onClick={() => setSortBy("date")}
                     className="size-8 rounded-full flex items-center justify-center hover:bg-white/10"
                     title="Quitar más votados"
                   >
                     <X className="h-3 w-3" />
                   </button>
                 </span>
               )}
               {debouncedQuery && (
                 <span className="inline-flex items-center gap-1 h-9 pl-3 pr-1 rounded-full border border-accent/40 bg-accent/12 text-[13px] font-semibold text-accent">
                   &ldquo;{debouncedQuery}&rdquo;
                   <button
                     type="button"
                     onClick={() => setSearchQuery("")}
                     className="size-8 rounded-full flex items-center justify-center hover:bg-white/10"
                     title="Quitar búsqueda"
                   >
                     <X className="h-3 w-3" />
                   </button>
                 </span>
               )}
               <button
                 type="button"
                 onClick={clearFilters}
                 className="h-9 px-2 text-[13px] font-semibold text-accent hover:text-accent-hover"
               >
                 Limpiar todo
               </button>
             </div>
           )}

           {/* Listado de Eventos (Skeleton, Error o Vistas) */}
           {showAfters ? (
             <AftersFilterResults
               afters={visibleAfters}
               status={aftersList.status}
               onRetry={() => void aftersList.reload()}
               onlyGoing={showGoingOnly}
             />
           ) : !hasLoaded || (isLoadingEvents && events.length === 0) ? (
             viewMode === "calendar" ? (
               <div className="rounded-card border border-line bg-surface p-5 space-y-4 animate-pulse">
                 <div className="h-8 w-48 rounded-full bg-white/10" />
                 <div className="grid grid-cols-7 gap-2 pt-4">
                   {Array.from({ length: 28 }).map((_, i) => (
                     <div key={i} className="aspect-square rounded-2xl bg-white/5" />
                   ))}
                 </div>
               </div>
             ) : viewMode === "list" ? (
               <div className="flex flex-col gap-3">
                 {[1, 2, 3, 4, 5, 6].map((item) => (
                   <EventCardSkeleton key={item} variant="list" />
                 ))}
               </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                 {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                   <EventCardSkeleton key={item} variant="grid" />
                 ))}
               </div>
             )
           ) : eventsError && events.length === 0 ? (
             <div className="space-y-4 rounded-card border border-danger/30 bg-surface p-8 text-center">
               <RefreshCw className="mx-auto size-7 text-danger" aria-hidden="true" />
               <p className="text-base font-semibold">No pudimos cargar los eventos.</p>
               <Button
                 size="sm"
                 variant="outline"
                 onClick={() =>
                   void fetchEvents({ filters: appliedFilters, offset: 0, append: false })
                 }
               >
                 Reintentar
               </Button>
             </div>
           ) : displayEvents.length > 0 ? (
             viewMode === "calendar" ? (
               <div key="calendar" className="tab-panel-in">
                 <EventCalendarView events={displayEvents} />
               </div>
             ) : viewMode === "list" ? (
               <div key="list" className="tab-panel-in flex flex-col gap-6">
                 {chronologicalGroups.map((group, groupIndex) => (
                   <div key={group.id} className="space-y-3">
                     <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                       <div className="flex items-baseline gap-2 min-w-0">
                         <span className="font-display text-lg truncate">{group.title}</span>
                         {group.subtitle && (
                           <span className="label-mono text-ink-3 shrink-0">{group.subtitle}</span>
                         )}
                       </div>
                       <span className="label-mono text-ink-3 shrink-0">
                         {group.events.length} {group.events.length === 1 ? "evento" : "eventos"}
                       </span>
                     </div>

                     <div className="flex flex-col gap-3">
                       {group.events.map((event, eventIndex) => (
                         <EventCard
                           key={event.id}
                           event={event}
                           variant="list"
                           priority={groupIndex === 0 && eventIndex < 4}
                           loading={groupIndex === 0 || (groupIndex === 1 && eventIndex < 4) ? "eager" : "lazy"}
                         />
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div key="grid" className="tab-panel-in grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                 {displayEvents.map((event, index) => (
                   <EventCard
                     key={event.id}
                     event={event}
                     variant="full"
                     priority={index < 6}
                     loading={index < 12 ? "eager" : "lazy"}
                   />
                 ))}
               </div>
             )
           ) : (
             <div className="space-y-3 rounded-card border border-line bg-surface p-8 text-center">
               <Film className="mx-auto size-8 text-ink-3" aria-hidden="true" />
               <p className="text-base font-semibold">
                 {showGoingOnly ? "Todavía no marcaste que vas a un evento" : "No hay próximos eventos con esos filtros"}
               </p>
               <p className="text-sm text-ink-2">
                 {showGoingOnly
                   ? user
                     ? "Cuando marques “Voy”, lo vas a encontrar acá."
                     : "Iniciá sesión para ver tus eventos confirmados."
                   : "Probá ampliar el rango o limpiar los filtros."}
               </p>
               {showGoingOnly ? (
                 <Button size="sm" onClick={() => (user ? setShowGoingOnly(false) : router.push("/login"))}>
                   {user ? "Explorar eventos" : "Iniciar sesión"}
                 </Button>
               ) : (
                 <Button size="sm" onClick={clearFilters}>
                   Limpiar filtros
                 </Button>
               )}
             </div>
           )}

           {/* Loader de Scroll Infinito */}
           {!showAfters && isLoadingEvents && events.length > 0 && (
             <RootLoader size="xs" ariaLabel="Cargando más eventos" className="pt-6 pb-2" />
           )}

           {!showAfters && <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />}

           {/* Al final de la lista: mandar un evento para revisión. */}
           {!showAfters && hasLoaded && !hasMore && displayEvents.length > 0 && <SubmitEventCta />}
         </div>
       </PullToRefresh>

       {/* BottomSheet de Filtros Móvil */}
       <BottomSheet
         isOpen={isWhenOpen || isGenreOpen}
         onClose={() => {
           setIsWhenOpen(false);
           setIsGenreOpen(false);
           setIsDatesOpen(false);
         }}
         icon={
           activeSheetType === "when" ? (
             <Calendar className="h-4 w-4 text-accent" />
           ) : (
             <MapPin className="h-4 w-4 text-accent" />
           )
         }
         title={activeSheetType === "when" ? "¿Cuándo?" : "Ubicación"}
         subtitle={
           activeSheetType === "when" ? "Filtro temporal" : "Filtrar por ciudad o zona"
         }
         ariaLabel={activeSheetType === "when" ? "Filtrar por fecha" : "Filtrar por ubicación"}
         initialHeight={520}
         bodyClassName="flex flex-col"
       >
         {activeSheetType === "when" ? (
           <div className="space-y-2 pt-1">
             {[
               { id: "weekend", label: "Este finde", desc: "Vie a Dom" },
               { id: "week", label: "Próximos 7 días", desc: "Semana entrante" },
               { id: "month", label: "Este mes", desc: "Mes en curso" },
             ].map((opt) => {
               const isSelected = temporalPreset === opt.id;
               return (
                 <button
                   key={opt.id}
                   type="button"
                   onClick={() => {
                     setIsDatesOpen(false);
                     handleSelectTemporal(opt.id as TemporalPreset);
                   }}
                   className={cn(
                     "flex w-full items-center justify-between rounded-control px-4 py-3 text-sm font-semibold transition-colors cursor-pointer border",
                     isSelected
                       ? "bg-accent/15 text-accent border-accent/40 font-bold"
                       : "bg-surface-2 border-line text-ink hover:bg-surface-2/80",
                   )}
                 >
                   <div className="flex flex-col text-left">
                     <span>{opt.label}</span>
                     <span className="text-[11px] font-normal text-ink-3">{opt.desc}</span>
                   </div>
                   {isSelected && <Check className="h-4 w-4 text-accent" />}
                 </button>
               );
             })}

             {/* Selector de fechas manuales */}
             <button
               type="button"
               onClick={() => setIsDatesOpen((prev) => !prev)}
               className={cn(
                 "flex w-full items-center justify-between rounded-control px-4 py-3 text-sm font-semibold transition-colors cursor-pointer border",
                 isCustomDateActive || isDatesOpen
                   ? "bg-accent/15 text-accent border-accent/40 font-bold"
                   : "bg-surface-2 border-line text-ink hover:bg-surface-2/80",
               )}
             >
               <div className="flex flex-col text-left">
                 <span>Seleccionar fechas</span>
                 <span className="text-[11px] font-normal text-ink-3">Elegir rango en el calendario</span>
               </div>
               <ChevronDown
                 className={cn(
                   "h-4 w-4 text-ink-2 transition-transform duration-200",
                   isDatesOpen && "rotate-180",
                 )}
               />
             </button>

             {isDatesOpen && (
               <div className="mt-2 rounded-control border border-line bg-bg p-3.5 space-y-3 animate-fade-in">
                 <div className="grid grid-cols-2 gap-2">
                   <label className="min-w-0 flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-3">
                     <span>Desde</span>
                     <input
                       type="date"
                       value={draftFilters.startDate}
                       onChange={(event) =>
                         setDraftFilters((current) => ({ ...current, startDate: event.target.value }))
                       }
                       className="block w-full min-w-0 box-border appearance-none rounded-xl border border-line bg-surface-2 px-2.5 py-2 text-xs text-ink focus:border-accent focus:outline-none transition-colors"
                     />
                   </label>
                   <label className="min-w-0 flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-3">
                     <span>Hasta</span>
                     <input
                       type="date"
                       value={draftFilters.endDate}
                       onChange={(event) =>
                         setDraftFilters((current) => ({ ...current, endDate: event.target.value }))
                       }
                       className="block w-full min-w-0 box-border appearance-none rounded-xl border border-line bg-surface-2 px-2.5 py-2 text-xs text-ink focus:border-accent focus:outline-none transition-colors"
                     />
                   </label>
                 </div>
                 <button
                   type="button"
                   onClick={applyCustomDates}
                   className="w-full rounded-control bg-accent py-2.5 text-xs font-bold uppercase tracking-wider text-on-accent hover:bg-accent-hover transition-colors cursor-pointer"
                 >
                   Aplicar fechas
                 </button>
               </div>
             )}

             {isDateActive && (
               <button
                 type="button"
                 onClick={clearDateFilter}
                 className="mt-2 flex w-full items-center justify-center gap-2 rounded-control border border-line bg-surface-2 py-2.5 text-xs font-semibold text-ink-2 hover:bg-white/10 hover:text-ink transition-colors cursor-pointer"
               >
                 <span>Limpiar filtro de fecha</span>
                 <X className="h-3.5 w-3.5" />
               </button>
             )}
           </div>
         ) : (
           <div className="flex min-h-0 flex-1 flex-col gap-3 pt-1">
             <form
               onSubmit={(e) => {
                 e.preventDefault();
                 applyLocationFilter(cityQuery);
               }}
               className="flex shrink-0 items-center gap-2.5 rounded-control bg-bg px-3.5 py-2.5 border border-line focus-within:border-accent transition-colors"
             >
               <Search className="h-4 w-4 text-accent shrink-0" />
               <input
                 type="text"
                 value={cityQuery}
                 onChange={(e) => setCityQuery(e.target.value)}
                 placeholder="Buscar ciudad (ej. Montevideo, Maldonado)..."
                 className="w-full bg-transparent text-sm font-medium text-ink placeholder-ink-3 focus:outline-none"
               />
               {cityQuery && (
                 <button
                   type="button"
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     setCityQuery("");
                     if (isLocationActive) {
                       const next = { ...appliedFilters, location: "" };
                       setDraftFilters(next);
                       setAppliedFilters(next);
                       void fetchEvents({
                         filters: next,
                         offset: 0,
                         append: false,
                         query: debouncedQuery,
                       }).catch(() => undefined);
                     }
                   }}
                   className="p-1 text-ink-3 hover:text-ink cursor-pointer touch-manipulation"
                   aria-label="Limpiar ubicación"
                 >
                   <X className="h-4 w-4 pointer-events-none" />
                 </button>
               )}
             </form>

             <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto hide-scrollbar">
               {filteredCitySuggestions.map((city) => {
                 const isSelected =
                   appliedFilters.location.toLowerCase() === city.toLowerCase();
                 return (
                   <button
                     key={city}
                     type="button"
                     onClick={() => applyLocationFilter(city)}
                     className={cn(
                       "flex w-full items-center justify-between rounded-control px-4 py-3 text-sm font-semibold transition-colors cursor-pointer border",
                       isSelected
                         ? "bg-accent/15 text-accent border-accent/40 font-bold"
                         : "bg-surface-2 border-line text-ink hover:bg-surface-2/80",
                     )}
                   >
                     <span className="flex items-center gap-2.5">
                       <MapPin className={cn("h-4 w-4", isSelected ? "text-accent" : "text-ink-3")} />
                       {city}
                     </span>
                     {isSelected && <Check className="h-4 w-4 text-accent" />}
                   </button>
                 );
               })}
             </div>

             {cityQuery.trim() &&
               !filteredCitySuggestions.some(
                 (c) => c.toLowerCase() === cityQuery.trim().toLowerCase(),
               ) && (
                 <button
                   type="button"
                   onClick={() => applyLocationFilter(cityQuery)}
                   className="w-full shrink-0 rounded-control bg-accent py-3 text-xs font-bold uppercase tracking-wider text-on-accent hover:bg-accent-hover transition-colors cursor-pointer"
                 >
                   Buscar en &ldquo;{cityQuery.trim()}&rdquo;
                 </button>
               )}

             {isLocationActive && (
               <button
                 type="button"
                 onClick={clearLocationFilter}
                 className="flex w-full shrink-0 items-center justify-center gap-2 rounded-control border border-line bg-surface-2 py-2.5 text-xs font-semibold text-ink-2 hover:bg-white/10 hover:text-ink transition-colors cursor-pointer"
               >
                 <span>Limpiar filtro de ubicación</span>
                 <X className="h-3.5 w-3.5" />
               </button>
             )}
           </div>
         )}
       </BottomSheet>

       <QuickActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
     </div>
   );
 }