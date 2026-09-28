"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommunityBanner() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref}
      onClick={() => router.push('/communities')}
      className={cn(
        "relative w-full h-32 sm:h-40 rounded-3xl overflow-hidden cursor-pointer group shadow-lg shadow-black/20 border border-white/10 hover:border-white/20 transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] md:hover:scale-[1.02]",
        isVisible 
          ? "scale-100 opacity-100 translate-y-0 blur-none" 
          : "scale-[0.70] md:scale-[0.92] opacity-0 md:opacity-60 translate-y-16 md:translate-y-0 blur-sm md:blur-none"
      )}
    >
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1974&auto=format&fit=crop")' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent" />
      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-center">
        <span className="w-fit rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#D4FF00] backdrop-blur-md mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Descubrir
        </span>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white drop-shadow-md mb-1 leading-none">
          Comunidades RRPP
        </h2>
        <p className="text-xs text-neutral-300 font-medium max-w-[200px] leading-snug drop-shadow-sm flex items-center gap-1">
          Únete y conecta <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </p>
      </div>
    </div>
  );
}
