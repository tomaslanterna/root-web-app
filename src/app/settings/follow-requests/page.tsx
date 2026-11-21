"use client";

import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFollowRequests } from "@/hooks/useFollowRequests";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { Avatar } from "@/components/ui/Avatar";
import { LoginRequired } from "@/components/ui/LoginRequired";

/** /settings/follow-requests: quienes pidieron seguir tu perfil privado. */
export default function FollowRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const goBack = useBackNavigation("/settings");
  const { requests, isLoading, error, pending, retry, accept, reject } = useFollowRequests();

  if (!authLoading && !user) return <LoginRequired />;

  return (
    <main className="min-h-[100dvh] bg-bg text-ink flex flex-col pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16">
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 flex items-center gap-3">
          <SwipeBack onBack={goBack} />
          <button
            type="button"
            onClick={goBack}
            aria-label="Volver"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <h1 className="font-display header-title-fit m-0 flex-1 min-w-0">Solicitudes</h1>
        </div>
      </header>

      <section className="w-full max-w-2xl mx-auto px-4 pt-3" aria-busy={isLoading}>
        {isLoading && requests.length === 0 ? (
          <ul className="m-0 p-0 list-none" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 py-3 animate-pulse">
                <span className="size-11 rounded-full bg-surface-2" />
                <span className="flex-1 h-4 rounded bg-white/10" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <p className="m-0 text-sm text-ink-2">No pudimos cargar las solicitudes.</p>
            <button type="button" onClick={retry} className="h-10 px-4 rounded-xl bg-surface-2 border border-line-strong text-sm font-semibold">
              Reintentar
            </button>
          </div>
        ) : requests.length === 0 ? (
          <p className="m-0 py-16 text-center text-sm text-ink-2">No tenés solicitudes pendientes.</p>
        ) : (
          <ul className="m-0 p-0 list-none">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0">
                <Link href={`/profile/${encodeURIComponent(r.username)}`} className="flex flex-1 min-w-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-accent">
                  <Avatar src={r.avatarUrl ?? undefined} fallback={r.name || r.username} className="size-11 border-0" />
                  <span className="min-w-0 flex flex-col">
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="truncate text-[15px] font-semibold">{r.name || r.username}</span>
                      {r.isKycVerified && <ShieldCheck className="size-4 shrink-0 text-info" aria-label="Verificado" />}
                    </span>
                    <span className="truncate text-[13px] text-ink-2">@{r.username}</span>
                  </span>
                </Link>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={pending[r.username]}
                    onClick={() => void accept(r.username).catch(() => undefined)}
                    className="h-9 px-3.5 rounded-xl bg-accent text-on-accent text-[13px] font-semibold active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    disabled={pending[r.username]}
                    onClick={() => void reject(r.username).catch(() => undefined)}
                    aria-label={`Rechazar a ${r.username}`}
                    className="h-9 px-3 rounded-xl bg-surface-2 border border-line-strong text-[13px] font-semibold text-ink-2 active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
