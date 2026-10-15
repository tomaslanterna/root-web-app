"use client";

import React from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useDanceContext } from '@/context/DanceContext';
import { useEventCheckout } from '@/hooks/useReviewReminder';

export function LiveEventBanner() {
  const { liveEvent, totalSessionSteps, attendanceConfirmed } = useDanceContext();
  const checkout = useEventCheckout(liveEvent?.id || "");

  if (!liveEvent) return null;

  return (
    <div className="px-4 pt-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 duration-500">
      <Link
        href="/dance-ranker"
        aria-label={`Dance Ranker - ${liveEvent.title}`}
        className="relative block overflow-hidden rounded-3xl bg-[#14171F] border border-[#D4FF00]/30 shadow-lg shadow-[#D4FF00]/10 cursor-pointer group motion-safe:active:scale-[0.98] transition-colors"
      >
        {/* Banner de fondo si existe */}
        {liveEvent.bannerUrl && (
          <>
            <Image
              src={liveEvent.bannerUrl} 
              alt={liveEvent.title}
              fill
              unoptimized
              sizes="(min-width: 768px) 1000px, 100vw"
              className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#14171F] via-[#14171F]/80 to-transparent" />
          </>
        )}
        
        <div className="relative z-10 p-4 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full bg-[#D4FF00]/10 flex items-center justify-center border border-[#D4FF00]/20">
              <Sparkles className="w-5 h-5 text-[#D4FF00]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4FF00] mb-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Estás aquí
              </p>
              <h3 className="text-sm font-bold text-white line-clamp-1">
                ¡Disfruta {liveEvent.title}!
              </h3>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 ml-2">
            <div className="px-3 py-1.5 rounded-full bg-[#D4FF00] text-black text-xs font-black tracking-widest uppercase">
              {totalSessionSteps} Pasos
            </div>
          </div>
        </div>
      </Link>
      {attendanceConfirmed && <div className="mt-2 text-center"><button type="button" disabled={checkout.isLoading || !!checkout.data} onClick={()=>void checkout.mutate().catch(()=>undefined)} className="min-h-11 text-xs text-neutral-400 underline">{checkout.data ? "Salida confirmada" : checkout.isLoading ? "Confirmando..." : "Terminé mi noche"}</button>{checkout.error && <p role="alert" className="text-xs text-red-400">No pudimos guardar tu salida.</p>}</div>}
    </div>
  );
}
