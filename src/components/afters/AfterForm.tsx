"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, ImagePlus, Lock, MapPin, Minus, Plus, Ticket, Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { EventMiniCard } from "@/components/match/TempCrewCards";
import { AfterCard } from "@/components/afters/AfterCard";
import { useAuth } from "@/context/AuthContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useAfterEventChoices, useSaveAfter } from "@/hooks/useAfters";
import { parseEventRealDate } from "@/hooks/useDanceSync";
import { formatAfterDay, startShortcuts, startsAtFor } from "@/lib/afters";
import { apiErrorMessage } from "@/lib/apiErrors";
import { cn, isValidImageUrl } from "@/lib/utils";
import {
  AFTER_ADDRESS_MAX,
  AFTER_COVER_MAX_BYTES,
  AFTER_GENRES,
  AFTER_LINEUP_MAX,
  AFTER_MAX_CAPACITY,
  AFTER_MAX_DAYS_AHEAD,
  AFTER_MAX_GENRES,
  AFTER_MIN_CAPACITY,
  AFTER_NAME_MAX,
  AFTER_RULES_MAX,
  AFTER_ZONE_MAX,
  type AfterAccess,
  type AfterDetail,
  type AfterEventRef,
  type AfterInput,
  type AfterSummary,
  type AfterUpdateInput,
} from "@/types/afters";
import type { Event } from "@/types/events";

const fieldClass =
  "w-full rounded-control border border-line-strong bg-bg px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent";
const chipClass = (on: boolean) =>
  cn(
    "h-9 px-3.5 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-accent",
    on ? "bg-accent text-on-accent border-accent" : "bg-surface border-line-strong text-ink hover:bg-surface-2",
  );

const ACCESS_OPTIONS: { value: AfterAccess; label: string; hint: string; icon: typeof Users }[] = [
  { value: "free", label: "Libre", hint: "Cualquiera que vaya puede ver la dirección.", icon: Users },
  { value: "approval", label: "Con aprobación", hint: "Vos aceptás a cada persona; la dirección la ven solo los aceptados.", icon: Lock },
  { value: "ticket", label: "Con entrada", hint: "Precio y link para comprar.", icon: Ticket },
];

type PickedEvent = AfterEventRef & { endDate?: string | null };

const toPicked = (event: Event): PickedEvent => ({
  id: event.id,
  title: event.title,
  date: event.date,
  location: event.location,
  image: event.cinematicBannerUrl || null,
  endDate: event.endDate ?? null,
});

/** Valor para un <input type="datetime-local"> en la hora del dispositivo. */
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface AfterFormProps {
  /** Fiesta prellenada (`/afters/new?eventId=`). */
  initialEventId?: string | null;
  /** Editar: el detalle actual (trae la dirección porque quien edita es el host). */
  editing?: AfterDetail | null;
}

/**
 * Subir o editar un after. Mobile: pantalla completa con el botón fijo abajo.
 * Escritorio: formulario y vista previa al costado. Al publicar va al detalle.
 */
