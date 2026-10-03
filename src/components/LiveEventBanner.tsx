"use client";

import React from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDanceContext } from '@/context/DanceContext';

export function LiveEventBanner() {
  const router = useRouter();
  const { liveEvent, totalSessionSteps } = useDanceContext();

  if (!liveEvent) return null;

  return (
    <div className="px-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div 
        onClick={() => router.push(`/events/${liveEvent.id}`)}
        className="relative overflow-hidden rounded-3xl bg-[#14171F] border border-[#D4FF00]/30 shadow-lg shadow-[#D4FF00]/10 cursor-pointer group active:scale-[0.98] transition-all"
      >
        {/* Banner de fondo si existe */}
        {liveEvent.bannerUrl && (
          <>
            <img 
              src={liveEvent.bannerUrl} 
              alt={liveEvent.title}
              className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#14171F] via-[#14171F]/80 to-transparent" />
          </>
        )}
        
        <div className="relative z-10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4FF00]/10 flex items-center justify-center border border-[#D4FF00]/20">
              <Sparkles className="w-5 h-5 text-[#D4FF00]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4FF00] mb-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Estás aquí
              </p>
              <h3 className="text-sm font-bold text-white line-clamp-1">
                ¡Disfruta {liveEvent.title}!
              </h3>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-[#D4FF00] text-black text-xs font-black tracking-widest uppercase">
              {totalSessionSteps} Pasos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
