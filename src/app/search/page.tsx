"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PostCard } from "@/components/ui/PostCard";
import { EventCard } from "@/components/ui/EventCard";
import { DetailHeader } from "@/components/ui/DetailHeader";
import { MOCK_POSTS, MOCK_EVENTS } from "@/lib/mocks"; // fallback

type TabType = "usuarios" | "eventos" | "posteos";

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("usuarios");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const tabs: { id: TabType; label: string }[] = [
    { id: "usuarios", label: "Usuarios" },
    { id: "eventos", label: "Eventos" },
    { id: "posteos", label: "Posteos" },
  ];

  // Auto focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Debounce the query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const fetchSearch = async () => {
      setIsLoading(true);
      
      const typeMap: Record<TabType, string> = {
        "usuarios": "USER",
        "eventos": "EVENT",
        "posteos": "POST"
      };

      try {
        const response = await api.post("/v1/search", {
          query: debouncedQuery,
          type: typeMap[activeTab],
          country: "AR"
        });
        setResults(response.data.results || []);
      } catch (err) {
        console.error("Search error", err);
        // Fallback for mocked view until backend is ready
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearch();
  }, [debouncedQuery, activeTab]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0B0D10] text-white">
      {/* Search Header */}
      <DetailHeader 
        isSearch={true}
        searchValue={query}
        onSearchChange={setQuery}
        onClearSearch={() => setQuery("")}
        searchInputRef={inputRef}
        className="sticky top-0 bg-[#0B0D10]/95 backdrop-blur-xl border-b border-white/10 pb-3"
      />

      {/* Tabs */}
      <div className="sticky top-[68px] z-30 bg-[#0B0D10]/95 backdrop-blur-xl border-b border-white/10 px-4">
        <div className="flex space-x-1 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 rounded-t-lg hover:bg-white/5",
                activeTab === tab.id
                  ? "border-[#D4FF00] text-[#D4FF00]"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1 p-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#D4FF00]" />
          </div>
        )}

        {!isLoading && debouncedQuery && results.length === 0 && (
          <div className="text-center p-8 text-neutral-500">
            <p className="text-sm font-bold uppercase tracking-wider">No se encontraron resultados</p>
          </div>
        )}

        {!isLoading && debouncedQuery && results.length > 0 && (
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 pb-20">
            {activeTab === "usuarios" && results.map((user: any) => (
              <div 
                key={user.id} 
                onClick={() => router.push(`/profile/${user.username}?from=search`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold">{user.name?.charAt(0)}</div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight">{user.name}</h3>
                  <p className="text-xs text-neutral-400 font-semibold tracking-wide">@{user.username}</p>
                </div>
              </div>
            ))}

            {activeTab === "eventos" && results.map((event: any) => (
              <EventCard key={event.id} event={event} variant="full" />
            ))}

            {activeTab === "posteos" && results.map((post: any) => (
              <PostCard key={post.id} post={post} variant="electronic" />
            ))}
          </div>
        )}

        {!debouncedQuery && (
          <div className="text-center p-8 text-neutral-600">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-wider">Empieza a escribir para buscar</p>
          </div>
        )}
      </div>
    </div>
  );
}
