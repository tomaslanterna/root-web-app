import { CommunityCard } from "./CommunityCard";
import type { Community } from "@/types/communities";

interface CommunityListProps {
  communities: Community[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function CommunityList({ communities, isLoading, emptyMessage = "No hay comunidades disponibles en tu zona" }: CommunityListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[280px] rounded-[18px] border border-line bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  if (communities.length === 0) {
    return <p className="m-0 py-8 text-center text-[15px] text-ink-2">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
      {communities.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </div>
  );
}
