"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PostCard } from "@/components/ui/PostCard";
import { EventCard } from "@/components/ui/EventCard";
import { QuickActionMenu } from "@/components/ui/QuickActionMenu";
import { CommunityList } from "@/components/communities/CommunityList";
import { MOCK_EVENTS, MOCK_COMMUNITIES } from "@/lib/mocks";
import type { Event } from "@/types/events";
import type { Post } from "@/types/posts";
import { Plus, Sparkles, Compass, ChevronUp, Globe, Flame, UserCheck, Users, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useMutation } from "@/hooks/useMutation";
import { postsApi } from "@/services/posts";
import { surveysApi } from "@/services/surveys";
import { Star } from "lucide-react";

type FilterType = "global" | "featured" | "following" | "communities";

interface FilterOption {
  id: FilterType;
  label: string;
  icon: React.ElementType;
}

export default function FeedPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("global");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwimlaneHidden, setIsSwimlaneHidden] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const swimlaneRef = useRef<HTMLElement | null>(null);

  // States for Posts
  const [globalPosts, setGlobalPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);

  // Pagination states
  const [globalPage, setGlobalPage] = useState(1);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);

  const [hasMoreGlobal, setHasMoreGlobal] = useState(false);
  const [hasMoreFeatured, setHasMoreFeatured] = useState(false);
  const [hasMoreFollowing, setHasMoreFollowing] = useState(false);

  // Mantiene el estado de si ya se hizo el primer fetch para evitar parpadeos
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);
  const [pendingSurveys, setPendingSurveys] = useState<Event[]>([]);

  // 1. Fetch Events
  const { mutate: fetchUpcomingEvents, isLoading: isLoadingEvents } = useMutation<Event[], void>(
    async () => {
      const res = await api.get("/v1/events");
      return res.data?.data || (Array.isArray(res.data) ? res.data : []);
    },
    {
      onSuccess: (data) => {
        setUpcomingEvents(data);
        setHasFetchedEvents(true);
      },
      onError: (err) => {
        console.error("Error fetching upcoming events from live backend:", err);
        setUpcomingEvents([]);
        setHasFetchedEvents(true);
      },
    }
  );

  const { mutate: fetchPendingSurveys } = useMutation<Event[], void>(
    surveysApi.getPendingSurveys,
    {
      onSuccess: (data) => {
        setPendingSurveys(data);
      },
      onError: (err) => {
        console.error("Error fetching pending surveys:", err);
      }
    }
  );

  useEffect(() => {
    void fetchUpcomingEvents().catch(() => undefined);
    void fetchPendingSurveys().catch(() => undefined);
  }, [fetchUpcomingEvents, fetchPendingSurveys]);

  // 2. Fetch Initial Posts (Option 1)
  const { mutate: loadInitialFeeds, isLoading: isLoadingInitialPosts } = useMutation(
    postsApi.getFeeds,
    {
      onSuccess: (res) => {
        if (res.global) {
          setGlobalPosts(res.global.data);
          setGlobalPage(res.global.pagination.page);
          setHasMoreGlobal(res.global.pagination.has_more);
        }
        if (res.featured) {
          setFeaturedPosts(res.featured.data);
          setFeaturedPage(res.featured.pagination.page);
          setHasMoreFeatured(res.featured.pagination.has_more);
        }
        if (res.following) {
          setFollowingPosts(res.following.data);
          setFollowingPage(res.following.pagination.page);
          setHasMoreFollowing(res.following.pagination.has_more);
        }
        setHasFetchedInitial(true);
      },
      onError: (err) => {
        console.error("Error fetching initial feeds:", err);
        setHasFetchedInitial(true);
      }
    }
  );

  useEffect(() => {
    loadInitialFeeds({ 
      include_feeds: "global,featured,following",
      global_limit: 10,
      featured_limit: 10,
      following_limit: 10
    }).catch(() => {});
  }, [loadInitialFeeds]);

  // 3. Load More Posts (Pagination)
  const { mutate: loadMorePosts, isLoading: isLoadingMore } = useMutation(
    postsApi.getFeeds,
    {
      onSuccess: (res, vars) => {
        const requestedFeeds = vars.include_feeds.split(",");
        
        if (requestedFeeds.includes("global") && res.global) {
          setGlobalPosts((prev) => [...prev, ...res.global!.data]);
          setGlobalPage(res.global.pagination.page);
          setHasMoreGlobal(res.global.pagination.has_more);
        }
        if (requestedFeeds.includes("featured") && res.featured) {
          setFeaturedPosts((prev) => [...prev, ...res.featured!.data]);
          setFeaturedPage(res.featured.pagination.page);
          setHasMoreFeatured(res.featured.pagination.has_more);
        }
        if (requestedFeeds.includes("following") && res.following) {
          setFollowingPosts((prev) => [...prev, ...res.following!.data]);
          setFollowingPage(res.following.pagination.page);
          setHasMoreFollowing(res.following.pagination.has_more);
        }
      }
    }
  );

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore) return; // Evitar multiples request simultaneos
    
    if (filter === "global" && hasMoreGlobal) {
      loadMorePosts({ include_feeds: "global", global_page: globalPage + 1, global_limit: 10 });
    } else if (filter === "featured" && hasMoreFeatured) {
      loadMorePosts({ include_feeds: "featured", featured_page: featuredPage + 1, featured_limit: 10 });
    } else if (filter === "following" && hasMoreFollowing) {
      loadMorePosts({ include_feeds: "following", following_page: followingPage + 1, following_limit: 10 });
    }
  }, [filter, hasMoreGlobal, hasMoreFeatured, hasMoreFollowing, globalPage, featuredPage, followingPage, isLoadingMore, loadMorePosts]);

  // Intersection Observer para Auto-Scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '400px' } // Arranca a precargar 400px antes de llegar al fondo
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [handleLoadMore]);


  const filterOptions: FilterOption[] = [
    { id: "global", label: "Todos", icon: Globe },
    { id: "featured", label: "Destacados", icon: Flame },
    { id: "following", label: "Seguidos", icon: UserCheck },
    { id: "communities", label: "Comunidades", icon: Users },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!swimlaneRef.current) return;
      const rect = swimlaneRef.current.getBoundingClientRect();
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

  const currentPosts = 
    filter === "global" ? globalPosts : 
    filter === "featured" ? featuredPosts : 
    filter === "following" ? followingPosts : [];
    
  const currentHasMore = 
    filter === "global" ? hasMoreGlobal : 
    filter === "featured" ? hasMoreFeatured : 
    filter === "following" ? hasMoreFollowing : false;

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white">
      {/* Sticky Header with Collapsible Eventos Destacados Bar */}
      <header 
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="sticky top-0 z-40 glass-header-obsidian transition-all duration-300 md:hidden cursor-pointer"
      >
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-sm tracking-tighter shadow-md shadow-[#D4FF00]/15">
              r
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-white">root</h1>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(true);
            }}
            className="bg-[#D4FF00] text-neutral-950 p-2 rounded-full hover:bg-[#bce400] active:scale-95 transition-all shadow-md shadow-[#D4FF00]/10 flex items-center justify-center gap-1.5 px-3.5 text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Crear</span>
          </button>
        </div>

        {(!hasFetchedEvents || isLoadingEvents || upcomingEvents.length > 0) && (
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out border-t border-white/10 bg-[#0B0D10]/95 backdrop-blur-xl",
              isSwimlaneHidden
                ? "max-h-14 opacity-100 py-1.5 px-4 pointer-events-auto"
                : "max-h-0 opacity-0 py-0 px-4 pointer-events-none border-t-transparent"
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                scrollToSwimlane();
              }}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-[#14171F] hover:bg-[#1A1F2B] active:scale-[0.99] border border-white/10 text-xs font-black uppercase tracking-wider transition-all duration-200 group shadow-inner cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
                <Calendar className="w-3.5 h-3.5 text-[#D4FF00]" />
                <span className="text-white tracking-wider font-black text-xs">Próximos eventos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/20">
                  {isLoadingEvents ? "..." : `${upcomingEvents.length} EVENTOS`}
                </span>
                <span className="text-neutral-400 group-hover:text-white flex items-center gap-0.5 text-[10px] font-bold">
                  <span>Ver</span>
                  <ChevronUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 pb-28 space-y-4">
        
        {/* Desktop Hero Banner */}
        <div className="relative w-full h-[350px] md:h-[450px] lg:h-[500px] overflow-hidden hidden md:flex items-center">
           <img 
             src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop" 
             alt="Electronic Music Festival" 
             className="absolute inset-0 w-full h-full object-cover opacity-40"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-transparent to-transparent" />
           <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D10]/80 via-transparent to-transparent" />
           <div className="relative z-10 text-center md:text-left space-y-4 w-full px-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-2">
               <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Now</span>
             </div>
             <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter text-white max-w-2xl">
               Descubrí tu próxima <span className="text-[#D4FF00]">experiencia</span> en la escena.
             </h2>
             <p className="text-neutral-300 font-medium text-lg max-w-xl">
               Conectá con la escena electrónica, encontrá los mejores eventos y sé parte de la comunidad exclusiva de root.
             </p>
           </div>
        </div>

        {/* Search Bar - Sticky on Desktop */}
        <div className="px-4 pt-4 md:pt-4 md:sticky md:top-0 md:z-40 md:bg-[#0B0D10]/85 md:backdrop-blur-xl md:pb-3 transition-all duration-300">
          <div 
            onClick={() => router.push('/search')}
            className="w-full bg-[#14171F] border border-white/10 rounded-full px-4 py-3 flex items-center gap-3 text-neutral-400 hover:bg-[#1A1F2B] transition-colors cursor-text shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-[#D4FF00]" />
            <span className="text-sm font-semibold tracking-wide">Buscar usuarios, eventos o posteos...</span>
          </div>
        </div>

        {/* Pending Surveys Swimlane */}
        {pendingSurveys.length > 0 && (
          <div className="mt-2 mb-6">
            <div className={cn(
              "flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-4 pb-4 scroll-px-4",
              pendingSurveys.length === 1 ? "justify-center" : "justify-start"
            )}>
              {pendingSurveys.map((surveyEvent) => (
                <div 
                  key={surveyEvent.id}
                  onClick={() => router.push(`/events/${surveyEvent.id}/survey`)}
                  className="relative overflow-hidden w-full shrink-0 snap-center rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-[#14171F] border border-purple-500/30 p-5 md:p-6 cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all group shadow-xl shadow-purple-900/20"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/30 transition-colors" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-1 w-fit">
                        <Star className="w-3.5 h-3.5 text-[#D4FF00] fill-[#D4FF00]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#D4FF00]">Feedback</span>
                      </div>
                      <h3 className="text-lg md:text-xl font-black italic tracking-tight text-white leading-tight">
                        Queremos saber tu opinión
                      </h3>
                      <p className="text-sm text-neutral-300 font-medium max-w-lg">
                        ¿Cómo te fue en <span className="font-bold text-white line-clamp-1">{surveyEvent.title}</span>? Tu reseña ayuda a la comunidad.
                      </p>
                    </div>
                    <button className="whitespace-nowrap w-full md:w-auto px-6 py-2.5 rounded-full bg-white text-black font-black uppercase tracking-wider text-xs shadow-lg hover:bg-neutral-200 transition-colors">
                      Evaluar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!hasFetchedEvents || isLoadingEvents || upcomingEvents.length > 0) && (
          <section ref={swimlaneRef} className="pt-4 pb-1">
            <div className="px-4 flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D4FF00]" /> Próximos Eventos
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4FF00]">
                {isLoadingEvents ? "..." : `${upcomingEvents.length} EVENTOS`}
              </span>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3.5 px-4 pb-2 scroll-px-4">
              {(!hasFetchedEvents || isLoadingEvents) ? (
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
              ) : (
                upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          </section>
        )}

        <div
          className="sticky z-30 transition-all duration-300 bg-[#0B0D10]/85 backdrop-blur-xl py-2 px-4 md:!top-[72px]"
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
                </button>
              );
            })}
          </div>
        </div>

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
                  {currentPosts.length} {currentPosts.length === 1 ? "publicación" : "publicaciones"}
                </span>
              </div>

              {(!hasFetchedInitial || isLoadingInitialPosts) ? (
                // Skeletons while loading initial posts
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="w-full h-80 bg-[#14171F] border border-white/5 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                  {currentPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} variant="electronic" />
                  ))}

                  {currentPosts.length === 0 && (
                    <div className="p-8 text-center rounded-3xl bg-[#14171F] border border-white/10 space-y-2 md:col-span-2 lg:col-span-3">
                      <Compass className="w-8 h-8 text-neutral-500 mx-auto" />
                      <p className="text-sm font-bold text-neutral-300">No hay publicaciones en esta sección</p>
                      <p className="text-xs text-neutral-500">Prueba cambiando de filtro o crea una nueva publicación.</p>
                    </div>
                  )}

                  {/* Load More Trigger */}
                  {currentHasMore && (
                    <div ref={loadMoreRef} className="w-full flex justify-center py-4 md:col-span-2 lg:col-span-3">
                      {isLoadingMore && (
                        <div className="flex items-center gap-2 text-neutral-500 font-bold text-xs uppercase tracking-widest">
                          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <QuickActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
