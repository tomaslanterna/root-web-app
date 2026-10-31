"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ChevronLeft, X } from "lucide-react";
import { cn, isValidImageUrl } from "@/lib/utils";
import { api } from "@/lib/api";
import { EventCard } from "@/components/ui/EventCard";
import { CommunityCard } from "@/components/communities/CommunityCard";

type TabType = "usuarios" | "eventos" | "comunidades";

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
    { id: "comunidades", label: "Comunidades" },
  ];

  // Auto focus input al montar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Debounce the query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  // Ejecutar búsqueda
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const fetchSearch = async () => {
      setIsLoading(true);

      const typeMap: Record<TabType, string> = {
        usuarios: "USER",
        eventos: "EVENT",
        comunidades: "COMMUNITY",
      };

      try {
        const response = await api.post("/v1/search", {
          query: debouncedQuery,
          type: typeMap[activeTab],
          country: "AR",
        });
        setResults(response.data.results || []);
      } catch (err) {
        console.error("Search error", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearch();
  }, [debouncedQuery, activeTab]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-bg text-ink pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16">
      {/* Header fijo superior con buscador y pestañas */}
      <header className="sticky top-0 z-30 w-full bg-bg/95 backdrop-blur-md border-b border-line">
        <div className="w-full max-w-4xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-1.5 md:pt-6">
          {/* Fila 1: Botón volver + Input de búsqueda */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Volver"
              className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
            >
              <ChevronLeft className="size-[22px]" aria-hidden="true" />
            </button>

            <div className="h-11 px-3.5 flex-1 min-w-0 flex items-center gap-2.5 rounded-control bg-surface border border-line focus-within:border-accent text-ink-3 transition-colors">
              <Search className="size-4.5 shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar eventos, usuarios o comunidades..."
                aria-label="Buscar eventos, usuarios o comunidades"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-ink text-sm font-semibold placeholder:text-ink-3"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full hover:bg-white/10 text-ink-3 hover:text-ink transition-colors cursor-pointer"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fila 2: Tabs estilo clásico con indicador inferior centrado */}
        <nav aria-label="Filtro de búsqueda" className="w-full">
          <div className="flex w-full max-w-4xl mx-auto items-stretch" role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={`search-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex-1 h-11 sm:h-12 flex items-center justify-center text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent cursor-pointer",
                    isActive ? "text-accent" : "text-ink-3 hover:text-ink-2",
                  )}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-[2.5px] bg-accent shadow-[0_-1px_6px_rgba(212,255,0,0.3)]" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Resultados de búsqueda */}
      <main className="w-full max-w-4xl mx-auto flex-1 px-4 pt-5 pb-20">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-accent" aria-label="Buscando..." />
          </div>
        )}

        {!isLoading && debouncedQuery && results.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Search className="size-10 text-ink-3 opacity-30 mb-1" aria-hidden="true" />
            <p className="font-display text-lg text-ink m-0">No se encontraron resultados</p>
            <p className="text-sm text-ink-3 m-0">
              No hay coincidencias para &ldquo;{debouncedQuery}&rdquo; en {activeTab}.
            </p>
          </div>
        )}

        {!isLoading && !debouncedQuery && (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
            <span className="size-14 rounded-2xl bg-surface border border-line flex items-center justify-center text-accent mb-1 shadow-sm">
              <Search className="size-6" aria-hidden="true" />
            </span>
            <p className="font-display text-xl text-ink m-0">Explorá en Root</p>
            <p className="text-sm text-ink-3 m-0">
              Buscá artistas, fiestas, perfiles de amigos o comunidades.
            </p>
          </div>
        )}

        {!isLoading && debouncedQuery && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="label-mono text-ink-3">
                {results.length} {results.length === 1 ? "resultado" : "resultados"}
              </span>
            </div>

            {activeTab === "usuarios" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.map((user: any) => (
                  <div
                    key={user.id}
                    onClick={() => router.push(`/profile/${user.username}?from=search`)}
                    className="p-3.5 rounded-card bg-surface border border-line flex items-center gap-3.5 hover:bg-surface-2 transition-colors cursor-pointer group focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <div className="size-12 rounded-full overflow-hidden bg-surface-2 shrink-0 border border-white/10 ring-1 ring-white/10">
                      {isValidImageUrl(user.avatarUrl) ? (
                        <img
                          src={user.avatarUrl.trim()}
                          alt=""
                          className="size-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-base font-bold text-ink">
                          {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <h3 className="font-semibold text-ink text-[15px] leading-snug truncate m-0 group-hover:text-accent transition-colors">
                        {user.name}
                      </h3>
                      <p className="text-xs text-ink-3 font-medium tracking-wide m-0 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "eventos" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {activeTab === "comunidades" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((community: any) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
