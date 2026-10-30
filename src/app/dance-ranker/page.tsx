"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Flame, Loader2, MapPin, Plus, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDanceContext } from "@/context/DanceContext";
import { useDanceStats } from "@/hooks/useDanceStats";
import { EventLiveRankingCard } from "@/components/events/EventLiveRankingModal";
import { BadgeCrown } from "@/components/profile/BadgeMedal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { DanceSession } from "@/services/dance";

const timeZone = "America/Montevideo";
const DAY = 86_400_000;
// Estimación de kcal: MET 6,5 (baile electrónico intenso) × 70 kg.
const MET = 6.5;
const WEIGHT_KG = 70;
const STEP_METERS = 0.75;
const STEPS_PER_MINUTE = 120;

const fmt = (n: number) => n.toLocaleString("es-UY");
const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")}K` : String(n));
const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
const monthKey = (date: Date) => dayKey(date).slice(0, 7);
const partyName = (title: string) => title.replace("Noche de ", "").replace(" en ", " ");
const clean = (value: string) => value.replace(/\./g, "");

type Period = "fiestas" | "week" | "month";
interface Point { label: string; steps: number }

function buildChart(period: Period, parties: DanceSession[], now: number): { points: Point[]; caption: string } {
  if (period === "fiestas") {
    const recent = parties.slice(0, 6).reverse();
    return {
      points: recent.map((party) => ({ label: partyName(party.eventTitle), steps: party.stepsCount })),
      caption: `pasos en tus últimas ${recent.length} fiestas`,
    };
  }
  if (period === "week") {
    // Semana de lunes a domingo, en hora de Montevideo.
    const today = new Date(now);
    const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(
      new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(today),
    );
    const days = Array.from({ length: 7 }, (_, i) => new Date(now + (i - weekday) * DAY));
    const totals = new Map(days.map((d) => [dayKey(d), 0]));
    for (const party of parties) {
      const key = dayKey(new Date(party.startTime));
      if (totals.has(key)) totals.set(key, totals.get(key)! + party.stepsCount);
    }
    const label = (d: Date) => clean(new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone }).format(d));
    return {
      points: days.map((d) => ({
        label: clean(new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone }).format(d)).replace(/^\w/, (c) => c.toUpperCase()),
        steps: totals.get(dayKey(d)) ?? 0,
      })),
      caption: `pasos esta semana (${label(days[0])} – ${label(days[6])})`,
    };
  }
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });
  const totals = new Map(months.map((d) => [monthKey(d), 0]));
  for (const party of parties) {
    const key = monthKey(new Date(party.startTime));
    if (totals.has(key)) totals.set(key, totals.get(key)! + party.stepsCount);
  }
  return {
    points: months.map((d) => ({
      label: clean(new Intl.DateTimeFormat("es-AR", { month: "short", timeZone }).format(d)).replace(/^\w/, (c) => c.toUpperCase()),
      steps: totals.get(monthKey(d)) ?? 0,
    })),
    caption: "pasos por mes · últimos 6 meses",
  };
}

