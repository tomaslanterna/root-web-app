"use client";

import { Check, ChevronLeft, Info, Loader2 } from "lucide-react";
import type { Community } from "@/types/communities";
import { CommunityCover } from "./CommunityCover";

interface CommunityHeaderProps {
  community: Pick<
    Community,
    "name" | "coverImageUrl" | "category" | "zone" | "membersCount" | "isMember"
  >;
  onBack: () => void;
  onOpenInfo: () => void;
  isInfoOpen: boolean;
  onJoin: () => void;
  isJoining?: boolean;
}

const roundButton =
  "size-11 rounded-full bg-bg/80 text-ink flex items-center justify-center transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-accent";

export function CommunityHeader({
  community,
  onBack,
  onOpenInfo,
  isInfoOpen,
  onJoin,
  isJoining = false,
}: CommunityHeaderProps) {
  const meta = [community.category, community.zone].filter(Boolean).join(" · ");

  return (
    <header>
      <div className="relative h-[200px] bg-surface-2">
        <CommunityCover coverImageUrl={community.coverImageUrl} category={community.category} sizes="100vw" />
        <div className="absolute top-[calc(1rem+var(--root-safe-top))] md:top-4 inset-x-4 flex justify-between">
          <button type="button" onClick={onBack} aria-label="Volver" className={roundButton}>
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onOpenInfo}
            aria-haspopup="dialog"
            aria-expanded={isInfoOpen}
            aria-label={`Ver información de ${community.name}`}
            className={roundButton}
          >
            <Info className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6 flex flex-col gap-2">
        <h1 className="font-display m-0 text-[30px]">{community.name}</h1>
        <span className="text-sm text-ink-2">
          <span className="num-mono font-semibold text-ink">{community.membersCount.toLocaleString("es-AR")}</span>{" "}
          miembros{meta ? ` · ${meta}` : ""}
        </span>
        <div className="mt-2 flex gap-2">
          {community.isMember ? (
            <button
              type="button"
              onClick={onOpenInfo}
              className="h-11 px-4 rounded-xl bg-surface-2 border border-line-strong text-sm font-semibold flex items-center gap-1.5 hover:bg-[#23272D] transition-colors"
            >
              <Check className="size-4 text-accent" strokeWidth={2.4} aria-hidden="true" />
              Miembro
            </button>
          ) : (
            <button
              type="button"
              onClick={onJoin}
              disabled={isJoining}
              className="h-11 px-4 rounded-xl bg-accent text-on-accent text-sm font-semibold flex items-center gap-1.5 hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {isJoining && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Unirme
            </button>
          )}
          <button
            type="button"
            onClick={onOpenInfo}
            className="h-11 px-4 rounded-xl border border-line-strong text-sm font-semibold hover:bg-surface transition-colors"
          >
            Integrantes
          </button>
        </div>
      </div>
    </header>
  );
}
