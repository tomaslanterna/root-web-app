"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import type { Event } from "@/types/events";
import { cn } from "@/lib/utils";

interface SurveyCardProps {
  surveyEvent: Event;
}

export function SurveyCard({ surveyEvent }: SurveyCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={cardRef}
      onClick={() => router.push(`/events/${surveyEvent.id}/survey`)}
      className={cn(
        "relative overflow-hidden w-full shrink-0 snap-center rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-[#14171F] border border-purple-500/30 p-5 md:p-6 cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group shadow-xl shadow-purple-900/20",
        isVisible 
          ? "scale-100 opacity-100 translate-y-0 blur-none" 
          : "scale-[0.70] md:scale-[0.92] opacity-0 md:opacity-60 translate-y-16 md:translate-y-0 blur-sm md:blur-none"
      )}
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
  );
}
