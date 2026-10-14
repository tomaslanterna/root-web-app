"use client";

import { Lock, Sparkles, UserPlus, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CommunityLockedContentProps {
  sectionName?: string;
  membersCount: number;
  onJoin: () => void;
  isJoining: boolean;
  onViewMembers: () => void;
  isLoggedIn: boolean;
}

export function CommunityLockedContent({
  sectionName = "este contenido",
  membersCount,
  onJoin,
  isJoining,
  onViewMembers,
  isLoggedIn,
}: CommunityLockedContentProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-[#111114] p-5 sm:p-8 md:p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-md">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#D4FF00]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-lg space-y-4 sm:space-y-6">
        {/* Lock Icon */}
        <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-0 bg-[#D4FF00]/15 shadow-[0_0_30px_rgba(212,255,0,0.18)]">
          <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-[#D4FF00]" />
        </div>

        {/* Badge & Title */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border-0 bg-[#D4FF00]/15 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#D4FF00] shadow-sm">
            <Sparkles className="h-3 w-3" /> Privacidad de la Comunidad
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Desbloqueá {sectionName}
          </h2>
          <p className="text-xs sm:text-sm font-medium leading-relaxed text-neutral-400">
            Esta sección es exclusiva para miembros de la comunidad. Unite para
            acceder al canal de difusión en vivo, enterarte de primicias en el
            muro y disfrutar los eventos promocionados por el RRPP.
          </p>
        </div>

        {/* Social Proof Teaser */}
        <button
          type="button"
          onClick={onViewMembers}
          className="mx-auto flex items-center gap-3 rounded-full border-0 bg-white/5 px-4 py-2 text-xs font-bold text-neutral-300 shadow-sm transition-all hover:bg-white/10 hover:text-white"
        >
          <div className="flex -space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black bg-neutral-700 text-[9px] font-black text-white">
              🎧
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black bg-[#D4FF00] text-[9px] font-black text-black">
              ⚡
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black bg-neutral-800 text-[9px] font-black text-[#D4FF00]">
              +
            </span>
          </div>
          <span>
            {membersCount} {membersCount === 1 ? "persona ya forma parte" : "personas ya forman parte"}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#D4FF00] underline">
            Ver miembros
          </span>
        </button>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={onJoin}
            disabled={isJoining}
            className="w-full sm:w-auto"
          >
            {isJoining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {!isLoggedIn ? "Iniciá sesión para unirte" : "Unirme a la comunidad"}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onViewMembers}
            className="w-full sm:w-auto"
          >
            <Users className="h-4 w-4" /> Ver directorio de miembros
          </Button>
        </div>
      </div>
    </div>
  );
}
