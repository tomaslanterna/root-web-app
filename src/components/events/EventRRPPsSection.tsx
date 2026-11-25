"use client";

import Link from "next/link";
import { Loader2, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useDirectChat } from "@/hooks/useDirectChat";
import type { EventRRPP } from "@/types/events";

interface EventRRPPsSectionProps {
  rrpps: EventRRPP[];
}

/** RRPPs oficiales del evento: una fila por RRPP con acceso a su perfil y un atajo para escribirle. */
export function EventRRPPsSection({ rrpps }: EventRRPPsSectionProps) {
  const { startChat, isAuthLoading, currentUserId, pendingUserId, failedUserId } = useDirectChat();

  if (rrpps.length === 0) return null;

  return (
    <section aria-labelledby="event-rrpps-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 id="event-rrpps-title" className="m-0 text-[17px] font-semibold">RRPPs oficiales</h3>
        <p className="m-0 text-[13px] text-ink-3">¿Dudas con entradas, listas o cómo llegar? Escribiles.</p>
      </div>
      <ul className="m-0 p-0 list-none flex flex-col gap-2">
        {rrpps.map((rrpp) => {
          const displayName = rrpp.name || rrpp.username;
          // No puede escribirse a sí mismo; mientras se resuelve la sesión todavía no se sabe quién es.
          const canWrite = !isAuthLoading && rrpp.userId !== currentUserId;
          const isPending = pendingUserId === rrpp.userId;
          const hasFailed = failedUserId === rrpp.userId;
          return (
            <li key={rrpp.userId} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${encodeURIComponent(rrpp.username)}`}
                  aria-label={`${displayName}, RRPP`}
                  className="min-w-0 flex-1 min-h-11 flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <Avatar
                    src={rrpp.avatarUrl ?? undefined}
                    fallback={displayName}
                    className="size-12 shrink-0 rounded-full border border-line bg-surface-2 text-ink-2 text-base font-bold"
                  />
                  <span className="min-w-0 flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold text-ink truncate">{displayName}</span>
                    <span className="label-mono text-ink-3">RRPP oficial</span>
                  </span>
                </Link>
                {canWrite && (
                  // Mismo botón de mensajes que el header de /events.
                  <button
                    type="button"
                    onClick={() => void startChat(rrpp.userId)}
                    disabled={isPending}
                    aria-busy={isPending}
                    aria-label={`Escribile a ${displayName}`}
                    className="shrink-0 size-11 flex items-center justify-center rounded-control bg-surface border border-line text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent transition-colors disabled:opacity-60"
                  >
                    {isPending ? (
                      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <MessageSquare className="size-5" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
              {hasFailed && (
                <p role="alert" className="m-0 text-[13px] text-danger">
                  No pudimos abrir el chat. Probá de nuevo.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
