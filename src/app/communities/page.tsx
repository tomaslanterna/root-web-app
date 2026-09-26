"use client";

import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { CommunityList } from "@/components/communities/CommunityList";
import { api } from "@/lib/api";

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await api.get("/v1/communities?countryId=UY");
        setCommunities(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching communities:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCommunities();
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0B0D10] text-white pb-28">
      <header className="sticky top-0 z-40 glass-header-obsidian px-4 pb-3 pt-safe-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#D4FF00]" />
          <h1 className="text-lg font-black uppercase tracking-wider text-white">Comunidades RRPP</h1>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4FF00]">
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : `${communities.length} DISPONIBLES`}
        </span>
      </header>

      <div className="p-4">
        <CommunityList communities={communities} isLoading={isLoading} />
      </div>
    </div>
  );
}

