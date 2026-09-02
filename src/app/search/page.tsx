"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EventCard } from "@/components/ui/EventCard";
import { PostCard } from "@/components/ui/PostCard";
import { useSearch, type SearchTab } from "@/hooks/useSearch";
import type { Post } from "@/lib/mocks";
import { cn } from "@/lib/utils";
import type { SearchUser } from "@/services/search";
import type { Event } from "@/types/events";

const tabs: { id: SearchTab; label: string }[] = [
  { id: "usuarios", label: "Usuarios" },
  { id: "eventos", label: "Eventos" },
  { id: "posteos", label: "Posteos" },
];

function parseTab(value: string | null): SearchTab {
  return tabs.some((tab) => tab.id === value) ? (value as SearchTab) : "usuarios";
}

function updateSearchUrl(query: string, tab: SearchTab) {
  const params = new URLSearchParams(window.location.search);
  if (query.trim()) {
    params.set("q", query);
  } else {
    params.delete("q");
  }

  if (tab === "usuarios") {
    params.delete("tab");
  } else {
    params.set("tab", tab);
  }

  const nextUrl = params.size > 0 ? `/search?${params.toString()}` : "/search";
  window.history.replaceState(null, "", nextUrl);
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [activeTab, setActiveTab] = useState<SearchTab>(() => parseTab(searchParams.get("tab")));
  const { results, isLoading } = useSearch(query, activeTab);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const changeQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    updateSearchUrl(nextQuery, activeTab);
  };

  const changeTab = (nextTab: SearchTab) => {
    setActiveTab(nextTab);
    updateSearchUrl(query, nextTab);
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0B0D10] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D10]/95 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Volver"
            onClick={() => router.back()}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-300" />
          </button>

          <div className="flex flex-1 items-center rounded-xl border border-white/5 bg-[#14171F] px-3 py-2.5 transition-colors focus-within:border-[#D4FF00]/50">
            <Search className="mr-2 h-4 w-4 text-neutral-500" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Buscar..."
              className="w-full border-none bg-transparent text-sm font-semibold text-white outline-none placeholder:text-neutral-500"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={() => changeQuery("")}
                className="ml-2 rounded-full p-1 hover:bg-white/10"
              >
                <span className="text-xs font-bold uppercase text-neutral-400">Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="sticky top-[68px] z-30 border-b border-white/10 bg-[#0B0D10]/95 px-4 backdrop-blur-xl">
        <div className="flex space-x-1 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => changeTab(tab.id)}
              className={cn(
                "flex-1 rounded-t-lg border-b-2 py-3 text-xs font-black uppercase tracking-wider transition-all hover:bg-white/5",
                activeTab === tab.id
                  ? "border-[#D4FF00] text-[#D4FF00]"
                  : "border-transparent text-neutral-500 hover:text-neutral-300",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4">
        {isLoading && (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#D4FF00]" />
          </div>
        )}

        {!isLoading && hasQuery && results.length === 0 && (
          <div className="p-8 text-center text-neutral-500">
            <p className="text-sm font-bold uppercase tracking-wider">No se encontraron resultados</p>
          </div>
        )}

        {!isLoading && hasQuery && results.length > 0 && (
          <div className="space-y-4 pb-20">
            {activeTab === "usuarios" &&
              (results as SearchUser[]).map((user) => (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => router.push(`/profile/${user.username}?from=search`)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-white/10 hover:bg-white/5"
                >
                  <Avatar src={user.avatarUrl} fallback={user.name} size="md" />
                  <span>
                    <span className="block font-bold leading-tight text-white">{user.name}</span>
                    <span className="block text-xs font-semibold tracking-wide text-neutral-400">
                      @{user.username}
                    </span>
                  </span>
                </button>
              ))}

            {activeTab === "eventos" &&
              (results as Event[]).map((event) => (
                <EventCard key={event.id} event={event} variant="full" />
              ))}

            {activeTab === "posteos" &&
              (results as Post[]).map((post) => (
                <PostCard key={post.id} post={post} variant="electronic" />
              ))}
          </div>
        )}

        {!hasQuery && (
          <div className="p-8 text-center text-neutral-600">
            <Search className="mx-auto mb-3 h-10 w-10 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-wider">Empieza a escribir para buscar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#0B0D10]">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4FF00]" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
