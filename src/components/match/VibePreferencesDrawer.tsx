"use client";

import React, { useState } from "react";
import { useMatch } from "@/context/MatchContext";
import { VIBE_GENRES, EnergyLevel, AgeRange } from "@/lib/mocks";
import { X, Sparkles, MapPin, Music, ShieldCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function VibePreferencesDrawer() {
  const { vibeProfile, updateVibeProfile, isPreferencesOpen, setIsPreferencesOpen } = useMatch();

  const [genres, setGenres] = useState<string[]>(vibeProfile.favoriteGenres);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(vibeProfile.energyLevel);
  const [ageRange, setAgeRange] = useState<AgeRange>(vibeProfile.ageRange);

  if (!isPreferencesOpen) return null;

  const toggleGenre = (genre: string) => {
    if (genres.includes(genre)) {
      if (genres.length > 1) {
        setGenres(genres.filter((g) => g !== genre));
      }
    } else {
      setGenres([...genres, genre]);
    }
  };

  const handleSave = () => {
    updateVibeProfile({
      favoriteGenres: genres,
      energyLevel,
      ageRange,
    });
    setIsPreferencesOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => setIsPreferencesOpen(false)}
      />

      <div className="relative w-full max-w-md bg-[#14171F] border-t border-x border-white/15 rounded-t-3xl p-5 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl z-10 hide-scrollbar pb-10">
        {/* Header Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4FF00]" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              Tu Perfil de Vibra & Crew
            </h2>
          </div>
          <button
            onClick={() => setIsPreferencesOpen(false)}
            className="p-1.5 rounded-full bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Subgéneros Musicales */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-[#D4FF00]" /> Géneros Favoritos
          </label>
          <div className="flex flex-wrap gap-1.5">
            {VIBE_GENRES.map((genre) => {
              const isSelected = genres.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer select-none",
                    isSelected
                      ? "bg-[#D4FF00] text-neutral-950 shadow-md shadow-[#D4FF00]/20 scale-[1.02]"
                      : "bg-white/5 text-neutral-400 hover:text-white border border-white/10 hover:bg-white/10"
                  )}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Energía / Intensidad de Baile */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Intensidad de Baile
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "full_dance", label: "Full Baile" },
              { id: "social", label: "Social / Tranqui" },
            ].map((p) => {
              const isSelected = energyLevel === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setEnergyLevel(p.id as EnergyLevel)}
                  className={cn(
                    "w-full p-2.5 rounded-2xl text-center transition-all duration-200 border cursor-pointer select-none",
                    isSelected
                      ? "bg-[#D4FF00]/15 border-[#D4FF00]/50 text-white"
                      : "bg-[#0B0D10] border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                  )}
                >
                  <p className="text-xs font-black uppercase tracking-wider">
                    {p.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Rango de Edad */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Rango de Edad
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["18_21", "22_26", "27_33", "34_plus", "any"].map((a) => {
              const label = a === "18_21" ? "18-21" : a === "22_26" ? "22-26" : a === "27_33" ? "27-33" : a === "34_plus" ? "34+" : "Cualquiera";
              const isSelected = ageRange === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAgeRange(a as AgeRange)}
                  className={cn(
                    "p-2 rounded-xl text-center text-[10px] font-extrabold uppercase transition-all duration-200 border cursor-pointer select-none",
                    isSelected
                      ? "bg-[#D4FF00]/15 text-[#D4FF00] border-[#D4FF00]/40 shadow-sm"
                      : "bg-[#0B0D10] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {/* 4. Seguridad KYC */}
        <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-[#D4FF00]/10 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#D4FF00]" />
            <p className="text-xs font-black uppercase tracking-wider text-[#D4FF00]">
              Identidad Validada (KYC)
            </p>
          </div>
          <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
            Por seguridad, todos los usuarios que formen Crews a través de esta funcionalidad
            <span className="text-white font-bold"> ya tienen su identidad validada (KYC) </span>
            obligatoriamente. No te cruzarás con perfiles falsos.
          </p>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-full bg-[#D4FF00] text-neutral-950 font-black uppercase tracking-wider text-xs shadow-lg shadow-[#D4FF00]/20 hover:bg-[#bce400] active:scale-[0.98] transition-all cursor-pointer"
        >
          Guardar Preferencias de Crew
        </button>
      </div>
    </div>
  );
}
