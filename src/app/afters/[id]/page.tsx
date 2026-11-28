"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Flag,
  Lock,
  MapPin,
  Moon,
  PartyPopper,
  Pencil,
  Share,
  ShieldCheck,
  Ticket,
  Trash2,
  UserPlus,
} from "lucide-react";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { AfterCover } from "@/components/afters/AfterCover";
import { AfterTimeBadge, TagAfter } from "@/components/afters/AfterBits";
import { AfterHostPanel, AfterJoinSheet, AfterReportSheet, AfterZoneMap } from "@/components/afters/AfterDetailParts";
import { useAuth } from "@/context/AuthContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useRequireKyc } from "@/hooks/useRequireKyc";
import { useAfterDetail } from "@/hooks/useAfters";
import { FacePile, formatTempCrewEventDate } from "@/components/match/TempCrewCards";
import { accessLabel, attendeesOf, formatAfterDay, formatAfterLongDay, formatAfterTime, isAfterOver, spotsLeft, timeAgo } from "@/lib/afters";
import { apiErrorMessage } from "@/lib/apiErrors";
import { cn, copyTextToClipboard, isValidImageUrl } from "@/lib/utils";
import type { AfterDetail } from "@/types/afters";
import { eventPath } from "@/lib/eventPath";

const roundButton =
  "size-11 rounded-full bg-bg/60 border border-white/15 text-ink flex items-center justify-center backdrop-blur-sm hover:bg-bg transition-colors focus-visible:outline-2 focus-visible:outline-accent";
const softButton =
  "h-11 px-4 rounded-control bg-surface-2 border border-line-strong text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#23272D] transition-colors focus-visible:outline-2 focus-visible:outline-accent";

