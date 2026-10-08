"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, Activity, Flame, Trophy, Zap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { api } from "@/lib/api";

/**
 * Calcula las kilocalorías quemadas bailando.
 * Formula: kcal = MET × peso(kg) × tiempo(horas)
 * MET del baile electrónico/intenso ≈ 6.5
 * Pasos por minuto bailando ≈ 120
 */
function calcKcal(steps: number, weightKg = 70): number {
  const MET_DANCE = 6.5;
  const STEPS_PER_MIN = 120;
  const hours = steps / STEPS_PER_MIN / 60;
  return MET_DANCE * weightKg * hours;
}

function stepsToKm(steps: number): number {
  return (steps * 0.75) / 1000;
}

interface DanceSession {
  id: string;
  eventId: string;
  eventTitle: string;
  stepsCount: number;
  startTime: string;
  endTime: string;
  isValidated: boolean;
}

interface ChartPoint {
  time: string;
  steps: number;
}

interface CrewData {
  id: string;
  name: string;
  memberCount: number;
  topSteps: number;
  userRank: number;
}

export default function DanceRankerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"fiestas" | "week" | "month">("fiestas");
  const [sessions, setSessions] = useState<DanceSession[]>([]);
  const [crews, setCrews] = useState<CrewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/v1/dance/sessions"),
      api.get("/v1/crews")
    ])
      .then(([sessionsRes, crewsRes]) => {
        const rawSessions = sessionsRes.data?.data || [];
        // Agrupar los pasos por eventId para no repetir fiestas
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
        setSessions(aggregatedSessions);
        setCrews(crewsRes.data?.data || []);
      })
      .catch((err) => console.error("Error fetching dance data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Build chart data from sessions — group by event for now, or by hour if single event
  const now = new Date();
  
  let chartData: ChartPoint[] = [];

  if (activeTab === "fiestas") {
    // Show last 4 sessions as they are
    const filtered = sessions.slice(0, 4).reverse();
    chartData = filtered.map((s) => ({
      time: s.eventTitle.replace("Noche de ", "").replace(" en ", " ").substring(0, 12),
      steps: s.stepsCount,
    }));
  } else if (activeTab === "week") {
    // Show last 7 days explicitly (e.g., L M M J V S D or day names)
    // Create an array of the last 7 days
    const days: { dateStr: string; time: string; steps: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({
        dateStr: d.toISOString().substring(0, 10),
        time: new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(d).substring(0, 3), // "lun", "mar"
        steps: 0,
      });
    }

    sessions.forEach(s => {
      const sDateStr = s.startTime.substring(0, 10);
      const dayMatch = days.find(d => d.dateStr === sDateStr);
      if (dayMatch) {
        dayMatch.steps += s.stepsCount;
      }
    });

    chartData = days.map(d => ({ time: d.time, steps: d.steps }));
  } else if (activeTab === "month") {
    // Show last 30 days grouped in maybe 4 weeks, or just 30 bars (every 5 days tick)
    // Let's do 30 bars for the last 30 days
    const days: { dateStr: string; time: string; steps: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({
        dateStr: d.toISOString().substring(0, 10),
        time: d.getDate().toString(), // "1", "2", "30"
        steps: 0,
      });
    }

    sessions.forEach(s => {
      const sDateStr = s.startTime.substring(0, 10);
      const dayMatch = days.find(d => d.dateStr === sDateStr);
      if (dayMatch) {
        dayMatch.steps += s.stepsCount;
      }
    });

    chartData = days.map(d => ({ time: d.time, steps: d.steps }));
  }

  const totalSteps = sessions.reduce((acc, s) => acc + s.stepsCount, 0);
  const totalKcal = calcKcal(totalSteps);
  const totalKm = stepsToKm(totalSteps);
  const activeMins = Math.round(totalSteps / 120);
  const maxSteps = Math.max(...chartData.map(d => d.steps), 1);

  const lastPartySteps = sessions.length > 0 ? sessions[0].stepsCount : 0;

  return (
    <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B0D10]/90 backdrop-blur-md px-4 pb-3 pt-safe-header flex items-center justify-between border-b border-white/5">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#D4FF00]" /> Dance Stats
        </h1>
        <div className="w-10" />
      </header>

      <div className="p-4 space-y-6 animate-fade-in">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
            <p className="text-sm font-bold text-neutral-400">Cargando tus estadísticas...</p>
          </div>
        ) : (
          <>

        {/* Hero: steps comparison */}
        <div className="grid grid-cols-2 gap-3 pt-2 pb-2">
          {/* Última fiesta */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#14171F] to-black border border-[#D4FF00]/30 rounded-3xl p-4 shadow-lg shadow-[#D4FF00]/5">
            <p className="text-[10px] font-black tracking-widest text-[#D4FF00] uppercase mb-1">Última fiesta</p>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">
              {lastPartySteps.toLocaleString()}
            </h2>
            <p className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase mt-1">Pasos</p>
          </div>

          {/* Pasos Totales */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#14171F] to-black border border-white/10 rounded-3xl p-4 shadow-lg shadow-black/50">
            <p className="text-[10px] font-black tracking-widest text-neutral-400 uppercase mb-1">Total histórico</p>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">
              {totalSteps.toLocaleString()}
            </h2>
            <p className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase mt-1">Pasos</p>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Kcal */}
          <div className="flex flex-col items-center justify-center bg-[#14171F] border border-[#D4FF00]/20 rounded-2xl p-3 gap-1">
            <Flame className="w-5 h-5 text-[#D4FF00] fill-[#D4FF00]/30" />
            <span className="text-lg font-black text-white">{totalKcal.toFixed(0)}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">kcal</span>
          </div>
          {/* km */}
          <div className="flex flex-col items-center justify-center bg-[#14171F] border border-white/10 rounded-2xl p-3 gap-1">
            <Activity className="w-5 h-5 text-neutral-400" />
            <span className="text-lg font-black text-white">{totalKm.toFixed(1)}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">km</span>
          </div>
          {/* Minutos activos */}
          <div className="flex flex-col items-center justify-center bg-[#14171F] border border-white/10 rounded-2xl p-3 gap-1">
            <Zap className="w-5 h-5 text-neutral-400" />
            <span className="text-lg font-black text-white">{activeMins}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">min activos</span>
          </div>
        </div>

        {/* Formula note */}
        <p className="text-center text-[10px] text-neutral-600 font-medium px-4">
          kcal calculadas con MET 6.5 (baile electrónico intenso) × 70 kg estimados
        </p>

        {/* Chart */}
        <div className="bg-[#D4FF00] border-none rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-black">Actividad</h3>
            <div className="flex items-center gap-2 bg-black/10 p-1 rounded-full border border-black/5">
              {(["fiestas", "week", "month"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${activeTab === tab ? "bg-black text-[#D4FF00]" : "text-black/50 hover:text-black"}`}
                >
                  {tab === "fiestas" ? "Fiestas" : tab === "week" ? "Sem" : "Mes"}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-48 w-full relative">
            {chartData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <Activity className="w-8 h-8 text-black/20 mb-2" />
                <p className="text-xs font-bold text-black/60 uppercase tracking-widest">Sin registros</p>
                <p className="text-[10px] text-black/50 font-medium max-w-[200px] mt-1">No hay fiestas registradas en este período de tiempo.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#000", fontSize: 10, fontWeight: 700 }} dy={10} minTickGap={10} interval="preserveStartEnd" />
                  <Tooltip 
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{ backgroundColor: "#000", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#D4FF00", fontWeight: "bold" }}
                    labelStyle={{ color: "#666", marginBottom: "4px" }}
                  />
                  <Bar dataKey="steps" radius={[8, 8, 8, 8]} maxBarSize={64}>
                    {activeTab === "fiestas" && (
                      <LabelList 
                        dataKey="steps" 
                        position="insideTop" 
                        fill="#D4FF00" 
                        fontSize={11} 
                        offset={8}
                        style={{ fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em' }}
                        formatter={(val: any) => {
                          if (typeof val === "number") {
                            return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toString();
                          }
                          return val;
                        }}
                      />
                    )}
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.steps > maxSteps * 0.7 ? "#000000" : "rgba(0,0,0,0.15)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Crews List */}
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-300 ml-1">Tus Rankings en Crews</h3>
          {crews.length === 0 ? (
            <div 
              onClick={() => router.push('/match')}
              className="bg-gradient-to-r from-neutral-900 to-black border border-white/5 rounded-3xl p-5 cursor-pointer hover:border-white/20 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-neutral-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Unirte a una Crew</h4>
                    <p className="text-xs text-neutral-400 font-medium">Compite con amigos</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-neutral-500 rotate-180 group-hover:text-white transition-all" />
              </div>
            </div>
          ) : (
            crews.map((crew) => (
              <div 
                key={crew.id}
                onClick={() => router.push(`/crews/${crew.id}`)}
                className="bg-gradient-to-r from-neutral-900 to-black border border-[#D4FF00]/20 rounded-3xl p-5 cursor-pointer hover:border-[#D4FF00]/40 transition-all group shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center relative">
                      <Trophy className="w-5 h-5 text-[#D4FF00]" />
                      <div className="absolute -bottom-2 -right-2 bg-[#D4FF00] text-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-black">
                        {crew.userRank}°
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-[#D4FF00] transition-colors">{crew.name}</h4>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{crew.memberCount} miembros</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-neutral-500 rotate-180 group-hover:text-[#D4FF00] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
