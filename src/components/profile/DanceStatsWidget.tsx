"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Loader2, Activity } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis, LabelList } from "recharts";
import { api } from "@/lib/api";

interface DanceSession {
  id: string;
  eventId: string;
  eventTitle: string;
  stepsCount: number;
  startTime: string;
}

export function DanceStatsWidget() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    api.get("/v1/dance/sessions")
      .then((res) => {
        const rawSessions = res.data?.data || [];
        // Agrupar los pasos por eventId
        const aggregatedMap = new Map<string, DanceSession>();

        rawSessions.forEach((session: DanceSession) => {
          if (aggregatedMap.has(session.eventId)) {
            const existing = aggregatedMap.get(session.eventId)!;
            existing.stepsCount += session.stepsCount;
          } else {
            aggregatedMap.set(session.eventId, { ...session });
          }
        });

        const aggregatedSessions = Array.from(aggregatedMap.values());

        // Mostrar todas las fiestas en orden cronológico (las últimas 4 quedan a la derecha)
        setSessions(aggregatedSessions.reverse());
      })
      .catch((err) => console.error("Error fetching sessions for widget:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Posicionar el scroll horizontal al final (derecha) para que se vean las últimas 4 fiestas inicialmente
  useEffect(() => {
    if (isLoading || sessions.length <= 4) return;
    const scrollToEnd = () => {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollLeft = container.scrollWidth;
      }
    };
    scrollToEnd();
    const rafId = requestAnimationFrame(scrollToEnd);
    const timerId = window.setTimeout(scrollToEnd, 60);
    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };
  }, [isLoading, sessions.length]);

  if (isLoading) {
    return (
      <div className="w-full h-28 flex items-center justify-center border-0 bg-[#111114] rounded-3xl shadow-md">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  // If no sessions, we can just return a placeholder or nothing.
  if (sessions.length === 0) {
    return (
      <div 
        onClick={() => router.push("/dance-ranker")}
        className="w-full flex items-center justify-between border-0 bg-[#111114] hover:bg-[#16171D] transition-colors rounded-3xl p-4 cursor-pointer group shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-[#D4FF00] stroke-[1.8]" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black uppercase tracking-wide text-white">Estadísticas de baile</h3>
            <p className="text-xs font-medium text-neutral-400">Aún no hay registros</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = sessions.map((s) => {
    return {
      name: s.eventTitle.replace("Noche de ", "").replace(" en ", " ").substring(0, 10),
      steps: s.stepsCount,
    };
  });
  const maxSteps = Math.max(...chartData.map(d => d.steps), 1);
  const totalSteps = sessions.reduce((acc, s) => acc + s.stepsCount, 0);

  return (
    <div 
      onPointerDown={(e) => {
        pointerStartXRef.current = e.clientX;
        didDragRef.current = false;
      }}
      onPointerMove={(e) => {
        if (pointerStartXRef.current !== null && Math.abs(e.clientX - pointerStartXRef.current) > 8) {
          didDragRef.current = true;
        }
      }}
      onClick={() => {
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        router.push("/dance-ranker");
      }}
      className="relative w-full overflow-hidden bg-[#D4FF00] hover:brightness-105 border-0 transition-all rounded-3xl p-4 sm:p-5 cursor-pointer group shadow-[0_12px_40px_rgba(212,255,0,0.16)]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-black stroke-[2] fill-none" />
            <h3 className="tech-label text-black">Actividad</h3>
          </div>
          <p className="pl-5.5 text-2xl text-black">
            <span className="num-display">{totalSteps.toLocaleString()}</span>{" "}
            <span className="tech-label text-black/70">
              pasos
            </span>
          </p>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="h-24 w-full mt-2 overflow-x-auto hide-scrollbar touch-pan-x overscroll-x-contain"
      >
        <div
          style={{
            width: chartData.length > 4 ? `${(chartData.length / 4) * 100}%` : "100%",
            minWidth: "100%",
            height: "100%",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                interval={0}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#000000", fontSize: 10, fontWeight: 900 }}
                dy={8}
              />
              <Bar dataKey="steps" radius={[8, 8, 8, 8]} maxBarSize={64}>
                <LabelList 
                  dataKey="steps" 
                  position="insideTop" 
                  fill="#D4FF00" 
                  fontSize={9} 
                  offset={6}
                  style={{ fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em' }}
                  formatter={(val: unknown): string => {
                    if (typeof val === "number") {
                      return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toString();
                    }
                    return typeof val === "string" ? val : "";
                  }}
                />
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.steps > maxSteps * 0.7 ? "#000000" : "rgba(0,0,0,0.15)"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