function mapsUrl(after: AfterDetail) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([after.address, after.zone].filter(Boolean).join(", "))}`;
}

export default function AfterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const requireKyc = useRequireKyc();
  const { after, status, reload, join, leave, remove, report, saveNotice, savingNotice, noticeError } = useAfterDetail(id);
  const goBack = useBackNavigation(after?.event ? eventPath(after.event) : "/events");
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  if (status === "loading" && !after) return <AfterDetailSkeleton />;

  if (status === "not_found" || status === "error" || !after) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-bg p-6 text-center text-ink">
        <SwipeBack onBack={goBack} />
        <span className="size-14 rounded-full bg-surface-2 flex items-center justify-center">
          <Moon className="size-6 text-ink-2" aria-hidden="true" />
        </span>
        <p className="m-0 text-lg font-semibold">{status === "error" ? "No pudimos cargar el after" : "Este after ya no está"}</p>
        <p className="m-0 max-w-xs text-sm text-ink-2">
          {status === "error" ? "Revisá tu conexión y probá de nuevo." : "Los afters se archivan 24 h después de empezar, o quien lo organizó lo sacó."}
        </p>
        <div className="flex gap-2">
          <Link href="/events" className={softButton}>Ver eventos</Link>
          {status === "error" && <Button size="sm" onClick={() => void reload()}>Reintentar</Button>}
        </div>
      </div>
    );
  }

  const isHost = after.viewerStatus === "host";
  const isIn = after.viewerStatus === "accepted" || after.viewerStatus === "going";
  const over = isAfterOver(after);
  const left = spotsLeft(after);
  const isFull = left === 0;
  const hostFirst = after.host.name.split(" ")[0] || after.host.username;
  const count = attendeesOf(after);
  const eventBanner = after.event && isValidImageUrl(after.event.image) ? after.event.image.trim() : null;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: after.name, text: `${after.name} · ${after.zone}`, url });
        return;
      } catch {
        // si se cancela, se copia el link
      }
    }
    if (await copyTextToClipboard(url)) setToast("Enlace copiado");
  };

  const copyAddress = async () => {
    if (after.address && (await copyTextToClipboard(after.address))) setToast("Dirección copiada");
  };

  const needSession = () => {
    if (user) return false;
    router.push("/login");
    return true;
  };

  const goJoin = () => {
    if (needSession()) return;
    if (after.access === "approval") {
      setIsJoinOpen(true);
      return;
    }
    void join.mutate({ id: after.id }).then(() => setToast("Listo, vas a este after")).catch(() => undefined);
  };

  const sendRequest = (message: string) =>
    void join
      .mutate({ id: after.id, message })
      .then(() => {
        setIsJoinOpen(false);
        setToast(`Pedido enviado a ${hostFirst}`);
      })
      .catch(() => undefined);

  const leaveAfter = () => void leave.mutate(after.id).then(() => setToast(after.viewerStatus === "requested" ? "Cancelaste el pedido" : "Ya no vas")).catch(() => undefined);

  const capacityText =
    after.capacity != null ? (
      <>
        <span className="num-mono">{count}</span> de <span className="num-mono">{after.capacity}</span> lugares
      </>
    ) : (
      <>
        <span className="num-mono">{count}</span> van
      </>
    );

  // Botón principal según el acceso y el estado de quien mira.
  const primaryAction = (() => {
    if (isHost) return null;
    if (over) return <span className="text-sm font-semibold text-ink-3">Este after ya terminó</span>;
    if (after.viewerStatus === "requested") {
      return (
        <Button variant="secondary" onClick={leaveAfter} disabled={leave.isLoading} className="h-[50px]">
          <Clock3 className="size-4" aria-hidden="true" /> Cancelar pedido
        </Button>
      );
    }
    if (after.viewerStatus === "rejected") return <span className="text-sm font-semibold text-ink-3">No te aceptaron esta vez</span>;
    if (isIn) {
      return after.access === "ticket" && after.ticketUrl ? (
        <a href={after.ticketUrl} target="_blank" rel="noopener noreferrer" className="h-[50px] px-[22px] rounded-control bg-accent text-on-accent text-[15px] font-semibold inline-flex items-center gap-2 hover:bg-accent-hover transition-colors">
          <Ticket className="size-[18px]" aria-hidden="true" /> Comprar entrada <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      ) : null;
    }
    if (after.access === "ticket") {
      return after.ticketUrl ? (
        <a href={after.ticketUrl} target="_blank" rel="noopener noreferrer" className="h-[50px] px-[22px] rounded-control bg-accent text-on-accent text-[15px] font-semibold inline-flex items-center gap-2 hover:bg-accent-hover transition-colors">
          <Ticket className="size-[18px]" aria-hidden="true" /> Comprar entrada <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      ) : null;
    }
    if (isFull) return <span className="text-sm font-semibold text-ink-3">Sin lugares</span>;
    return (
      <Button onClick={goJoin} disabled={join.isLoading} className="h-[50px] px-[22px]">
        {after.access === "approval" ? <UserPlus className="size-[18px]" aria-hidden="true" /> : <PartyPopper className="size-[18px]" aria-hidden="true" />}
        {after.access === "approval" ? "Pedir entrar" : join.isLoading ? "Un momento…" : "Voy"}
      </Button>
    );
  })();

  const ctaTitle = isHost
    ? "Es tu after"
    : isIn
      ? after.viewerStatus === "accepted" ? "Estás adentro" : "Vas a este after"
      : after.viewerStatus === "requested"
        ? "Pedido enviado"
        : left != null
          ? `${left} ${left === 1 ? "lugar libre" : "lugares libres"}`
          : `${count} van`;
  const ctaHint = isHost
    ? "Mirá las solicitudes y dejá un aviso"
    : after.viewerStatus === "requested"
      ? `${hostFirst} lo tiene que aprobar`
      : after.access === "approval"
        ? `${hostFirst} aprueba cada pedido`
        : after.access === "ticket"
          ? "La entrada se compra afuera de root"
          : "Entrada libre";

  // Marca "Voy" en los de entrada, además del link (así cuenta entre los que van y ve el aviso).
  const ticketGoing = !isHost && !isIn && !over && after.access === "ticket" && !after.viewerStatus;

  const hostRow = (
    <div className="flex items-center gap-3">
      <Avatar src={after.host.avatarUrl || undefined} fallback={after.host.name} username={after.host.username} className="size-11 rounded-full shrink-0" />
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="font-semibold inline-flex items-center gap-1.5 truncate">
          {after.host.name}
          {after.host.isKycVerified && <ShieldCheck className="size-4 shrink-0 text-info" aria-label="Identidad verificada" />}
        </span>
        <span className="text-[13px] text-ink-2 truncate">{after.isOfficial ? "Oficial" : "Organiza"} · @{after.host.username}</span>
      </span>
      <Link href={`/profile/${encodeURIComponent(after.host.username)}`} className={cn(softButton, "h-10")}>Ver perfil</Link>
    </div>
  );

  const eventLink = after.event ? (
    <div className="flex flex-col gap-2">
      <span className="label-mono text-ink-2">Después de</span>
      <Link href={eventPath(after.event)} className="flex items-center gap-3 p-2.5 rounded-[14px] bg-surface-2 border border-line hover:bg-[#23272D] transition-colors">
        <span aria-hidden="true" className="w-11 h-[55px] shrink-0 rounded-lg bg-surface bg-cover bg-center" style={eventBanner ? { backgroundImage: `url(${JSON.stringify(eventBanner)})` } : undefined} />
        <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
          <span className="text-sm font-semibold truncate">{after.event.title}</span>
          <span className="text-xs text-ink-2 truncate">{[formatTempCrewEventDate(after.event.date, true), after.event.location].filter(Boolean).join(" · ")}</span>
        </span>
        <ChevronRight className="size-[18px] text-ink-3 shrink-0" aria-hidden="true" />
      </Link>
    </div>
  ) : null;

  const facts = (
    <dl className="m-0 grid grid-cols-2 gap-px rounded-card overflow-hidden bg-line border border-line lg:grid-cols-4">
      <div className="bg-surface px-4 py-3.5 flex flex-col gap-1.5">
        <dt className="label-mono text-ink-2">Empieza</dt>
        <dd className="m-0 text-base font-semibold">{formatAfterDay(after.startsAt)}</dd>
      </div>
      <div className="bg-surface px-4 py-3.5 flex flex-col gap-1.5">
        <dt className="label-mono text-ink-2">Termina</dt>
        <dd className="m-0 text-base font-semibold">{after.endsAt ? formatAfterTime(after.endsAt) : "A definir"}</dd>
        {after.endsAt && <dd className="m-0 text-[13px] text-ink-2">Aprox.</dd>}
      </div>
      <div className="bg-surface px-4 py-3.5 flex flex-col gap-1.5 min-w-0">
        <dt className="label-mono text-ink-2">Zona</dt>
        <dd className="m-0 text-base font-semibold truncate">{after.zone}</dd>
      </div>
      <div className="bg-surface px-4 py-3.5 flex flex-col gap-1.5">
        <dt className="label-mono text-ink-2">Acceso</dt>
        <dd className="m-0 text-base font-semibold">{accessLabel(after.access, after.price)}</dd>
        <dd className="m-0 text-[13px] text-ink-2">{capacityText}</dd>
      </div>
    </dl>
  );

  // Dirección: solo si el backend la mandó (host, acceso libre o con entrada, o aceptado).
  const location = after.addressVisible && after.address ? (
    <section aria-labelledby="after-address" className="rounded-card bg-surface border border-line overflow-hidden">
      <AfterZoneMap zone={after.zone} pinned />
      <div className="p-3.5 flex flex-col gap-3">
        <span className="flex flex-col gap-[3px]">
          <span id="after-address" className="text-base font-semibold break-words">{after.address}</span>
          <span className="text-[13px] text-ink-2">{after.zone}</span>
        </span>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <a href={mapsUrl(after)} target="_blank" rel="noopener noreferrer" className="h-11 rounded-control bg-accent text-on-accent text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors">
            <MapPin className="size-4" aria-hidden="true" /> Abrir en Maps
          </a>
          <button type="button" onClick={() => void copyAddress()} aria-label="Copiar dirección" className={softButton}>
            <Copy className="size-4" aria-hidden="true" /> Copiar
          </button>
        </div>
      </div>
    </section>
  ) : (
    <section aria-labelledby="after-zone" className="rounded-card bg-surface border border-line overflow-hidden">
      <AfterZoneMap zone={after.zone} />
      <div className="flex gap-3 items-start p-3.5">
        <Lock className="size-[18px] text-accent shrink-0 mt-0.5" aria-hidden="true" />
        <span className="flex flex-col gap-[3px]">
          <span id="after-zone" className="font-semibold">La dirección exacta la ves cuando te aceptan</span>
          <span className="text-[13px] leading-snug text-ink-2">Hasta entonces solo se muestra la zona.</span>
        </span>
      </div>
    </section>
  );

  const notice = after.notice ? (
    <section aria-labelledby="after-notice" className="p-3.5 rounded-card bg-surface border border-line flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <Avatar src={after.host.avatarUrl || undefined} fallback={after.host.name} className="size-8 rounded-full shrink-0" />
        <span id="after-notice" className="text-sm font-semibold">Aviso de {hostFirst}</span>
        {after.noticeUpdatedAt && <span className="ml-auto text-xs text-ink-3">{timeAgo(after.noticeUpdatedAt)}</span>}
      </div>
      <p className="m-0 text-sm leading-normal text-ink/90 whitespace-pre-line break-words">{after.notice}</p>
    </section>
  ) : null;

  const statusBanner = isIn && !isHost ? (
    <div role="status" className="flex gap-3 items-center p-3.5 rounded-card bg-accent/[0.08] border border-accent/30">
      <span className="size-10 shrink-0 rounded-full bg-accent text-on-accent flex items-center justify-center">
        <Check className="size-5" strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold">{after.viewerStatus === "accepted" ? "Estás adentro" : "Vas a este after"}</span>
        <span className="text-[13px] text-ink/80">
          {after.viewerStatus === "accepted" ? `${hostFirst} aceptó tu pedido. Ya ves la dirección.` : "Ya ves la dirección y los avisos de quien organiza."}
        </span>
      </span>
    </div>
  ) : null;

  const hiddenBanner = isHost && after.status && after.status !== "active" ? (
    <p role="status" className="m-0 p-3.5 rounded-card border border-danger/40 bg-danger/10 text-sm text-ink">
      {after.status === "hidden"
        ? "Tu after está oculto mientras el equipo de root revisa unas denuncias."
        : after.status === "archived"
          ? "Este after ya se archivó: solo lo ves vos."
          : "Sacaste este after: ya no lo ve nadie."}
    </p>
  ) : null;

  const who = !isHost ? (
    <section aria-labelledby="after-who" className="p-4 rounded-card bg-surface border border-line flex flex-col gap-3">
      <div className="flex justify-between items-center gap-3">
        <h2 id="after-who" className="label-mono text-ink-2 m-0">Quiénes van</h2>
        {after.followedGoing.preview.length > 0 && <FacePile people={after.followedGoing.preview} />}
      </div>
      <span className="text-base">
        <b className="num-mono">{count}</b> van
        {after.followedGoing.count > 0 && <span className="text-ink-2"> · {after.followedGoing.count} que seguís</span>}
      </span>
    </section>
  ) : null;

  const music = after.genres.length > 0 || after.lineup ? (
    <section aria-labelledby="after-music" className="flex flex-col gap-3">
      <h2 id="after-music" className="font-display text-[22px] m-0">Música</h2>
      {after.genres.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {after.genres.map((genre) => (
            <span key={genre} className="h-8 px-3.5 rounded-full bg-surface border border-line-strong text-[13px] font-semibold inline-flex items-center">{genre}</span>
          ))}
        </div>
      )}
      {after.lineup && <span className="text-sm text-ink/80">Pasan música: <b className="text-ink">{after.lineup}</b></span>}
    </section>
  ) : null;

  const rules = after.rules ? (
    <section aria-labelledby="after-rules" className="flex flex-col gap-3">
      <h2 id="after-rules" className="font-display text-[22px] m-0">Reglas del after</h2>
      <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
        {after.rules.split(/\n+/).map((rule) => rule.trim()).filter(Boolean).map((rule, index) => (
          <li key={index} className="flex gap-2.5 items-start text-sm leading-snug text-ink/80">
            <Check className="size-4 text-accent shrink-0 mt-0.5" aria-hidden="true" /> {rule}
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  const hostActions = isHost ? (
    <div className="flex gap-2 flex-wrap">
      <button type="button" onClick={() => requireKyc(() => router.push(`/afters/${after.id}/edit`))} className={softButton}>
        <Pencil className="size-4" aria-hidden="true" /> Editar
      </button>
      <button type="button" onClick={() => setIsDeleteOpen(true)} className={cn(softButton, "text-danger")}>
        <Trash2 className="size-4" aria-hidden="true" /> Sacar after
      </button>
    </div>
  ) : null;

  const footerLine = (
    <div className="flex justify-between items-center gap-3 pt-3.5 border-t border-line text-[13px] text-ink-3">
      <span>Se archiva el {formatAfterLongDay(after.archivesAt)}.</span>
      {!isHost && (
        <button type="button" onClick={() => (needSession() ? undefined : setIsReportOpen(true))} className="min-h-11 inline-flex items-center gap-1.5 text-ink-2 hover:text-ink lg:hidden">
          <Flag className="size-3.5" aria-hidden="true" /> Denunciar
        </button>
      )}
    </div>
  );

  const actionError = join.error || leave.error;

  return (
    <div className="min-h-[100dvh] bg-bg text-ink pb-[calc(8rem+var(--root-safe-bottom))] lg:pb-16">
      <SwipeBack onBack={goBack} />
      {toast && (
        <div role="status" className="fixed left-4 right-4 bottom-[calc(6.5rem+var(--root-safe-bottom))] z-50 mx-auto max-w-sm h-12 px-4 rounded-2xl bg-ink text-bg text-sm font-semibold flex items-center gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-fade-in lg:bottom-8">
          <Check className="size-[18px]" aria-hidden="true" /> {toast}
        </div>
      )}

      {/* Mobile: portada con volver y compartir encima. */}
      <div className="relative lg:hidden">
        <AfterCover after={after} size="hero" className="h-[300px]" />
        <div className="absolute inset-x-0 top-0 px-4 pt-[calc(1rem+var(--root-safe-top))] flex justify-between">
          <button type="button" aria-label="Volver" onClick={goBack} className={roundButton}>
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Compartir after" onClick={() => void share()} className={roundButton}>
            <Share className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="absolute left-4 bottom-4 flex gap-2 items-end">
          <TagAfter official={after.isOfficial} />
          <AfterTimeBadge startsAt={after.startsAt} size="lg" />
        </div>
      </div>

      {/* Escritorio: barra propia. */}
      <div className="hidden lg:flex items-center justify-between gap-3 pb-6">
        <button type="button" onClick={goBack} className={cn(softButton, "bg-surface border-line")}>
          <ChevronLeft className="size-[18px]" aria-hidden="true" /> {after.event ? "Volver al evento" : "Volver"}
        </button>
        <span className="flex gap-2">
          <button type="button" onClick={() => void share()} className={cn(softButton, "bg-surface border-line")}>
            <Share className="size-[18px]" aria-hidden="true" /> Compartir
          </button>
          {!isHost && (
            <button type="button" aria-label="Denunciar este after" onClick={() => (needSession() ? undefined : setIsReportOpen(true))} className={cn(softButton, "w-11 px-0 bg-surface border-line")}>
              <Flag className="size-[18px]" aria-hidden="true" />
            </button>
          )}
        </span>
      </div>

      <div className="lg:flex lg:gap-10 lg:items-start">
        {/* Escritorio: portada 4:5 y tarjeta de acceso fijas al costado. */}
        <aside className="hidden lg:flex flex-col gap-4 w-[400px] shrink-0 sticky top-28">
          <AfterCover after={after} size="hero" className="aspect-[4/5] rounded-hero border border-line">
            <div className="absolute left-4 bottom-4 flex gap-2 items-end">
              <TagAfter official={after.isOfficial} />
              <AfterTimeBadge startsAt={after.startsAt} size="lg" />
            </div>
          </AfterCover>
          {!isHost && (
            <section aria-label="Cómo entrar" className="p-[18px] rounded-card bg-surface border border-line flex flex-col gap-3.5">
              <div className="flex justify-between items-center">
                <span className="label-mono text-ink-2">Lugares</span>
                <span className="text-xs font-semibold text-ink-2">{accessLabel(after.access, after.price)}</span>
              </div>
              <span className="text-lg font-semibold">{ctaTitle}</span>
              {primaryAction && <div className="flex [&>*]:w-full">{primaryAction}</div>}
              {ticketGoing && (
                <button type="button" onClick={goJoin} disabled={join.isLoading} className={softButton}>Marcar que voy</button>
              )}
              {isIn && <button type="button" onClick={leaveAfter} disabled={leave.isLoading} className="h-11 text-sm font-semibold text-ink-2 hover:text-ink">Ya no voy</button>}
              <span className="text-[13px] leading-snug text-ink-2">{ctaHint}{after.access === "approval" && !isIn ? ". Cuando te acepta, ves la dirección." : "."}</span>
              {Boolean(actionError) && <p role="alert" className="m-0 text-[13px] text-danger">{apiErrorMessage(actionError, "No pudimos hacerlo. Probá de nuevo.")}</p>}
            </section>
          )}
        </aside>

        <main className="px-4 pt-[18px] flex flex-col gap-[18px] min-w-0 flex-1 lg:px-0 lg:pt-0 lg:gap-6">
          <div className="flex flex-col gap-2.5 lg:gap-3.5">
            <div className="flex gap-2 flex-wrap">
              <span className="h-7 px-3 rounded-full bg-surface border border-line-strong text-xs font-semibold inline-flex items-center">+18</span>
              {after.access === "approval" && !over && (left == null || left > 0) && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-accent/12 text-accent text-xs font-semibold">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(212,255,0,0.25)]" /> Admitiendo
                </span>
              )}
              {isHost && <span className="h-7 px-3 rounded-full bg-surface-2 text-xs font-semibold inline-flex items-center">Organizás vos</span>}
            </div>
            <h1 className="font-display text-[34px] m-0 break-words lg:text-[60px]">{after.name}</h1>
          </div>
          {hiddenBanner}
          {statusBanner}
          {hostRow}
          {hostActions}
          {(isIn || isHost) && location}
          {(isIn || isHost) && notice}
          {isHost && (
            <AfterHostPanel after={after} onChanged={() => void reload()} onSaveNotice={saveNotice} savingNotice={savingNotice} noticeError={noticeError} />
          )}
          {facts}
          <div className="flex flex-col gap-[18px] lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
            {eventLink}
            {!(isIn || isHost) && <div className="flex flex-col gap-2"><span className="label-mono text-ink-2 hidden lg:block">Ubicación</span>{location}</div>}
          </div>
          {who}
          {music}
          {rules}
          {isIn && (
            <button type="button" onClick={leaveAfter} disabled={leave.isLoading} className="h-11 text-sm font-semibold text-ink-2 hover:text-ink lg:hidden">
              Ya no voy
            </button>
          )}
          {footerLine}
        </main>
      </div>

      {/* Mobile: botón fijo según el acceso. */}
      {!isHost && (primaryAction || ticketGoing) && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pt-3.5 pb-[calc(0.875rem+var(--root-safe-bottom))] bg-linear-to-b from-transparent to-bg to-30% flex flex-col gap-2 lg:hidden">
          {Boolean(actionError) && <p role="alert" className="m-0 text-[13px] text-danger">{apiErrorMessage(actionError, "No pudimos hacerlo. Probá de nuevo.")}</p>}
          <div className="flex items-center gap-3">
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="font-semibold truncate">{ctaTitle}</span>
              <span className="text-xs text-ink-2 truncate">{ctaHint}</span>
            </span>
            {ticketGoing && (
              <button type="button" onClick={goJoin} disabled={join.isLoading} className={cn(softButton, "h-[50px]")}>Voy</button>
            )}
            {primaryAction}
          </div>
        </div>
      )}

      <AfterJoinSheet after={after} isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} onSend={sendRequest} isSending={join.isLoading} error={join.error} />
      <AfterReportSheet
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        sent={reportSent}
        isSending={report.isLoading}
        error={report.error}
        onSend={(reason) => void report.mutate({ id: after.id, reason }).then(() => setReportSent(true)).catch(() => undefined)}
      />
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="¿Sacar el after?"
        message="Deja de verse en root y quienes iban ya no ven la dirección. No se puede deshacer."
        confirmText="Sacar after"
        variant="danger"
        isLoading={remove.isLoading}
        onConfirm={() =>
          void remove
            .mutate(after.id)
            .then(() => router.push(after.event ? eventPath(after.event) : "/events"))
            .catch(() => undefined)
        }
      />
    </div>
  );
}

function AfterDetailSkeleton() {
  return (
    <div aria-hidden="true" className="min-h-[100dvh] bg-bg lg:flex lg:gap-10">
      <div className="h-[300px] bg-surface animate-pulse lg:w-[400px] lg:aspect-[4/5] lg:h-auto lg:rounded-hero" />
      <div className="px-4 pt-5 flex flex-col gap-4 flex-1 lg:px-0">
        <span className="h-7 w-24 rounded-full bg-surface-2 animate-pulse" />
        <span className="h-10 w-3/4 rounded-md bg-surface-2 animate-pulse" />
        <span className="h-11 w-full rounded-control bg-surface animate-pulse" />
        <span className="h-32 w-full rounded-card bg-surface animate-pulse" />
        <span className="h-40 w-full rounded-card bg-surface animate-pulse" />
      </div>
    </div>
  );
}
