"use client";

import { useState, use } from "react";
import { MOCK_COMMUNITIES, MOCK_POSTS } from "@/lib/mocks";
import { PostCard } from "@/components/ui/PostCard";
import { Button } from "@/components/ui/Button";
import { QuickActionMenu } from "@/components/ui/QuickActionMenu";
import { Users, UserPlus, ArrowLeft, Plus, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DetailHeader } from "@/components/ui/DetailHeader";

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const resolvedParams = typeof (params as any)?.then === "function" ? use(params as Promise<{ id: string }>) : (params as { id: string });
  const community = MOCK_COMMUNITIES.find((c) => c.id === resolvedParams.id);

  const [isJoined, setIsJoined] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!community) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#0B0D10] text-white">
        <p className="text-sm font-bold uppercase text-neutral-400">Comunidad no encontrada</p>
        <Link href="/communities" className="mt-4">
          <Button variant="outline" size="sm">Volver a comunidades</Button>
        </Link>
      </div>
    );
  }

  const communityPosts = MOCK_POSTS.filter((p) => p.communityId === community.id);

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white pb-28">
      {/* Detail Header */}
      <DetailHeader onBack={() => router.push('/communities')} />

      {/* Community Header Banner */}
      <div className="relative w-full h-48 sm:h-56 md:h-80 bg-neutral-950 overflow-hidden">
        <img
          src={community.coverImageUrl}
          alt={community.name}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-neutral-950/40 to-transparent" />
        
        <div className="absolute bottom-4 inset-x-4 md:inset-x-8 space-y-1 text-white">
          <span className="px-3 py-1 rounded-full bg-[#D4FF00]/20 backdrop-blur-md text-[#D4FF00] text-[10px] font-extrabold uppercase tracking-widest border border-[#D4FF00]/30">
            {community.membersCount + (isJoined ? 1 : 0)} Miembros
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight">
            {community.name}
          </h1>
        </div>
      </div>

      <div className="p-4 md:px-8 space-y-6 md:space-y-0 md:grid md:grid-cols-12 md:gap-8 items-start">
        
        {/* Right Column / Sidebar (Actions & Description) - Move to right on Desktop, top on Mobile */}
        <div className="md:col-span-4 lg:col-span-3 order-1 md:order-2 md:sticky md:top-24 space-y-4">
          <div className="p-5 rounded-3xl bg-[#14171F] border border-white/10 shadow-lg space-y-4">
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
              {community.description}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant={isJoined ? "outline" : "primary"}
                className="w-full gap-2"
                onClick={() => setIsJoined(!isJoined)}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isJoined ? "Miembro Activo ✓" : "Unirse a la Comunidad"}</span>
              </Button>

              <Button
                variant="secondary"
                className="w-full gap-2"
                onClick={() => setIsMenuOpen(true)}
              >
                <Plus className="w-4 h-4 text-[#D4FF00]" />
                <span>Crear Publicación</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Left Column / Main (Posts Feed) - Move to left on Desktop, bottom on Mobile */}
        <div className="md:col-span-8 lg:col-span-9 order-2 md:order-1 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" /> Publicaciones en {community.name}
            </h2>
            <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-widest text-[#D4FF00]">
              {communityPosts.length} POSTS
            </span>
          </div>

          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {communityPosts.length > 0 ? (
              communityPosts.map((post) => <PostCard key={post.id} post={post} variant="electronic" />)
            ) : (
              <div className="py-12 text-center bg-[#14171F] rounded-3xl border border-white/10 p-6 space-y-2 md:col-span-2 lg:col-span-3">
                <MessageSquare className="w-8 h-8 text-[#D4FF00] mx-auto" />
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">
                  Aún no hay artículos publicados en esta comunidad. ¡Sé el primero en compartir!
                </p>
                <Button size="sm" variant="primary" className="mt-2" onClick={() => setIsMenuOpen(true)}>
                  Crear primera publicación
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuickActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}

