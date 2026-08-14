"use client";

import React from "react";
import { X, Flame, Check, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeControlsProps {
  onPass: () => void;
  onLike: () => void;
  onSuperlike: () => void;
  onOpenPreferences: () => void;
  disabled?: boolean;
}

export function SwipeControls({
  onPass,
  onLike,
  onSuperlike,
  onOpenPreferences,
  disabled = false,
}: SwipeControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-3 select-none">
      {/* 1. Vibe Filter Button */}
      <button
        type="button"
        onClick={onOpenPreferences}
        className="w-12 h-12 rounded-full bg-[#14171F] border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
        title="Ajustar Filtros de Vibra"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {/* 2. Pass / Descartar Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onPass}
        className={cn(
          "w-15 h-15 rounded-full bg-[#14171F] border border-white/15 hover:border-rose-500/50 text-neutral-300 hover:text-rose-500 flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none group"
        )}
        title="Descartar (Pass)"
      >
        <X className="w-7 h-7 stroke-[2.5] transition-transform group-hover:scale-110" />
      </button>

      {/* 3. Super Crew / Flame Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onSuperlike}
        className={cn(
          "w-12 h-12 rounded-full bg-[#14171F] border border-[#D4FF00]/40 text-[#D4FF00] flex items-center justify-center shadow-lg shadow-[#D4FF00]/10 hover:shadow-[#D4FF00]/25 active:scale-90 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none group relative"
        )}
        title="Super Crew (Prioridad)"
      >
        <Flame className="w-6 h-6 fill-[#D4FF00] transition-transform group-hover:scale-110" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D4FF00] animate-ping" />
      </button>

      {/* 4. Like / Crew Match Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onLike}
        className={cn(
          "w-15 h-15 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center shadow-xl shadow-[#D4FF00]/25 hover:bg-[#bce400] active:scale-90 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none group"
        )}
        title="Buscar Crew para este Evento"
      >
        <Check className="w-8 h-8 stroke-[3.5] transition-transform group-hover:scale-110" />
      </button>
    </div>
  );
}
