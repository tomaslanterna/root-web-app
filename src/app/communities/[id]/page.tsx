"use client";

import { useState, use } from "react";
import { MOCK_COMMUNITIES, MOCK_POSTS } from "@/lib/mocks";
import { PostCard } from "@/components/ui/PostCard";
import { Button } from "@/components/ui/Button";
import { QuickActionMenu } from "@/components/ui/QuickActionMenu";
import { Users, UserPlus, ArrowLeft, Plus, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
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
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 glass-header-obsidian px-4 py-3 flex items-center justify-between">
        <Link
          href="/communities"
          className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center gap-1 text-xs font-bold uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Comunidades</span>
        </Link>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#D4FF00]">Feed de Comunidad</span>
      </div>

      {/* Community Header Banner */}
      <div className="relative w-full h-48 sm:h-56 bg-neutral-950 overflow-hidden">
        <img
          src={community.coverImageUrl}
          alt={community.name}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-neutral-950/40 to-transparent" />
        
        <div className="absolute bottom-4 inset-x-4 space-y-1 text-white">
          <span className="px-3 py-1 rounded-full bg-[#D4FF00]/20 backdrop-blur-md text-[#D4FF00] text-[10px] font-extrabold uppercase tracking-widest border border-[#D4FF00]/30">
            {community.membersCount + (isJoined ? 1 : 0)} Miembros
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight">
            {community.name}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Actions & Description */}
        <div className="p-5 rounded-3xl bg-[#14171F] border border-white/10 shadow-lg space-y-4">
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
            {community.description}
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant={isJoined ? "outline" : "primary"}
              className="flex-1 gap-2"
              onClick={() => setIsJoined(!isJoined)}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isJoined ? "Miembro Activo ✓" : "Unirse a la Comunidad"}</span>
            </Button>

            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setIsMenuOpen(true)}
            >
              <Plus className="w-4 h-4 text-[#D4FF00]" />
              <span className="hidden sm:inline">Publicar</span>
            </Button>
          </div>
        </div>

        {/* Community Exclusive Feed Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" /> Publicaciones en {community.name}
          </h2>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4FF00]">
            {communityPosts.length} POSTS
          </span>
        </div>

        {/* Community Exclusive Feed */}
        <div className="space-y-4">
          {communityPosts.length > 0 ? (
            communityPosts.map((post) => <PostCard key={post.id} post={post} variant="electronic" />)
          ) : (
            <div className="py-12 text-center bg-[#14171F] rounded-3xl border border-white/10 p-6 space-y-2">
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

      <QuickActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}

