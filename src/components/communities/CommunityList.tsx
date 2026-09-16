import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserPlus, ArrowRight, Users, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Community } from "@/types/communities";

interface CommunityListProps {
  communities: Community[];
  isLoading?: boolean;
}

export function CommunityList({ communities, isLoading }: CommunityListProps) {
  const pathname = usePathname();
  
  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full h-64 bg-[#14171F] border border-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {communities.map((community) => {
        const detailUrl = `/communities/${community.id}?origin=${pathname}`;
        return (
        <Card key={community.id} className="rounded-3xl bg-[#14171F] border border-white/10 shadow-lg hover:border-white/20 transition-all group">
          <CardHeader className="h-36 relative overflow-hidden">
            <Link href={detailUrl} className="block w-full h-full">
              <img
                src={community.coverImageUrl}
                alt={community.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Link>
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-[#D4FF00] text-[10px] font-extrabold uppercase tracking-widest border border-white/15">
              {community.membersCount} MIEMBROS
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <Link href={detailUrl} className="block space-y-1">
              <h2 className="text-base font-black uppercase tracking-tight text-white group-hover:text-[#D4FF00] transition-colors flex items-center justify-between">
                <span>{community.name}</span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </h2>
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-medium">
                {community.description}
              </p>
            </Link>
            
            {community.isMember && (
              <div className="pt-3 flex items-center gap-1.5 text-[#D4FF00] text-[10px] font-extrabold uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya eres miembro</span>
              </div>
            )}
          </CardContent>
        </Card>
      )})}

      {communities.length === 0 && (
        <div className="p-8 text-center rounded-3xl bg-[#14171F] border border-white/10 space-y-2 md:col-span-2 lg:col-span-3">
          <Users className="w-8 h-8 text-neutral-500 mx-auto" />
          <p className="text-sm font-bold text-neutral-300">No hay comunidades disponibles en tu zona</p>
        </div>
      )}
    </div>
  );
}
