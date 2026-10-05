import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { Post } from "@/types/posts";

interface CommunityAnnouncementCardProps {
  announcement: Post;
}

export function CommunityAnnouncementCard({
  announcement,
}: CommunityAnnouncementCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#14171F] shadow-xl">
      {announcement.headerImageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={announcement.headerImageUrl}
            alt={announcement.title || "Imagen del anuncio"}
            fill
            unoptimized
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar
            src={announcement.authorAvatar}
            fallback={announcement.authorName || "R"}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-wider text-white">
              {announcement.authorName || "Equipo de la comunidad"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {new Date(announcement.timestamp).toLocaleString("es-UY", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div>
          {announcement.title && (
            <h3 className="text-lg font-black uppercase leading-tight text-white">
              {announcement.title}
            </h3>
          )}
          {announcement.content && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
              {announcement.content}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
          {announcement.eventId ? (
            <Link
              href={`/events/${announcement.eventId}`}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#D4FF00]"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Ver evento
            </Link>
          ) : (
            <span />
          )}
          <Link
            href={`/posts/${announcement.id}?origin=communities`}
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-white"
          >
            Ver publicación <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
