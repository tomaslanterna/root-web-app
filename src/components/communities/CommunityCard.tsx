"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Users, CheckCircle2, MapPin, Radio } from "lucide-react";
import type { Community } from "@/types/communities";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const pathname = usePathname();
  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 } // Dispara cuando el 15% es visible
    );
    if (linkRef.current) {
      observer.observe(linkRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const detailUrl = `/communities/${community.slug || community.id}?origin=${encodeURIComponent(pathname)}`;

  return (
    <Link 
      ref={linkRef}
      href={detailUrl} 
      className={cn(
        "block w-full transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] md:hover:scale-[1.02]",
        isVisible 
          ? "scale-100 opacity-100 translate-y-0 blur-none" 
          : "scale-[0.70] md:scale-[0.92] opacity-0 md:opacity-60 translate-y-16 md:translate-y-0 blur-sm md:blur-none"
      )}
    >
      <Card
        className="relative w-full rounded-3xl overflow-hidden group h-48 sm:h-56 transition-all duration-300 border-white/10 hover:border-white/20 shadow-lg text-white"
      >
        {/* Background Image */}
        {community.coverImageUrl ? (
          <Image
            src={community.coverImageUrl}
            alt={community.name}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(212,255,0,0.22),transparent_35%),linear-gradient(135deg,#171b22,#08090b)]">
            <Radio className="absolute right-7 top-12 h-20 w-20 text-[#D4FF00]/10" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        {/* Members Tag */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-[#D4FF00] text-[10px] font-extrabold uppercase tracking-widest border border-white/15 shadow-md flex items-center gap-1">
          <Users className="w-3 h-3" />
          {community.membersCount} MIEMBROS
        </div>

        {/* Content over image */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end space-y-1.5">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#D4FF00]">
            <span>{community.category || "Comunidad"}</span>
            {community.zone && (
              <span className="flex items-center gap-1 text-neutral-300">
                <MapPin className="h-3 w-3" /> {community.zone}
              </span>
            )}
          </div>
          {/* Title */}
          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2 group-hover:text-[#D4FF00] transition-colors">
            {community.name}
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#D4FF00] group-hover:translate-x-1 transition-all" />
          </h3>

          {/* Description */}
          <p className="text-xs text-neutral-300 line-clamp-2 font-medium leading-relaxed max-w-[90%]">
            {community.description}
          </p>

          {/* Status (isMember) */}
          {community.isMember && (
            <div className="pt-1 flex items-center gap-1.5 text-[#D4FF00] text-[10px] font-extrabold uppercase tracking-widest">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ya eres miembro</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
