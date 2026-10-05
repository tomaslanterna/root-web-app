"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Loader2, Activity } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis, LabelList } from "recharts";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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
            // Opcional: mantener el StartTime más antiguo
          } else {
            aggregatedMap.set(session.eventId, { ...session });
          }
        });
        
        const aggregatedSessions = Array.from(aggregatedMap.values());
        
        // Tomar los últimos 4 eventos únicos para el widget
        setSessions(aggregatedSessions.slice(0, 4).reverse());
      })
      .catch((err) => console.error("Error fetching sessions for widget:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-28 flex items-center justify-center border border-white/5 bg-[#14171F] rounded-3xl">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  // If no sessions, we can just return a placeholder or nothing.
  if (sessions.length === 0) {
    return (
      <div 
        onClick={() => router.push("/dance-ranker")}
        className="w-full flex items-center justify-between border border-white/10 bg-[#14171F] hover:bg-white/5 transition-colors rounded-3xl p-4 cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
            <Activity className="w-5 h-5 text-neutral-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-300">Estadísticas de Baile</h3>
            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Aún no hay registros</p>
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
      onClick={() => router.push("/dance-ranker")}
      className="relative w-full overflow-hidden bg-[#D4FF00] hover:bg-[#cbe31c] border-none transition-colors rounded-3xl p-4 sm:p-5 cursor-pointer group shadow-xl"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-black fill-black/20" />
            <h3 className="text-xs font-black uppercase tracking-widest text-black">Actividad</h3>
          </div>
          <p className="text-2xl font-black italic tracking-tighter text-black pl-5.5">
            {totalSteps.toLocaleString()} <span className="text-[10px] text-black/60 font-bold not-italic uppercase tracking-widest">pasos</span>
          </p>
        </div>
      </div>

      <div className="h-24 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#000000", fontSize: 10, fontWeight: 900 }} dy={8} />
            <Bar dataKey="steps" radius={[8, 8, 8, 8]} maxBarSize={64}>
              <LabelList 
                dataKey="steps" 
                position="insideTop" 
                fill="#D4FF00" 
                fontSize={9} 
                offset={6}
                style={{ fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em' }}
                formatter={(val: any) => {
                  if (typeof val === "number") {
                    return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toString();
                  }
                  return val;
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
  );
}
