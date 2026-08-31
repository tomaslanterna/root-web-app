"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PostCard } from "@/components/ui/PostCard";
import { EventCard } from "@/components/ui/EventCard";
import { QuickActionMenu } from "@/components/ui/QuickActionMenu";
import { CommunityList } from "@/components/communities/CommunityList";
import { MOCK_POSTS, MOCK_EVENTS, MOCK_COMMUNITIES } from "@/lib/mocks";
import type { Event } from "@/types/events";
import { Plus, Sparkles, Compass, ChevronUp, Globe, Flame, UserCheck, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useMutation } from "@/hooks/useMutation";

type FilterType = "all" | "featured" | "following" | "communities";

interface FilterOption {
  id: FilterType;
  label: string;
  icon: React.ElementType;
  count: number;
}

export default function FeedPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwimlaneHidden, setIsSwimlaneHidden] = useState(false);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const swimlaneRef = useRef<HTMLElement | null>(null);

  const { mutate: fetchFeaturedEvents, isLoading: isLoadingEvents } = useMutation<Event[], void>(
    async () => {
      const res = await api.get("/v1/events/featured");
      return res.data?.data || (Array.isArray(res.data) ? res.data : []);
    },
    {
      onSuccess: (data) => setFeaturedEvents(data),
      onError: (err) => {
        console.error("Error fetching featured events from live backend:", err);
        setFeaturedEvents([]);
      },
    }
  );

  useEffect(() => {
    void fetchFeaturedEvents().catch(() => undefined);
  }, [fetchFeaturedEvents]);

  const filterOptions: FilterOption[] = [
    { id: "all", label: "Todos", icon: Globe, count: MOCK_POSTS.length },
    {
      id: "featured",
      label: "Destacados",
      icon: Flame,
      count: MOCK_POSTS.filter((p) => p.likesCount > 40).length,
    },
    {
      id: "following",
      label: "Seguidos",
      icon: UserCheck,
      count: MOCK_POSTS.filter((p) => p.authorId === "1" || p.authorId === "2").length,
    },
    {
      id: "communities",
      label: "Comunidades",
      icon: Users,
      count: MOCK_COMMUNITIES.length,
    },
  ];

  // Detect when the featured events swimlane has scrolled out of view
  useEffect(() => {
    const handleScroll = () => {
      if (!swimlaneRef.current) return;
      const rect = swimlaneRef.current.getBoundingClientRect();
      // Header is ~56px high. When swimlane bottom is above 60px, it's scrolled out
      setIsSwimlaneHidden(rect.bottom <= 60);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSwimlane = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const filteredPosts = MOCK_POSTS.filter((post) => {
    if (filter === "featured") return post.likesCount > 40;
    if (filter === "following") return post.authorId === "1" || post.authorId === "2";
    if (filter === "communities") return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white">
      {/* Sticky Header with Collapsible Eventos Destacados Bar */}
      <header className="sticky top-0 z-40 glass-header-obsidian transition-all duration-300">
        {/* Main Brand Bar */}
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-sm tracking-tighter shadow-md shadow-[#D4FF00]/15">
              r
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-white">root</h1>
          </div>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="bg-[#D4FF00] text-neutral-950 p-2 rounded-full hover:bg-[#bce400] active:scale-95 transition-all shadow-md shadow-[#D4FF00]/10 flex items-center justify-center gap-1.5 px-3.5 text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Crear</span>
          </button>
        </div>

        {/* Collapsed Sticky "Eventos Destacados" Tab Bar */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out border-t border-white/10 bg-[#0B0D10]/95 backdrop-blur-xl",
            isSwimlaneHidden
              ? "max-h-14 opacity-100 py-1.5 px-4 pointer-events-auto"
              : "max-h-0 opacity-0 py-0 px-4 pointer-events-none border-t-transparent"
          )}
        >
          <button
            onClick={scrollToSwimlane}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-[#14171F] hover:bg-[#1A1F2B] active:scale-[0.99] border border-white/10 text-xs font-black uppercase tracking-wider transition-all duration-200 group shadow-inner cursor-pointer"
            title="Ver eventos destacados"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" />
              <span className="text-white tracking-wider font-black text-xs">Eventos destacados</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/20">
                {isLoadingEvents ? "..." : `${featuredEvents.length} EVENTOS`}
              </span>
              <span className="text-neutral-400 group-hover:text-white flex items-center gap-0.5 text-[10px] font-bold">
                <span>Ver</span>
                <ChevronUp className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 text-[#D4FF00]" />
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 pb-28 space-y-4">
        {/* Search Bar Visual */}
        <div className="px-4 pt-4">
          <div 
            onClick={() => router.push('/search')}
            className="w-full bg-[#14171F] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 text-neutral-400 hover:bg-[#1A1F2B] transition-colors cursor-text"
          >
            <Sparkles className="w-4 h-4 text-[#D4FF00]" />
            <span className="text-sm font-semibold tracking-wide">Buscar usuarios, eventos o posteos...</span>
          </div>
        </div>

        {/* Featured Events Swimlane Section */}
        <section ref={swimlaneRef} className="pt-4 pb-1">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" /> Eventos Destacados
            </h2>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4FF00]">
              {isLoadingEvents ? "..." : `${featuredEvents.length} EVENTOS`}
            </span>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3.5 px-4 pb-2 scroll-px-4">
            {isLoadingEvents ? (
              // Skeletons
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-[260px] sm:w-[280px] shrink-0 snap-start aspect-[2/3] rounded-3xl bg-[#14171F] border border-white/5 animate-pulse relative overflow-hidden flex flex-col justify-end p-4 space-y-2"
                >
                  <div className="w-16 h-4 rounded-full bg-white/10" />
                  <div className="w-3/4 h-5 rounded-md bg-white/10" />
                  <div className="w-1/2 h-3 rounded-md bg-white/10" />
                </div>
              ))
            ) : featuredEvents.length > 0 ? (
              featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="px-4 py-8 text-neutral-500 text-xs italic">
                No hay eventos destacados en este momento.
              </div>
            )}
          </div>
        </section>

        {/* Sticky Feed Tabs Navigation (Todos / Destacados / Seguidos / Comunidades) */}
        <div
          className="sticky z-30 transition-[top] duration-300 bg-[#0B0D10]/85 backdrop-blur-xl py-2 px-4"
          style={{ top: isSwimlaneHidden ? "100px" : "56px" }}
        >
          <div className="w-full bg-[#14171F]/90 p-1 rounded-full border border-white/10 shadow-lg flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {filterOptions.map((option) => {
              const isActive = filter === option.id;
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 select-none cursor-pointer",
                    isActive
                      ? "bg-[#D4FF00] text-neutral-950 shadow-md shadow-[#D4FF00]/15 scale-[1.01]"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "stroke-[2.5]" : "stroke-2")} />
                  <span className={cn(isActive ? "inline" : "hidden sm:inline")}>{option.label}</span>
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-extrabold",
                      isActive
                        ? "bg-neutral-950/20 text-neutral-950"
                        : "bg-white/10 text-neutral-400"
                    )}
                  >
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Section based on Filter */}
        <section className="px-4 space-y-4 pt-1">
          {filter === "communities" ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#D4FF00]" /> Comunidades RRPP
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                  {MOCK_COMMUNITIES.length} {MOCK_COMMUNITIES.length === 1 ? "comunidad" : "comunidades"}
                </span>
              </div>
              <CommunityList />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#D4FF00]" /> Publicaciones
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                  {filteredPosts.length} {filteredPosts.length === 1 ? "publicación" : "publicaciones"}
                </span>
              </div>

              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} variant="electronic" />
                ))}

                {filteredPosts.length === 0 && (
                  <div className="p-8 text-center rounded-3xl bg-[#14171F] border border-white/10 space-y-2">
                    <Compass className="w-8 h-8 text-neutral-500 mx-auto" />
                    <p className="text-sm font-bold text-neutral-300">No hay publicaciones en esta sección</p>
                    <p className="text-xs text-neutral-500">Prueba cambiando de filtro o crea una nueva publicación.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Quick Action Drawer */}
      <QuickActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}


