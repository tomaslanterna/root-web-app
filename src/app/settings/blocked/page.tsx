"use client";

import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBlocks } from "@/hooks/useBlocks";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { Avatar } from "@/components/ui/Avatar";
import { LoginRequired } from "@/components/ui/LoginRequired";

/**
 * /settings/blocked: cuentas que bloqueaste. No tienen link al perfil porque, bloqueadas, el perfil no se muestra:
 * primero hay que desbloquear.
 */
export default function BlockedUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const goBack = useBackNavigation("/settings");
  const { blocked, isLoading, error, pending, retry, unblock } = useBlocks();

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
          <h1 className="font-display header-title-fit m-0 flex-1 min-w-0">Bloqueados</h1>
        </div>
      </header>

      <section className="w-full max-w-2xl mx-auto px-4 pt-3" aria-busy={isLoading}>
        <p className="m-0 pb-2 text-[13px] text-ink-2">
          No ven tu perfil ni tus publicaciones y no te pueden escribir. No se enteran de que los bloqueaste.
        </p>
        {isLoading && blocked.length === 0 ? (
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
            <p className="m-0 text-sm text-ink-2">No pudimos cargar las cuentas bloqueadas.</p>
            <button type="button" onClick={retry} className="h-10 px-4 rounded-xl bg-surface-2 border border-line-strong text-sm font-semibold">
              Reintentar
            </button>
          </div>
        ) : blocked.length === 0 ? (
          <p className="m-0 py-16 text-center text-sm text-ink-2">No bloqueaste a nadie.</p>
        ) : (
          <ul className="m-0 p-0 list-none">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0">
                <Avatar src={b.avatarUrl ?? undefined} fallback={b.name || b.username} className="size-11 border-0" />
                <span className="min-w-0 flex-1 flex flex-col">
                  <span className="truncate text-[15px] font-semibold">{b.name || b.username}</span>
                  <span className="truncate text-[13px] text-ink-2">@{b.username}</span>
                </span>
                <button
                  type="button"
                  disabled={pending[b.username]}
                  onClick={() => void unblock(b.username).catch(() => undefined)}
                  aria-label={`Desbloquear a ${b.username}`}
                  className="h-9 px-3.5 shrink-0 rounded-xl bg-surface-2 border border-line-strong text-[13px] font-semibold active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {pending[b.username] ? "Desbloqueando…" : "Desbloquear"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
