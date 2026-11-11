"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Check, UsersRound } from "lucide-react";
import type { Community } from "@/types/communities";
import { CommunityCover } from "./CommunityCover";

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const pathname = usePathname();
  const detailUrl = `/communities/${community.slug || community.id}?origin=${encodeURIComponent(pathname)}`;
  const meta = [community.category || "Comunidad", community.zone].filter(Boolean).join(" · ");

  return (
    <Link href={detailUrl} className="group flex min-h-[238px] flex-col overflow-hidden rounded-[22px] border border-line bg-surface text-ink transition-[border-color,transform] hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-accent">
      <div className="relative h-[142px] bg-surface-2">
        <CommunityCover
          coverImageUrl={community.coverImageUrl}
          category={community.category}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/65 px-2.5 py-1.5 text-xs backdrop-blur-md">
          <UsersRound className="size-3.5 text-accent" aria-hidden="true" />
          <span className="num-mono font-semibold">{community.membersCount.toLocaleString("es-AR")}</span>
        </span>
        <span className="label-mono absolute bottom-3 left-3 text-accent">{meta}</span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[18px] font-semibold tracking-tight">{community.name}</span>
          <ArrowUpRight className="size-[18px] shrink-0 text-ink-3 transition-colors group-hover:text-accent" aria-hidden="true" />
        </div>
        {community.description && (
          <span className="text-sm leading-snug text-ink-2 line-clamp-2">{community.description}</span>
        )}
        <div className="mt-auto flex min-h-8 items-end justify-between gap-3 pt-2">
          {community.isMember ? (
            <>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-2">
                <Check className="size-4 text-accent" strokeWidth={2.4} aria-hidden="true" />
                Sos miembro
              </span>
              {community.muted ? (
                <span className="label-mono text-ink-3">Silenciada</span>
              ) : community.unreadCount > 0 ? (
                <span className="label-mono text-accent">{community.unreadCount} novedades</span>
              ) : null}
            </>
          ) : (
            <span className="text-[13px] font-semibold text-ink-2">Entrar a la comunidad</span>
          )}
        </div>
      </div>
    </Link>
  );
}
