"use client";

import React, { useState } from "react";
import { useMatch } from "@/context/MatchContext";
import { VIBE_GENRES, DEPARTURE_ZONES, PARTY_STYLES, PartyStyle } from "@/lib/mocks";
import { X, Sparkles, MapPin, Music, ShieldCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function VibePreferencesDrawer() {
  const { vibeProfile, updateVibeProfile, isPreferencesOpen, setIsPreferencesOpen } = useMatch();

  const [genres, setGenres] = useState<string[]>(vibeProfile.favoriteGenres);
  const [zone, setZone] = useState<string>(vibeProfile.departureZone);
  const [style, setStyle] = useState<PartyStyle>(vibeProfile.partyStyle);
  const [kycOnly, setKycOnly] = useState<boolean>(vibeProfile.verifiedKycOnly);

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
      departureZone: zone,
      partyStyle: style,
      verifiedKycOnly: kycOnly,
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

        {/* 2. Zona Geográfica de Partida */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#D4FF00]" /> Zona de Partida / Previa
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEPARTURE_ZONES.map((z) => {
              const isSelected = zone === z;
              return (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZone(z)}
                  className={cn(
                    "p-2.5 px-3 rounded-2xl text-left text-xs font-extrabold uppercase tracking-wider transition-all duration-200 border cursor-pointer select-none flex items-center justify-between",
                    isSelected
                      ? "bg-[#D4FF00]/15 text-[#D4FF00] border-[#D4FF00]/40 shadow-sm"
                      : "bg-[#0B0D10] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
                  )}
                >
                  <span className="truncate">{z}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#D4FF00] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Estilo de Noche (Party Style) */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Estilo de Noche
          </label>
          <div className="space-y-2">
            {PARTY_STYLES.map((p) => {
              const isSelected = style === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setStyle(p.id)}
                  className={cn(
                    "w-full p-3 rounded-2xl text-left transition-all duration-200 border cursor-pointer select-none flex items-start gap-3",
                    isSelected
                      ? "bg-[#D4FF00]/15 border-[#D4FF00]/50 text-white"
                      : "bg-[#0B0D10] border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                  )}
                >
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-wider text-white">
                      {p.label}
                    </p>
                    <p className="text-[11px] text-neutral-400 font-medium leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#D4FF00] shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Seguridad KYC */}
        <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#D4FF00]" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white">
                Filtro de Seguridad KYC
              </p>
              <p className="text-[10px] text-neutral-400">
                Buscar Crews solo con usuarios verificados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setKycOnly(!kycOnly)}
            className={cn(
              "w-11 h-6 rounded-full transition-colors duration-200 p-0.5 relative cursor-pointer",
              kycOnly ? "bg-[#D4FF00]" : "bg-neutral-800 border border-white/10"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full bg-neutral-950 transition-transform duration-200 shadow-sm",
                kycOnly ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
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
