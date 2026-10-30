"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
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
    <Link
      href={detailUrl}
      className="flex flex-col rounded-[18px] overflow-hidden bg-surface border border-line text-ink transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="relative h-[132px] bg-surface-2">
        <CommunityCover
          coverImageUrl={community.coverImageUrl}
          category={community.category}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <span className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full bg-bg/80 text-[13px] flex gap-[5px]">
          <span className="num-mono font-semibold">{community.membersCount.toLocaleString("es-AR")}</span>
          <span className="text-ink-2">miembros</span>
        </span>
      </div>

      <div className="flex-1 p-3.5 flex flex-col gap-1.5">
        <span className="text-[17px] font-semibold">{community.name}</span>
        <span className="label-mono text-accent">{meta}</span>
        {community.description && (
          <span className="text-sm leading-snug text-ink-2 line-clamp-2">{community.description}</span>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-3">
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
            <span className="h-10 px-4 rounded-xl bg-surface-2 border border-line-strong flex items-center text-sm font-semibold">
              Ver comunidad
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