export default function DanceRankerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { liveEvent, isAtVenue, attendanceConfirmed } = useDanceContext();
  const isAtLiveEvent = Boolean(liveEvent && (isAtVenue || attendanceConfirmed));
  const { parties, crews, isLoading, error, retry, rankings, isLoadingRankings, loadCrewRankings } = useDanceStats();
  const [period, setPeriod] = useState<Period>("fiestas");
  const [crewsOpen, setCrewsOpen] = useState(true);
  const [now] = useState(() => Date.now());

  const last = parties[0];
  useEffect(() => {
    if (crewsOpen && last && crews.length) loadCrewRankings(crews, last.eventId);
  }, [crewsOpen, last, crews, loadCrewRankings]);

  const totalSteps = parties.reduce((acc, party) => acc + party.stepsCount, 0);
  const activeMinutes = Math.round(totalSteps / STEPS_PER_MINUTE);
  const kcal = Math.round(MET * WEIGHT_KG * (activeMinutes / 60));
  const km = (totalSteps * STEP_METERS) / 1000;

  const lastDate = last ? new Date(last.startTime) : null;
  // "dom 26/10"
  const headerDate = lastDate
    ? `${clean(new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone }).format(lastDate))} ${new Intl.DateTimeFormat("es-AR", { day: "numeric", timeZone }).format(lastDate)}/${new Intl.DateTimeFormat("es-AR", { month: "numeric", timeZone }).format(lastDate)}`
    : "";
  const wasLastNight = lastDate ? now - lastDate.getTime() < 1.5 * DAY : false;
  const bestOfMonth = last
    ? last.stepsCount > 0 && parties
        .filter((party) => monthKey(new Date(party.startTime)) === monthKey(new Date(last.startTime)))
        .every((party) => party.stepsCount <= last.stepsCount)
    : false;

  const { points, caption } = buildChart(period, parties, now);
  const chartTotal = points.reduce((acc, point) => acc + point.steps, 0);
  const chartMax = Math.max(...points.map((point) => point.steps), 0);
  const best = points.find((point) => point.steps === chartMax);

  const card = "rounded-[18px] bg-surface border border-line";

  return (
    <div className="num-display min-h-[100dvh] bg-bg text-ink pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16">
      <div className="w-full max-w-2xl mx-auto pt-[calc(0.75rem+var(--root-safe-top))] md:pt-6">
        <header className="px-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver al perfil"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <h1 className="font-display not-italic m-0 flex-1 text-2xl">Dance stats</h1>
          {headerDate && <span className="text-[13px] text-ink-2">{headerDate}</span>}
        </header>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-accent" aria-label="Cargando tus estadísticas" />
          </div>
        ) : error ? (
          <div role="alert" className={cn(card, "mx-4 mt-8 p-6 text-center")}>
            <p className="m-0 text-base">No pudimos cargar tus estadísticas.</p>
            <Button variant="secondary" className="mt-4 not-italic tracking-normal" onClick={retry}>Reintentar</Button>
          </div>
        ) : (
          <>
            {isAtLiveEvent && liveEvent && (
              <div className="px-4 pt-5 not-italic font-normal tracking-normal">
                <EventLiveRankingCard eventId={liveEvent.id} eventTitle={liveEvent.title} eventLocation={liveEvent.location} />
              </div>
            )}

            {last ? (
              <section aria-labelledby="dance-hero" className="px-5 pt-7 flex flex-col">
                <h2 id="dance-hero" className="m-0 flex flex-col font-[inherit]">
                  <span className="text-[15px] text-ink-2">{wasLastNight ? "anoche tiraste" : "en tu última fiesta tiraste"}</span>
                  <span className="text-[clamp(72px,28vw,112px)] leading-[0.95] tracking-[-0.07em] text-accent">{fmt(last.stepsCount)}</span>
                  <span className="mt-1.5 text-[22px] leading-tight">pasos en {last.eventTitle}.</span>
                </h2>
                {bestOfMonth && (
                  <span className="mt-4 self-start min-h-10 px-3.5 rounded-xl bg-accent/10 border border-accent/35 text-accent text-sm flex items-center gap-2">
                    <BadgeCrown className="w-4" />
                    Tu noche más bailada del mes
                  </span>
                )}
              </section>
            ) : (
              <p className={cn(card, "mx-4 mt-7 p-6 text-center text-base")}>
                Todavía no registraste pasos. Activá el contador en tu próxima fiesta.
              </p>
            )}

            <section aria-label="Totales" className="mx-4 mt-7 grid grid-cols-2 gap-px rounded-card overflow-hidden bg-line border border-line">
              <div className="col-span-2 bg-surface p-4 flex items-baseline justify-between gap-2">
                <span className="label-mono text-ink-2 not-italic whitespace-nowrap">Total histórico</span>
                <span className="flex flex-wrap items-baseline justify-end gap-x-1.5">
                  <span className="text-[26px]">{fmt(totalSteps)}</span>
                  <span className="text-sm text-ink-2 whitespace-nowrap">pasos · {parties.length} {parties.length === 1 ? "fiesta" : "fiestas"}</span>
                </span>
              </div>
              <div className="bg-surface px-4 py-3.5 flex items-center gap-2.5">
                <Flame className="size-[18px] text-accent shrink-0" aria-hidden="true" />
                <span className="flex flex-col"><span className="text-lg">{fmt(kcal)}</span><span className="text-[13px] text-ink-2">kcal</span></span>
              </div>
              <div className="bg-surface px-4 py-3.5 flex items-center gap-2.5">
                <MapPin className="size-[18px] text-accent shrink-0" aria-hidden="true" />
                <span className="flex flex-col"><span className="text-lg">{km.toLocaleString("es-UY", { maximumFractionDigits: 1 })}</span><span className="text-[13px] text-ink-2">km</span></span>
              </div>
              <div className="col-span-2 bg-surface px-4 py-3.5 flex items-center gap-2.5">
                <Activity className="size-[18px] text-accent shrink-0" aria-hidden="true" />
                <span className="flex items-baseline gap-1.5"><span className="text-lg">{fmt(activeMinutes)}</span><span className="text-[13px] text-ink-2">min activos</span></span>
              </div>
            </section>
            <p className="mx-4 mt-2.5 mb-0 text-xs leading-normal text-ink-3">Las kcal se estiman con MET 6,5 (baile electrónico intenso) × 70 kg.</p>

            <section aria-labelledby="dance-activity" className={cn(card, "mx-4 mt-6 p-4 flex flex-col gap-[18px]")}>
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3">
                <h2 id="dance-activity" className="font-display not-italic m-0 text-xl">Actividad</h2>
                <div role="radiogroup" aria-label="Período" className="flex p-[3px] rounded-xl bg-bg border border-line">
                  {([["fiestas", "Fiestas"], ["week", "Semana"], ["month", "Mes"]] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={period === id}
                      onClick={() => setPeriod(id)}
                      className={cn(
                        "h-[38px] px-3 rounded-[9px] text-[13px] not-italic font-semibold tracking-normal transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                        period === id ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[22px]">{fmt(chartTotal)}</span>
                <span className="text-[13px] text-ink-2">{caption}</span>
              </div>
              {chartTotal > 0 ? (
                <>
                  <div
                    role="img"
                    aria-label={`Gráfico de barras, ${caption}. ${points.map((point) => `${point.label} ${fmt(point.steps)}`).join(", ")}`}
                    className="h-[190px] flex items-end gap-2 border-b border-white/10"
                  >
                    {points.map((point, index) => {
                      const top = point.steps === chartMax && point.steps > 0;
                      return (
                        <div key={`${point.label}-${index}`} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1.5">
                          <span className={cn("text-xs", top ? "text-accent" : "text-ink-2")}>{point.steps ? short(point.steps) : "–"}</span>
                          <div
                            className={cn(
                              "w-full max-w-10 rounded-t-lg rounded-b-sm",
                              top ? "bg-accent" : point.steps ? "bg-[#4A505A]" : "bg-[#262A30]",
                            )}
                            style={{ height: chartMax ? Math.max(point.steps ? 6 : 2, Math.round((point.steps / chartMax) * 150)) : 2 }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div aria-hidden="true" className="-mt-2.5 flex gap-2">
                    {points.map((point, index) => (
                      <span
                        key={`${point.label}-label-${index}`}
                        className={cn("flex-1 min-w-0 text-center text-[11px] truncate", point.steps === chartMax && point.steps > 0 ? "text-ink" : "text-ink-3")}
                      >
                        {point.label}
                      </span>
                    ))}
                  </div>
                  {best && (
                    <span className="flex items-center gap-2 text-[13px] text-ink-2">
                      <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-accent" />
                      Máximo: {best.label} · {fmt(best.steps)} pasos
                    </span>
                  )}
                </>
              ) : (
                <div className="h-[190px] p-4 rounded-control border border-dashed border-line-strong flex flex-col items-center justify-center gap-1.5 text-center">
                  <span className="text-[15px]">Sin registros</span>
                  <span className="text-[13px] text-ink-2">No hay fiestas registradas en este período.</span>
                </div>
              )}
            </section>

            {last && (
              <section className={cn(card, "mx-4 mt-3 overflow-hidden")}>
                <button
                  type="button"
                  aria-expanded={crewsOpen}
                  aria-controls="dance-crews"
                  onClick={() => setCrewsOpen((open) => !open)}
                  className="w-full min-h-16 px-4 py-3 flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="size-10 shrink-0 rounded-xl bg-accent/12 text-accent flex items-center justify-center">
                    <Users className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-base truncate">Tus crews en {last.eventTitle}</span>
                    <span className="text-[13px] text-ink-2">
                      {crews.length} {crews.length === 1 ? "crew" : "crews"} · tocá para {crewsOpen ? "cerrar" : "ver"}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-[22px] text-ink-2 transition-transform", crewsOpen && "rotate-180")} aria-hidden="true" />
                </button>

                {crewsOpen && (
                  <div id="dance-crews" className="px-3 pb-3 flex flex-col gap-3">
                    {crews.map((crew) => {
                      const entries = [...(rankings[crew.id] ?? [])].sort((a, b) => b.steps - a.steps);
                      const crewTotal = entries.reduce((acc, entry) => acc + entry.steps, 0);
                      const top = entries[0]?.steps || 1;
                      const myIndex = entries.findIndex((entry) => entry.userId === user?.id);
                      const winner = entries[0];
                      return (
                        <article key={crew.id} className="px-4 py-[18px] rounded-control bg-bg border border-line flex flex-col gap-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="label-mono text-ink-2 not-italic">
                              {crew.name}{myIndex >= 0 ? ` · ${myIndex + 1}° de ${entries.length}` : ""}
                            </span>
                            {entries.length > 0 && crewTotal > 0 ? (
                              <h3 className="m-0 text-[22px] leading-tight font-[inherit]">
                                Tu crew tiró <span className="text-accent">{fmt(crewTotal)}</span> pasos en {last.eventTitle}.
                              </h3>
                            ) : (
                              <p className="m-0 text-[15px] text-ink-2">
                                {isLoadingRankings && !rankings[crew.id] ? "Cargando ranking…" : `Nadie de la crew registró pasos en ${last.eventTitle}.`}
                              </p>
                            )}
                          </div>
                          {crewTotal > 0 && (
                            <>
                              <div className="flex flex-col gap-3">
                                {entries.map((entry, index) => {
                                  const isMe = entry.userId === user?.id;
                                  return (
                                    <div key={entry.userId}>
                                      <div className={cn("flex justify-between gap-3 text-sm", isMe ? "text-accent" : "text-ink")}>
                                        <span className="truncate">{entry.username || entry.name}{isMe ? " (vos)" : ""}</span>
                                        <span className="shrink-0">{fmt(entry.steps)}</span>
                                      </div>
                                      <div className="mt-1.5 h-2.5 rounded-md bg-[#1B1F2A]">
                                        <div
                                          className={cn("h-2.5 rounded-md", isMe ? "bg-accent" : index === 0 ? "bg-ink" : "bg-[#5B6270]")}
                                          style={{ width: `${Math.round((entry.steps / top) * 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {winner && (
                                <p className="m-0 text-[15px] leading-snug">
                                  {winner.userId === user?.id
                                    ? "Esta vez ganaste vos. La próxima, a defender el título."
                                    : `Esta vez ganó ${winner.username || winner.name}. La próxima, revancha en la pista.`}
                                </p>
                              )}
                            </>
                          )}
                          <Link href={`/crews/${crew.id}`} className="self-start min-h-11 flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover">
                            Ver ranking de la crew <ChevronRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
                          </Link>
                        </article>
                      );
                    })}
                    <Link
                      href="/match"
                      className="min-h-[52px] rounded-control border border-dashed border-accent/40 flex items-center justify-center gap-2 text-[15px] hover:bg-surface-2 transition-colors"
                    >
                      <Plus className="size-[18px] text-accent" strokeWidth={2.2} aria-hidden="true" />
                      {crews.length ? "Unirte a otra crew" : "Unirte a una crew"}
                    </Link>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
