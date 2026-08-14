"use client";

import * as React from "react";
import { useState } from "react";
import { Check, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventAttendanceVoteProps {
  eventId: string;
  initialGoing?: number;
  initialNotGoing?: number;
  className?: string;
}

export function EventAttendanceVote({
  eventId,
  initialGoing = 142,
  initialNotGoing = 28,
  className,
}: EventAttendanceVoteProps) {
  // Deterministic mock seed based on eventId
  const seed = eventId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseGoing = initialGoing + (seed % 60);
  const baseNotGoing = Math.max(12, initialNotGoing + (seed % 25));

  const [vote, setVote] = useState<"going" | "not-going" | null>(null);

  const goingCount = baseGoing + (vote === "going" ? 1 : 0);
  const notGoingCount = baseNotGoing + (vote === "not-going" ? 1 : 0);
  const totalVotes = goingCount + notGoingCount;

  const goingPercentage = Math.round((goingCount / totalVotes) * 100);
  const notGoingPercentage = 100 - goingPercentage;

  const handleVote = (selected: "going" | "not-going") => {
    if (vote === selected) {
      setVote(null); // toggle off
    } else {
      setVote(selected);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* 2 Compact Attendance Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Voy Button */}
        <button
          type="button"
          onClick={() => handleVote("going")}
          className={cn(
            "flex items-center justify-center gap-2 py-2 px-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 select-none cursor-pointer border shadow-sm",
            vote === "going"
              ? "bg-[#D4FF00] text-neutral-950 border-[#D4FF00] shadow-md shadow-[#D4FF00]/20 scale-[1.02]"
              : "bg-[#14171F] text-white border-white/15 hover:border-white/30 hover:bg-[#1B202B]"
          )}
        >
          <Check
            className={cn(
              "w-4 h-4 stroke-[3] transition-transform duration-200",
              vote === "going" ? "text-neutral-950 scale-110" : "text-[#D4FF00]"
            )}
          />
          <span>Voy</span>
        </button>

        {/* No voy Button */}
        <button
          type="button"
          onClick={() => handleVote("not-going")}
          className={cn(
            "flex items-center justify-center gap-2 py-2 px-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 select-none cursor-pointer border shadow-sm",
            vote === "not-going"
              ? "bg-white/20 text-white border-white/40 shadow-md scale-[1.02]"
              : "bg-[#14171F] text-neutral-300 border-white/10 hover:border-white/25 hover:text-white hover:bg-[#1B202B]"
          )}
        >
          <X
            className={cn(
              "w-4 h-4 stroke-[3] transition-transform duration-200",
              vote === "not-going" ? "text-white scale-110" : "text-neutral-400"
            )}
          />
          <span>No voy</span>
        </button>
      </div>

      {/* Comparative Percentage Progress Bar & Stats (Compact & Sleek) */}
      <div className="bg-[#14171F]/90 backdrop-blur-md rounded-2xl p-2 px-3 border border-white/10 space-y-1.5 shadow-sm">
        {/* Visual Dual-color Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-neutral-800 flex items-center p-0.5 border border-white/5">
          <div
            className="h-full bg-[#D4FF00] rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${goingPercentage}%` }}
          />
          <div
            className="h-full bg-neutral-600/70 rounded-full transition-all duration-500 ease-out ml-0.5"
            style={{ width: `${notGoingPercentage}%` }}
          />
        </div>

        {/* Labels and Percentage Badges */}
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
          <span className="flex items-center gap-1 text-[#D4FF00]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
            <span>{goingPercentage}% Voy</span>
            <span className="text-neutral-500 font-semibold">({goingCount})</span>
          </span>

          <span className="text-neutral-500 font-bold flex items-center gap-1 text-[9px]">
            <Users className="w-3 h-3 text-neutral-400" />
            <span>{totalVotes} votos</span>
          </span>

          <span className="flex items-center gap-1 text-neutral-400">
            <span className="text-neutral-500 font-semibold">({notGoingCount})</span>
            <span>{notGoingPercentage}% No voy</span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
          </span>
        </div>
      </div>
    </div>
  );
}