export function AfterForm({ initialEventId = null, editing = null }: AfterFormProps) {
  const ids = useId();
  const router = useRouter();
  const { user } = useAuth();
  const goBack = useBackNavigation(editing ? `/afters/${editing.id}` : initialEventId ? `/events/${initialEventId}` : "/events");
  const save = useSaveAfter();
  const choices = useAfterEventChoices(editing ? null : initialEventId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [cover, setCover] = useState<File | null>(null);
  const [keepCurrentCover, setKeepCurrentCover] = useState(true);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [name, setName] = useState(editing?.name ?? "");
  const [event, setEvent] = useState<PickedEvent | null>(editing?.event ?? null);
  const [eventTouched, setEventTouched] = useState(Boolean(editing));
  const [time, setTime] = useState<string | null>(editing ? "custom" : null);
  const [customStart, setCustomStart] = useState(editing ? toLocalInput(new Date(editing.startsAt)) : "");
  const [zone, setZone] = useState(editing?.zone ?? "");
  const [address, setAddress] = useState(editing?.address ?? "");
  const [access, setAccess] = useState<AfterAccess>(editing?.access ?? "approval");
  const [price, setPrice] = useState(editing?.price ?? "");
  const [ticketUrl, setTicketUrl] = useState(editing?.ticketUrl ?? "");
  const [capacity, setCapacity] = useState<number | null>(editing ? editing.capacity : 40);
  const [genres, setGenres] = useState<string[]>(editing?.genres ?? []);
  const [lineup, setLineup] = useState(editing?.lineup ?? "");
  const [rules, setRules] = useState(editing?.rules ?? "");
  const [confirmed, setConfirmed] = useState(Boolean(editing));
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // La fiesta del link llega después: se prellena una sola vez (si la persona no la cambió).
  const initialEvent = choices.initial;
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);
  if (initialEvent && !eventTouched && prefilledFrom !== initialEvent.id) {
    setPrefilledFrom(initialEvent.id);
    setEvent(toPicked(initialEvent));
  }

  // Vista previa de la foto elegida (o la actual al editar).
  const coverObjectUrl = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover]);
  useEffect(() => () => {
    if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl);
  }, [coverObjectUrl]);
  const coverPreview = coverObjectUrl ?? (keepCurrentCover ? editing?.coverUrl ?? null : null);

  // "Ahora", actualizado cada minuto: las validaciones de hora no leen el reloj durante el render.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const eventStartMs = event ? parseEventRealDate(event.date).getTime() : NaN;
  const eventEndMs = event?.endDate ? parseEventRealDate(event.endDate).getTime() : NaN;
  const shortcuts = useMemo(() => startShortcuts(Number.isNaN(eventEndMs) ? null : new Date(eventEndMs)), [eventEndMs]);

  const startsAt = useMemo(() => {
    if (time === "custom") {
      const date = customStart ? new Date(customStart) : null;
      return date && !Number.isNaN(date.getTime()) ? date : null;
    }
    if (!time) return null;
    const reference = !Number.isNaN(eventStartMs) && eventStartMs > now ? new Date(eventStartMs) : new Date(now);
    return startsAtFor(time, reference);
  }, [time, customStart, eventStartMs, now]);

  const problems = useMemo(() => {
    const list: Record<string, string> = {};
    if (!name.trim()) list.name = "Ponele un nombre.";
    if (!startsAt) list.time = "Elegí a qué hora empieza.";
    else {
      if (startsAt.getTime() < now - 5 * 60_000) list.time = "Esa hora ya pasó.";
      else if (startsAt.getTime() > now + AFTER_MAX_DAYS_AHEAD * 24 * 3_600_000) list.time = "Tiene que ser dentro de los próximos 7 días.";
      else if (!Number.isNaN(eventStartMs) && startsAt.getTime() < eventStartMs) list.time = "Tiene que empezar después de la fiesta.";
    }
    if (!zone.trim()) list.zone = "Contá en qué zona es.";
    if (!address.trim()) list.address = "Falta la dirección (solo la ven quienes aceptás).";
    if (access === "ticket" && !/^https:\/\/\S+\.\S+/i.test(ticketUrl.trim())) list.ticketUrl = "Pegá el link de compra (https://…).";
    if (capacity != null && (capacity < AFTER_MIN_CAPACITY || capacity > AFTER_MAX_CAPACITY)) list.capacity = `De ${AFTER_MIN_CAPACITY} a ${AFTER_MAX_CAPACITY} personas.`;
    if (!confirmed) list.confirmed = "Confirmá que es para mayores de 18.";
    return list;
  }, [name, startsAt, now, eventStartMs, zone, address, access, ticketUrl, capacity, confirmed]);
  const isValid = Object.keys(problems).length === 0;

  const pickCover = (file: File | undefined) => {
    setCoverError(null);
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setCoverError("Usá una foto JPG, PNG o WebP.");
      return;
    }
    if (file.size > AFTER_COVER_MAX_BYTES * 3) {
      setCoverError("La foto es muy pesada.");
      return;
    }
    setCover(file);
  };

  const submit = async () => {
    if (save.isLoading) return;
    if (!isValid || !startsAt) {
      setShowErrors(true);
      return;
    }
    const input: AfterInput = {
      name: name.trim(),
      eventId: event?.id,
      startsAt: startsAt.toISOString(),
      zone: zone.trim(),
      address: address.trim(),
      access,
      price: access === "ticket" && price.trim() ? price.trim() : undefined,
      ticketUrl: access === "ticket" ? ticketUrl.trim() : undefined,
      capacity: capacity ?? undefined,
      genres: genres.slice(0, AFTER_MAX_GENRES),
      lineup: lineup.trim() || undefined,
      rules: rules.trim() || undefined,
    };
    // Al editar, lo que se vació va como null: si se omitiera, el backend conservaría el valor anterior
    // (por ejemplo, quitar la fiesta o el cupo).
    const payload: AfterInput | AfterUpdateInput = editing
      ? {
          ...input,
          eventId: input.eventId ?? null,
          price: input.price ?? null,
          ticketUrl: input.ticketUrl ?? null,
          capacity: input.capacity ?? null,
          lineup: input.lineup ?? null,
          rules: input.rules ?? null,
        }
      : input;
    try {
      const after = await save.mutate({ id: editing?.id, input: payload, cover });
      router.replace(`/afters/${after.id}`);
    } catch {
      // el error se muestra abajo (y kyc_required abre la hoja de verificación)
    }
  };

  // Vista previa con los datos del formulario: la tarjeta nunca muestra la dirección.
  const preview: AfterSummary = {
    id: editing?.id ?? "preview",
    name: name.trim() || "Tu after",
    coverUrl: coverPreview,
    startsAt: (startsAt ?? new Date(now)).toISOString(),
    endsAt: null,
    archivesAt: "",
    zone: zone.trim() || "Tu zona",
    access,
    price: access === "ticket" ? price.trim() || null : null,
    ticketUrl: null,
    capacity,
    acceptedCount: editing?.acceptedCount ?? 0,
    goingCount: editing?.goingCount ?? 0,
    isOfficial: editing?.isOfficial ?? false,
    host: { userId: user?.id ?? "", name: user?.name ?? "", username: user?.username ?? "vos", avatarUrl: user?.avatarUrl ?? null, isKycVerified: true },
    event,
    genres,
    viewerStatus: "host",
  };

  const errorOf = (key: string) => (showErrors && problems[key] ? <span role="alert" className="text-xs text-danger">{problems[key]}</span> : null);
  const submitLabel = save.isLoading ? (editing ? "Guardando…" : "Publicando…") : editing ? "Guardar cambios" : "Publicar after";
  const title = editing ? "Editar after" : "Subir un after";

  const form = (
    <div className="flex flex-col gap-5">
      {/* Foto */}
      <div className="flex flex-col gap-2">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => pickCover(e.target.files?.[0])} />
        {coverPreview && isValidImageUrl(coverPreview) ? (
          <div className="relative h-[170px] rounded-card overflow-hidden border border-line bg-surface bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(coverPreview)})` }}>
            <div className="absolute right-2.5 top-2.5 flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="h-9 px-3 rounded-full bg-bg/85 text-[13px] font-semibold">Cambiar</button>
              <button
                type="button"
                aria-label="Quitar foto"
                onClick={() => {
                  setCover(null);
                  setKeepCurrentCover(false);
                }}
                className="size-9 rounded-full bg-bg/85 flex items-center justify-center"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-[130px] rounded-card border border-dashed border-white/20 bg-surface/50 text-ink flex flex-col items-center justify-center gap-2.5 text-sm font-semibold hover:bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span className="size-11 rounded-full bg-surface-2 flex items-center justify-center">
              <ImagePlus className="size-5" aria-hidden="true" />
            </span>
            Subí una foto o flyer
          </button>
        )}
        <span className="text-xs text-ink-3">Si no subís nada, usamos una portada de root con el nombre y la zona.</span>
        {coverError && <span role="alert" className="text-xs text-danger">{coverError}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-name`} className="text-sm font-semibold">Nombre del after</label>
        <input id={`${ids}-name`} value={name} maxLength={AFTER_NAME_MAX} onChange={(e) => setName(e.target.value)} placeholder="Ej: After en Cordón" className={`${fieldClass} h-12`} />
        {errorOf("name")}
      </div>

      {/* Después de */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Después de</span>
        {event ? (
          <div className="flex items-center gap-2.5">
            <EventMiniCard event={{ id: event.id, title: event.title, date: event.date, location: event.location, cinematicBannerUrl: event.image }} className="flex-1 min-w-0" />
            <button
              type="button"
              onClick={() => {
                setIsPickerOpen(true);
                void choices.loadUpcoming();
              }}
              className="h-11 px-3 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold"
            >
              Cambiar
            </button>
            <button
              type="button"
              aria-label="Sin fiesta"
              onClick={() => {
                setEvent(null);
                setEventTouched(true);
              }}
              className="size-11 shrink-0 rounded-control bg-surface-2 border border-line-strong flex items-center justify-center"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsPickerOpen(true);
              void choices.loadUpcoming();
            }}
            className="h-12 px-3.5 rounded-control border border-line-strong bg-bg text-left text-[15px] text-ink-2 hover:border-white/30 transition-colors"
          >
            Elegí la fiesta (opcional)
          </button>
        )}
        <span className="text-xs text-ink-3">Opcional. Si lo atás a la fiesta, aparece en su detalle.</span>
      </div>

      {/* Hora */}
      <div className="flex flex-col gap-2">
        <span id={`${ids}-time`} className="text-sm font-semibold">¿A qué hora empieza?</span>
        <div role="group" aria-labelledby={`${ids}-time`} className="flex gap-2 flex-wrap">
          {shortcuts.map((shortcut) => (
            <button key={shortcut.label} type="button" aria-pressed={time === shortcut.time} onClick={() => setTime(shortcut.time)} className={chipClass(time === shortcut.time)}>
              {shortcut.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={time === "custom"}
            onClick={() => {
              setTime("custom");
              if (!customStart && startsAt) setCustomStart(toLocalInput(startsAt));
            }}
            className={chipClass(time === "custom")}
          >
            Otra hora
          </button>
        </div>
        {time === "custom" && (
          <input
            type="datetime-local"
            aria-label="Día y hora de inicio"
            value={customStart}
            min={toLocalInput(new Date(now))}
            max={toLocalInput(new Date(now + AFTER_MAX_DAYS_AHEAD * 24 * 3_600_000))}
            onChange={(e) => setCustomStart(e.target.value)}
            className={`${fieldClass} h-12 [color-scheme:dark]`}
          />
        )}
        {startsAt && time !== "custom" && (
          <span className="text-xs text-ink-3">Empieza: {formatAfterDay(startsAt)}.</span>
        )}
        {errorOf("time")}
      </div>

      {/* Zona + dirección */}
      <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-2 lg:gap-3.5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-zone`} className="text-sm font-semibold">Zona</label>
          <input id={`${ids}-zone`} value={zone} maxLength={AFTER_ZONE_MAX} onChange={(e) => setZone(e.target.value)} aria-describedby={`${ids}-zone-h`} placeholder="Ej: Cordón" className={`${fieldClass} h-12`} />
          <span id={`${ids}-zone-h`} className="text-xs text-ink-3">La ve todo el mundo.</span>
          {errorOf("zone")}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-address`} className="text-sm font-semibold">Dirección exacta</label>
          <input id={`${ids}-address`} value={address} maxLength={AFTER_ADDRESS_MAX} onChange={(e) => setAddress(e.target.value)} aria-describedby={`${ids}-address-h`} placeholder="Calle, número y apto" autoComplete="off" className={`${fieldClass} h-12`} />
          <span id={`${ids}-address-h`} className="text-xs text-ink-3">{access === "approval" ? "Solo la ven quienes aceptás." : "La ven quienes van al after."}</span>
          {errorOf("address")}
        </div>
      </div>

      {/* Acceso */}
      <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
        <legend className="text-sm font-semibold mb-2">¿Cómo se entra?</legend>
        {ACCESS_OPTIONS.map((option) => {
          const Icon = option.icon;
          const on = access === option.value;
          return (
            <label key={option.value} className={cn("relative flex gap-3 items-start px-3.5 py-3 rounded-control border cursor-pointer transition-colors", on ? "border-accent bg-accent/[0.06]" : "border-line-strong bg-bg hover:border-white/25")}>
              <input type="radio" name={`${ids}-access`} value={option.value} checked={on} onChange={() => setAccess(option.value)} className="peer sr-only" />
              <span aria-hidden="true" className={cn("size-5 shrink-0 rounded-full border-2 flex items-center justify-center mt-px peer-focus-visible:outline-2 peer-focus-visible:outline-accent", on ? "border-accent" : "border-ink-3")}>
                {on && <span className="size-2.5 rounded-full bg-accent" />}
              </span>
              <span className="flex flex-col gap-[3px]">
                <span className="font-semibold inline-flex gap-2 items-center"><Icon className="size-4" aria-hidden="true" /> {option.label}</span>
                <span className="text-[13px] leading-snug text-ink-2">{option.hint}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {access === "ticket" && (
        <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-[160px_1fr] lg:gap-3.5">
          <div className="flex flex-col gap-2">
            <label htmlFor={`${ids}-price`} className="text-sm font-semibold">Precio</label>
            <input id={`${ids}-price`} value={price} maxLength={20} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: $300" className={`${fieldClass} h-12`} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={`${ids}-ticket`} className="text-sm font-semibold">Link para comprar</label>
            <input id={`${ids}-ticket`} type="url" inputMode="url" value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} placeholder="https://" className={`${fieldClass} h-12`} />
            {errorOf("ticketUrl")}
          </div>
        </div>
      )}

      {/* Cupo */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span id={`${ids}-cap`} className="text-sm font-semibold">Cupo</span>
          <button type="button" onClick={() => setCapacity((c) => (c == null ? 40 : null))} className="min-h-9 text-[13px] font-semibold text-accent">
            {capacity == null ? "Poner cupo" : "Sin cupo"}
          </button>
        </div>
        {capacity != null ? (
          <div role="group" aria-labelledby={`${ids}-cap`} className="flex items-center justify-between gap-3 p-1.5 rounded-control border border-line-strong bg-bg">
            <button type="button" aria-label="Menos" disabled={capacity <= AFTER_MIN_CAPACITY} onClick={() => setCapacity((c) => Math.max(AFTER_MIN_CAPACITY, (c ?? 40) - (c && c > 20 ? 5 : 1)))} className="size-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center disabled:opacity-40">
              <Minus className="size-[18px]" aria-hidden="true" />
            </button>
            <span className="flex items-baseline gap-1.5" aria-live="polite">
              <span className="num-mono text-[22px] font-semibold">{capacity}</span>
              <span className="text-[13px] text-ink-2">personas</span>
            </span>
            <button type="button" aria-label="Más" disabled={capacity >= AFTER_MAX_CAPACITY} onClick={() => setCapacity((c) => Math.min(AFTER_MAX_CAPACITY, (c ?? 40) + (c && c >= 20 ? 5 : 1)))} className="size-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center disabled:opacity-40">
              <Plus className="size-[18px]" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <p className="m-0 px-3.5 py-3 rounded-control border border-line-strong bg-bg text-sm text-ink-2">Sin límite de gente.</p>
        )}
        <span className="text-xs text-ink-3">Opcional. Cuando se llena, deja de admitir pedidos.</span>
        {errorOf("capacity")}
      </div>

      {/* Música */}
      <div className="flex flex-col gap-2">
        <span id={`${ids}-music`} className="text-sm font-semibold">Música</span>
        <div role="group" aria-labelledby={`${ids}-music`} className="flex gap-2 flex-wrap">
          {AFTER_GENRES.map((genre) => {
            const on = genres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={on}
                disabled={!on && genres.length >= AFTER_MAX_GENRES}
                onClick={() => setGenres((current) => (on ? current.filter((g) => g !== genre) : [...current, genre]))}
                className={cn(chipClass(on), "disabled:opacity-40")}
              >
                {genre}
              </button>
            );
          })}
        </div>
        <input value={lineup} maxLength={AFTER_LINEUP_MAX} onChange={(e) => setLineup(e.target.value)} aria-label="Quién pasa música (opcional)" placeholder="¿Quién pasa música? (opcional)" className={`${fieldClass} h-12`} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-rules`} className="text-sm font-semibold">Reglas o detalles (opcional)</label>
        <textarea id={`${ids}-rules`} value={rules} rows={3} maxLength={AFTER_RULES_MAX} onChange={(e) => setRules(e.target.value)} placeholder="Ej: Timbre 3. Sin fotos en la pista." className={`${fieldClass} py-3 resize-none leading-snug`} />
        <span className="text-xs text-ink-3">Una regla por línea.</span>
      </div>

      <div className="flex flex-col gap-3 p-3.5 rounded-control bg-surface/60 border border-line">
        <label htmlFor={`${ids}-ok`} className="flex gap-3 items-start text-[13px] leading-normal text-ink/80 cursor-pointer">
          <input id={`${ids}-ok`} type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="size-5 m-0 shrink-0 accent-[var(--color-accent)]" />
          Es para mayores de 18 y acepto las reglas de root para afters.
        </label>
        <span className="text-xs leading-normal text-ink-3">Se publica al instante y se archiva solo 24 h después de empezar. Cualquiera lo puede denunciar.</span>
        {errorOf("confirmed")}
      </div>
    </div>
  );

  const submitError = save.error ? apiErrorMessage(save.error, "No pudimos publicar el after. Probá de nuevo.") : null;

  return (
    <div className="min-h-[100dvh] bg-bg text-ink pb-[calc(7.5rem+var(--root-safe-bottom))] lg:pb-16">
      <SwipeBack onBack={goBack} />
      {/* Mobile */}
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-2.5 flex items-center justify-center lg:hidden">
        <button type="button" aria-label="Cerrar" onClick={goBack} className="absolute left-4 bottom-1.5 size-11 rounded-full bg-surface-2 border border-line-strong flex items-center justify-center">
          <X className="size-5" aria-hidden="true" />
        </button>
        <h1 className="font-display text-[18px] m-0 px-12 truncate">{title}</h1>
      </header>
      {/* Escritorio */}
      <div className="hidden lg:flex items-center justify-between gap-3 pt-2 pb-6">
        <div className="flex items-center gap-3.5">
          <button type="button" aria-label="Volver" onClick={goBack} className="size-11 rounded-control bg-surface-2 border border-line-strong flex items-center justify-center">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <h1 className="font-display text-[40px] m-0">{title}</h1>
        </div>
        <span className="flex gap-2">
          <Button variant="secondary" onClick={goBack}>Cancelar</Button>
          <Button onClick={() => void submit()} disabled={save.isLoading}>{submitLabel}</Button>
        </span>
      </div>

      <div className="px-4 pt-3.5 flex flex-col gap-[22px] lg:px-0 lg:pt-0 lg:flex-row lg:gap-10 lg:items-start">
        <div className="lg:flex-1 lg:max-w-[760px] lg:p-6 lg:rounded-card lg:bg-surface lg:border lg:border-line">{form}</div>
        <aside className="flex flex-col gap-[22px] lg:w-[340px] lg:shrink-0 lg:sticky lg:top-28">
          <div className="flex flex-col gap-2.5">
            <span className="label-mono text-ink-2">{event ? "Así se ve en el evento" : "Así se va a ver"}</span>
            <div className="pointer-events-none" aria-hidden="true">
              <AfterCard after={preview} className="w-[250px] lg:w-full" />
            </div>
          </div>
          <div className="hidden lg:flex flex-col gap-2.5 text-[13px] leading-normal text-ink-2">
            <span className="label-mono">Dónde aparece</span>
            {event && <span className="flex gap-2.5"><MapPin className="size-4 shrink-0 text-accent" aria-hidden="true" />En el detalle de {event.title}.</span>}
            <span className="flex gap-2.5"><MapPin className="size-4 shrink-0 text-accent" aria-hidden="true" />En Eventos › Afters y en &quot;Afters de esta noche&quot;.</span>
            {access === "approval" && <span className="flex gap-2.5"><Bell className="size-4 shrink-0 text-accent" aria-hidden="true" />Te avisamos cuando alguien pide entrar.</span>}
          </div>
          {submitError && <p role="alert" className="hidden lg:block m-0 text-[13px] text-danger">{submitError}</p>}
        </aside>
      </div>

      {/* Mobile: botón fijo */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-4 pt-3.5 pb-[calc(0.875rem+var(--root-safe-bottom))] bg-linear-to-b from-transparent to-bg to-30% flex flex-col gap-2 lg:hidden">
        {submitError && <p role="alert" className="m-0 text-[13px] text-danger">{submitError}</p>}
        {showErrors && !isValid && <p className="m-0 text-[13px] text-danger">Revisá los campos marcados.</p>}
        <Button size="lg" onClick={() => void submit()} disabled={save.isLoading} className="w-full">{submitLabel}</Button>
      </div>

      <ResponsiveSheet
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="¿Después de qué fiesta?"
        initialHeight={620}
        footer={
          <Button
            size="full"
            variant="secondary"
            onClick={() => {
              setEvent(null);
              setEventTouched(true);
              setIsPickerOpen(false);
            }}
            className="lg:w-auto"
          >
            No sigue a ninguna fiesta
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {choices.upcomingStatus === "loading" && [0, 1, 2].map((i) => <div key={i} className="h-[76px] rounded-card bg-surface-2 animate-pulse" aria-hidden="true" />)}
          {choices.upcomingStatus === "unavailable" && <p className="m-0 text-sm text-ink-2">No pudimos cargar las fiestas.</p>}
          {choices.upcomingStatus === "ready" && choices.upcoming.length === 0 && <p className="m-0 text-sm text-ink-2">No hay fiestas próximas.</p>}
          {choices.upcoming.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setEvent(toPicked(option));
                setEventTouched(true);
                setIsPickerOpen(false);
              }}
              className={cn("rounded-card text-left focus-visible:outline-2 focus-visible:outline-accent", event?.id === option.id && "ring-2 ring-accent")}
            >
              <EventMiniCard event={{ id: option.id, title: option.title, date: option.date, location: option.location, cinematicBannerUrl: option.cinematicBannerUrl }} />
            </button>
          ))}
        </div>
      </ResponsiveSheet>
    </div>
  );
}
