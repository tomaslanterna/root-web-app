"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock3, ImagePlus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { EventSubmissionCard } from "@/components/events/EventSubmissionCard";
import { formatTempCrewEventDate } from "@/components/match/TempCrewCards";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useMySubmissions, useSimilarEvents, useSubmitEvent } from "@/hooks/useEventSubmissions";
import { apiErrorMessage } from "@/lib/apiErrors";
import { cn, isValidImageUrl } from "@/lib/utils";
import { EVENT_SUBMISSION_GENRES, SUBMITTER_ROLE_LABELS, type EventSubmitterRole } from "@/types/eventSubmissions";
import { eventPath } from "@/lib/eventPath";

const fieldClass =
  "w-full rounded-control border border-line-strong bg-bg px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent";
const chipClass = (on: boolean) =>
  cn(
    "h-9 px-3.5 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-accent",
    on ? "bg-accent text-on-accent border-accent" : "bg-surface border-line-strong text-ink hover:bg-surface-2",
  );
const ROLES = Object.keys(SUBMITTER_ROLE_LABELS) as EventSubmitterRole[];

/** "Mandanos tu evento": pasa por revisión antes de publicarse. Mobile pantalla completa; escritorio con columna lateral. */
export function EventSubmissionForm() {
  const ids = useId();
  const router = useRouter();
  const goBack = useBackNavigation("/events");
  const submit = useSubmitEvent();
  const { submissions, status: submissionsStatus } = useMySubmissions();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [flyer, setFlyer] = useState<File | null>(null);
  const [flyerError, setFlyerError] = useState<string | null>(null);
  const [ticketUrl, setTicketUrl] = useState("");
  const [lineup, setLineup] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [role, setRole] = useState<EventSubmitterRole>("organizer");
  const [contact, setContact] = useState("");
  const [rights, setRights] = useState(false);
  const [dismissedSimilar, setDismissedSimilar] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const similar = useSimilarEvents(name, date || undefined);
  const showSimilar = similar.length > 0 && dismissedSimilar !== name.trim().toLowerCase();

  const flyerPreview = useMemo(() => (flyer ? URL.createObjectURL(flyer) : null), [flyer]);
  useEffect(() => () => {
    if (flyerPreview) URL.revokeObjectURL(flyerPreview);
  }, [flyerPreview]);

  const problems = useMemo(() => {
    const list: Record<string, string> = {};
    if (!name.trim()) list.name = "Falta el nombre.";
    if (!date || !time) list.when = "Falta la fecha y la hora.";
    if (!venueName.trim()) list.venueName = "Falta el lugar.";
    if (!venueAddress.trim()) list.venueAddress = "Falta la dirección del lugar.";
    if (!flyer) list.flyer = "Sin flyer no lo podemos publicar.";
    if (ticketUrl.trim() && !/^https?:\/\/\S+\.\S+/i.test(ticketUrl.trim())) list.ticketUrl = "Pegá el link completo (https://…).";
    if (genres.length === 0) list.genres = "Elegí al menos un género.";
    if (!contact.trim()) list.contact = "Dejanos cómo contactarte.";
    if (!rights) list.rights = "Confirmá que tenés permiso para compartirlo.";
    return list;
  }, [name, date, time, venueName, venueAddress, flyer, ticketUrl, genres, contact, rights]);
  const isValid = Object.keys(problems).length === 0;
  const errorOf = (key: string) => (showErrors && problems[key] ? <span role="alert" className="text-xs text-danger">{problems[key]}</span> : null);

  const pickFlyer = (file: File | undefined) => {
    setFlyerError(null);
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setFlyerError("Usá una imagen JPG, PNG o WebP.");
      return;
    }
    setFlyer(file);
  };

  const send = async () => {
    if (submit.isLoading) return;
    if (!isValid || !flyer) {
      setShowErrors(true);
      return;
    }
    try {
      await submit.mutate({
        flyer,
        input: {
          name: name.trim(),
          // Hora de Montevideo con el offset explícito.
          startsAt: `${date}T${time}:00-03:00`,
          venueName: venueName.trim(),
          venueAddress: venueAddress.trim(),
          ticketUrl: ticketUrl.trim() || undefined,
          lineup: lineup.trim() || undefined,
          genres,
          submitterRole: role,
          contact: contact.trim(),
          rightsConfirmed: true,
        },
      });
      router.push("/events/submissions?sent=1");
    } catch {
      // el error se muestra abajo (y kyc_required abre la hoja de verificación)
    }
  };

  const submitLabel = submit.isLoading ? "Enviando…" : "Enviar evento";
  const submitError = submit.error ? apiErrorMessage(submit.error, "No pudimos mandar el evento. Probá de nuevo.") : null;

  const note = (
    <div className="flex gap-3 items-start px-3.5 py-3 rounded-control bg-accent/[0.06] border border-accent/20">
      <Clock3 className="size-[17px] text-accent shrink-0 mt-0.5" aria-hidden="true" />
      <span className="text-[13px] leading-normal text-ink/80">
        <b className="text-ink">Lo revisamos en 24 a 48 h.</b> Si está todo bien lo publicamos y te avisamos. Lo seguís en{" "}
        <Link href="/events/submissions" className="text-accent font-semibold">Mis envíos</Link>.
      </span>
    </div>
  );

  const form = (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-name`} className="text-sm font-semibold">Nombre del evento</label>
        <input id={`${ids}-name`} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="Ej: Warehouse Sessions #4" className={`${fieldClass} h-12`} />
        {showSimilar && (
          <div className="flex flex-col gap-2.5 p-3 rounded-control bg-surface border border-line-strong" aria-live="polite">
            <span className="label-mono text-ink-2">¿Es este? Ya está en root</span>
            {similar.map((event) => (
              <Link key={event.id} href={eventPath(event)} className="flex items-center gap-3 p-2.5 rounded-[14px] bg-bg border border-line hover:bg-surface-2 transition-colors">
                <span
                  aria-hidden="true"
                  className="w-11 h-[55px] shrink-0 rounded-lg bg-surface-2 bg-cover bg-center"
                  style={isValidImageUrl(event.cinematicBannerUrl) ? { backgroundImage: `url(${JSON.stringify(event.cinematicBannerUrl.trim())})` } : undefined}
                />
                <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                  <span className="text-sm font-semibold truncate">{event.title}</span>
                  <span className="text-xs text-ink-2 truncate">{[formatTempCrewEventDate(event.date, true), event.location].filter(Boolean).join(" · ")}</span>
                </span>
                <ChevronRight className="size-[18px] text-ink-3 shrink-0" aria-hidden="true" />
              </Link>
            ))}
            <button type="button" onClick={() => setDismissedSimilar(name.trim().toLowerCase())} className="h-10 px-3 self-start rounded-control border border-line-strong text-sm font-semibold text-ink/80">
              No, es otro
            </button>
          </div>
        )}
        {errorOf("name")}
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-2 min-w-0">
          <label htmlFor={`${ids}-date`} className="text-sm font-semibold">Fecha</label>
          <input id={`${ids}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${fieldClass} h-12 [color-scheme:dark]`} />
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <label htmlFor={`${ids}-time`} className="text-sm font-semibold">Hora</label>
          <input id={`${ids}-time`} type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${fieldClass} h-12 [color-scheme:dark]`} />
        </div>
        {showErrors && problems.when && <span className="col-span-2 -mt-1.5">{errorOf("when")}</span>}
      </div>

      <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-2 lg:gap-3.5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-venue`} className="text-sm font-semibold">Lugar</label>
          <input id={`${ids}-venue`} value={venueName} maxLength={120} onChange={(e) => setVenueName(e.target.value)} placeholder="Nombre del lugar" className={`${fieldClass} h-12`} />
          {errorOf("venueName")}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${ids}-address`} className="text-sm font-semibold">Dirección</label>
          <input id={`${ids}-address`} value={venueAddress} maxLength={200} onChange={(e) => setVenueAddress(e.target.value)} placeholder="Calle y número" className={`${fieldClass} h-12`} />
          {errorOf("venueAddress")}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => pickFlyer(e.target.files?.[0])} />
        {flyerPreview ? (
          <div className="flex items-center gap-3 p-2.5 rounded-card border border-line bg-surface">
            <span aria-hidden="true" className="w-[72px] h-[90px] shrink-0 rounded-lg bg-surface-2 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(flyerPreview)})` }} />
            <span className="flex-1 min-w-0 text-sm font-semibold truncate">{flyer?.name}</span>
            <button type="button" onClick={() => fileRef.current?.click()} className="h-10 px-3 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold">Cambiar</button>
            <button type="button" aria-label="Quitar flyer" onClick={() => setFlyer(null)} className="size-10 rounded-control bg-surface-2 border border-line-strong flex items-center justify-center">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} className="h-[120px] rounded-card border border-dashed border-white/20 bg-surface/50 text-ink flex flex-col items-center justify-center gap-2.5 text-sm font-semibold hover:bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-accent">
            <span className="size-11 rounded-full bg-surface-2 flex items-center justify-center"><ImagePlus className="size-5" aria-hidden="true" /></span>
            Subí el flyer
          </button>
        )}
        <span className="text-xs text-ink-3">Vertical, 4:5 si podés. Sin flyer no lo podemos publicar.</span>
        {flyerError && <span role="alert" className="text-xs text-danger">{flyerError}</span>}
        {errorOf("flyer")}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-link`} className="text-sm font-semibold">Link de entradas</label>
        <input id={`${ids}-link`} type="url" inputMode="url" value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} placeholder="Passline, RedTickets, Instagram…" className={`${fieldClass} h-12`} />
        {errorOf("ticketUrl")}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-lineup`} className="text-sm font-semibold">Line-up</label>
        <input id={`${ids}-lineup`} value={lineup} maxLength={200} onChange={(e) => setLineup(e.target.value)} placeholder="Ej: Bruno Silva, Nico Varela" className={`${fieldClass} h-12`} />
      </div>

      <div className="flex flex-col gap-2">
        <span id={`${ids}-genres`} className="text-sm font-semibold">Géneros</span>
        <div role="group" aria-labelledby={`${ids}-genres`} className="flex gap-2 flex-wrap">
          {EVENT_SUBMISSION_GENRES.map((genre) => {
            const on = genres.includes(genre);
            return (
              <button key={genre} type="button" aria-pressed={on} onClick={() => setGenres((g) => (on ? g.filter((x) => x !== genre) : [...g, genre]))} className={chipClass(on)}>
                {genre}
              </button>
            );
          })}
        </div>
        {errorOf("genres")}
      </div>

      <div className="flex flex-col gap-2">
        <span id={`${ids}-role`} className="text-sm font-semibold">¿Quién sos?</span>
        <div role="group" aria-labelledby={`${ids}-role`} className="flex gap-2 flex-wrap">
          {ROLES.map((value) => (
            <button key={value} type="button" aria-pressed={role === value} onClick={() => setRole(value)} className={chipClass(role === value)}>
              {SUBMITTER_ROLE_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${ids}-contact`} className="text-sm font-semibold">¿Cómo te contactamos?</label>
        <input id={`${ids}-contact`} value={contact} maxLength={120} onChange={(e) => setContact(e.target.value)} aria-describedby={`${ids}-contact-h`} placeholder="Mail, WhatsApp o Instagram" className={`${fieldClass} h-12`} />
        <span id={`${ids}-contact-h`} className="text-xs text-ink-3">Solo para preguntarte algo si hace falta.</span>
        {errorOf("contact")}
      </div>

      <label htmlFor={`${ids}-rights`} className="flex gap-3 items-start text-[13px] leading-normal text-ink/80 cursor-pointer">
        <input id={`${ids}-rights`} type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="size-5 m-0 shrink-0 accent-[var(--color-accent)]" />
        Tengo permiso para compartir el flyer y los datos del evento.
      </label>
      {errorOf("rights")}
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-bg text-ink pb-[calc(7.5rem+var(--root-safe-bottom))] lg:pb-16">
      <SwipeBack onBack={goBack} />
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-2.5 flex items-center justify-center lg:hidden">
        <button type="button" aria-label="Cerrar" onClick={goBack} className="absolute left-4 bottom-1.5 size-11 rounded-full bg-surface-2 border border-line-strong flex items-center justify-center">
          <X className="size-5" aria-hidden="true" />
        </button>
        <h1 className="font-display text-[18px] m-0 px-12 truncate">Mandanos tu evento</h1>
      </header>
      <div className="hidden lg:flex justify-between items-center gap-3 flex-wrap pt-2 pb-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[40px] m-0">Mandanos tu evento</h1>
          <span className="text-ink-2">¿Organizás una fiesta o sos RRPP? Sumala a root.</span>
        </div>
        <Button onClick={() => void send()} disabled={submit.isLoading}>
          <Send className="size-4" aria-hidden="true" /> {submitLabel}
        </Button>
      </div>

      <div className="px-4 pt-3.5 flex flex-col gap-5 lg:px-0 lg:pt-0 lg:flex-row lg:gap-10 lg:items-start">
        <div className="flex flex-col gap-5 lg:flex-1 lg:max-w-[760px] lg:p-6 lg:rounded-card lg:bg-surface lg:border lg:border-line">
          {note}
          {form}
          {submitError && <p role="alert" className="hidden lg:block m-0 text-[13px] text-danger">{submitError}</p>}
        </div>
        <aside className="hidden lg:flex flex-col gap-6 w-[360px] shrink-0">
          <section aria-labelledby={`${ids}-how`} className="p-[18px] rounded-card bg-surface border border-line flex flex-col gap-3.5">
            <h2 id={`${ids}-how`} className="label-mono text-ink-2 m-0">Cómo funciona</h2>
            <ol className="m-0 p-0 list-none flex flex-col gap-3.5">
              {[
                ["Nos mandás el evento", "Con flyer, fecha y link de entradas."],
                ["Lo revisamos", "En 24 a 48 h. Si falta algo, te escribimos."],
                ["Sale en root", "Aparece en Eventos y te avisamos."],
              ].map(([titleText, hint], index) => (
                <li key={titleText} className="flex gap-3 items-start">
                  <span className="size-7 shrink-0 rounded-full bg-accent text-on-accent num-mono text-sm font-semibold flex items-center justify-center">{index + 1}</span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{titleText}</span>
                    <span className="text-[13px] text-ink-2">{hint}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby={`${ids}-mine`} className="flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <h2 id={`${ids}-mine`} className="font-display text-[22px] m-0">Mis envíos</h2>
              {submissionsStatus === "ready" && <span className="num-mono text-sm text-ink-2">{submissions.length}</span>}
            </div>
            {submissionsStatus === "ready" && submissions.length === 0 && <p className="m-0 text-sm text-ink-2">Todavía no mandaste ningún evento.</p>}
            {submissions.length > 0 && (
              <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                {submissions.slice(0, 4).map((submission) => <EventSubmissionCard key={submission.id} submission={submission} />)}
              </ul>
            )}
            {submissions.length > 4 && <Link href="/events/submissions" className="text-sm font-semibold text-accent">Ver todos</Link>}
          </section>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 px-4 pt-3.5 pb-[calc(0.875rem+var(--root-safe-bottom))] bg-linear-to-b from-transparent to-bg to-30% flex flex-col gap-2 lg:hidden">
        {submitError && <p role="alert" className="m-0 text-[13px] text-danger">{submitError}</p>}
        {showErrors && !isValid && <p className="m-0 text-[13px] text-danger">Revisá los campos marcados.</p>}
        <Button size="lg" onClick={() => void send()} disabled={submit.isLoading} className="w-full">
          <Send className="size-4" aria-hidden="true" /> {submitLabel}
        </Button>
      </div>
    </div>
  );
}
