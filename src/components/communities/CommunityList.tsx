import { CommunityCard } from "./CommunityCard";
import { Users, Loader2 } from "lucide-react";
import type { Community } from "@/types/communities";

interface CommunityListProps {
  communities: Community[];
  isLoading?: boolean;
}

export function CommunityList({ communities, isLoading }: CommunityListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full h-48 sm:h-56 bg-[#14171F] border border-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {communities.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}

      {communities.length === 0 && (
        <div className="p-8 text-center rounded-3xl bg-[#14171F] border border-white/10 space-y-2 md:col-span-2 lg:col-span-3">
          <Users className="w-8 h-8 text-neutral-500 mx-auto" />
          <p className="text-sm font-bold text-neutral-300">No hay comunidades disponibles en tu zona</p>
        </div>
      )}
    </div>
  );
}
