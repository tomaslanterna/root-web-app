"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFollowList } from "@/hooks/useFollowList";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { RootLoader } from "@/components/ui/RootLoader";
import { cn, isValidImageUrl } from "@/lib/utils";
import type { FollowListKind, FollowListUser } from "@/types/follows";
import { TabIndicator } from "@/components/ui/TabIndicator";

interface FollowListScreenProps {
  username: string;
  initialKind: FollowListKind;
}

const TABS: { kind: FollowListKind; label: string }[] = [
  { kind: "followers", label: "Seguidores" },
  { kind: "following", label: "Seguidos" },
];

/** Pantalla de seguidores / seguidos de un perfil, con pestañas y botón de seguir por persona. */
export function FollowListScreen({ username, initialKind }: FollowListScreenProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [kind, setKind] = useState<FollowListKind>(initialKind);
  const { users, total, hasMore, isLoading, isLoadingMore, error, pending, loadMore, retry, toggleFollow } =
    useFollowList(username, kind);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isMine = currentUser?.username === username;
  const profileHref = `/profile/${encodeURIComponent(username)}`;

  // La pestaña queda en la URL: volver atrás o compartir el link abre la misma lista.
  const selectKind = (next: FollowListKind) => {
    if (next === kind) return;
    setKind(next);
    router.replace(`${profileHref}/follows?tab=${next}`, { scroll: false });
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace(profileHref);
  };

  const emptyText =
    kind === "followers"
      ? isMine ? "Todavía nadie te sigue." : `Todavía nadie sigue a @${username}.`
      : isMine ? "Todavía no seguís a nadie." : `@${username} todavía no sigue a nadie.`;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg pb-[calc(var(--root-mobile-nav-clearance)+1rem)] text-ink md:pb-16">
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="w-full max-w-3xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] md:pt-6 flex items-center gap-3">
          <SwipeBack onBack={goBack} />
          <button
            type="button"
            onClick={goBack}
            aria-label="Volver al perfil"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <h1 className="m-0 flex-1 min-w-0 truncate text-[17px] font-semibold">@{username}</h1>
        </div>

        <div role="tablist" aria-label="Seguidores y seguidos" className="relative w-full max-w-3xl mx-auto px-4 mt-2 flex">
          <TabIndicator variant="underline" inset={24} />
          {TABS.map((tab) => {
            const active = tab.kind === kind;
            return (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectKind(tab.kind)}
                className={cn(
                  "relative flex-1 h-11 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                  active ? "text-ink" : "text-ink-3 hover:text-ink-2",
                )}
              >
                {tab.label}
                {active && !isLoading && !error && <span className="num-mono ml-1.5 text-ink-2">{total}</span>}
              </button>
            );
          })}
        </div>
      </header>

      <section key={kind} role="tabpanel" aria-busy={isLoading} className="tab-panel-in w-full max-w-3xl mx-auto px-4 pt-2">
        {isLoading ? (
          <ul className="flex flex-col" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 py-3 animate-pulse">
                <span className="size-11 rounded-full bg-surface-2" />
                <span className="flex-1 flex flex-col gap-2">
                  <span className="h-3.5 w-2/5 rounded bg-white/10" />
                  <span className="h-3 w-1/4 rounded bg-white/5" />
                </span>
                <span className="h-9 w-24 rounded-xl bg-white/5" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <p className="m-0 text-sm text-ink-2">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="h-10 px-4 rounded-xl bg-surface-2 border border-line-strong text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent"
            >
              Reintentar
            </button>
          </div>
        ) : users.length === 0 ? (
          <p className="m-0 py-16 text-center text-sm text-ink-2">{emptyText}</p>
        ) : (
          <>
            <ul className="flex flex-col">
              {users.map((user) => (
                <FollowRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === currentUser?.id}
                  isLoggedIn={Boolean(currentUser)}
                  isPending={Boolean(pending[user.username])}
                  onToggle={() => void toggleFollow(user)}
                  onLogin={() => router.push("/login")}
                />
              ))}
            </ul>
            <div ref={sentinelRef} />
            {isLoadingMore && <RootLoader size="xs" ariaLabel="Cargando más" className="pt-4 pb-2" />}
          </>
        )}
      </section>
    </div>
  );
}

interface FollowRowProps {
  user: FollowListUser;
  isSelf: boolean;
  isLoggedIn: boolean;
  isPending: boolean;
  onToggle: () => void;
  onLogin: () => void;
}

function FollowRow({ user, isSelf, isLoggedIn, isPending, onToggle, onLogin }: FollowRowProps) {
  const avatar = isValidImageUrl(user.avatarUrl) ? user.avatarUrl!.trim() : null;

  return (
    <li className="flex items-center gap-3 py-2">
      <Link
        href={`/profile/${encodeURIComponent(user.username)}`}
        className="flex flex-1 min-w-0 items-center gap-3 py-1 rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-surface-2 flex items-center justify-center text-base font-semibold">
          {avatar ? (
            <Image src={avatar} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            (user.name || user.username).charAt(0).toUpperCase()
          )}
        </span>
        <span className="min-w-0 flex flex-col">
          <span className="flex items-center gap-1 min-w-0">
            <span className="truncate text-[15px] font-semibold">{user.name || user.username}</span>
            {user.isKycVerified && (
              <ShieldCheck className="size-4 shrink-0 text-info" aria-label="Verificado" />
            )}
          </span>
          <span className="truncate text-[13px] text-ink-2">@{user.username}</span>
        </span>
      </Link>

      {!isSelf && (
        <button
          type="button"
          onClick={isLoggedIn ? onToggle : onLogin}
          disabled={isPending}
          aria-pressed={isLoggedIn ? user.isFollowing : undefined}
          className={cn(
            "h-9 min-w-24 shrink-0 px-4 rounded-xl text-[13px] font-semibold transition-[background-color,transform] active:scale-[0.97] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent",
            user.isFollowing
              ? "bg-surface-2 border border-line-strong text-ink"
              : "bg-accent text-on-accent",
          )}
        >
          {user.isFollowing ? "Siguiendo" : "Seguir"}
        </button>
      )}
    </li>
  );
}
