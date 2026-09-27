"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogIn, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { EventRSVPStatus, RSVPResponse } from "@/types/events";

interface EventAttendanceVoteProps {
  eventId: string;
  initialGoing: number;
  initialNotGoing: number;
  initialStatus?: EventRSVPStatus | null;
  onChange?: (response: RSVPResponse) => void;
  className?: string;
  showMetrics?: boolean;
}

export function EventAttendanceVote({
  eventId,
  initialGoing,
  initialNotGoing,
  initialStatus = null,
  onChange,
  className,
  showMetrics = true,
}: EventAttendanceVoteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [goingCount, setGoingCount] = useState(initialGoing);
  const [notGoingCount, setNotGoingCount] = useState(initialNotGoing);
  const [status, setStatus] = useState<EventRSVPStatus | null>(initialStatus);
  const [showLogin, setShowLogin] = useState(false);

  const totalVotes = goingCount + notGoingCount;
  const goingPercentage = totalVotes > 0 ? Math.round((goingCount / totalVotes) * 100) : 0;

  const rsvp = useMutation<RSVPResponse, EventRSVPStatus>(async (nextStatus) => {
    const response = await api.post<RSVPResponse>(`/v1/events/${eventId}/rsvp`, {
      status: nextStatus,
    });
    return response.data;
  }, {
    onSuccess: (response) => {
      setGoingCount(response.goingCount);
      setNotGoingCount(response.notGoingCount);
      setStatus(response.userRsvp);
      onChange?.(response);
    },
  });

  const selectStatus = (nextStatus: EventRSVPStatus) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (!rsvp.isLoading && status !== nextStatus) {
      void rsvp.mutate(nextStatus).catch(() => undefined);
    }
  };

  return (
    <div className={cn("space-y-3.5", className)}>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => selectStatus("going")}
          disabled={rsvp.isLoading}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl border px-3.5 py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95",
            status === "going"
              ? "border-[#D4FF00] bg-[#D4FF00] text-neutral-950 ring-2 ring-[#D4FF00]/40 shadow-lg shadow-[#D4FF00]/20"
              : "border-white/10 bg-[#0B0D10]/80 text-neutral-300 hover:border-[#D4FF00]/50 hover:text-white",
          )}
        >
          <CheckCircle2 className={cn("h-4 w-4 shrink-0", status === "going" ? "text-neutral-950" : "text-[#D4FF00]")} />
          <span>Voy ({goingCount})</span>
        </button>

        <button
          type="button"
          onClick={() => selectStatus("not_going")}
          disabled={rsvp.isLoading}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl border px-3.5 py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95",
            status === "not_going"
              ? "border-rose-500 bg-rose-500 text-white ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/20"
              : "border-white/10 bg-[#0B0D10]/80 text-neutral-300 hover:border-rose-500/50 hover:text-white",
          )}
        >
          <XCircle className={cn("h-4 w-4 shrink-0", status === "not_going" ? "text-white" : "text-rose-400")} />
          <span>No voy ({notGoingCount})</span>
        </button>
      </div>

      {/* Pulso en Vivo y Porcentaje Comunitario */}
      {showMetrics && totalVotes > 0 && (
        <div className="space-y-1.5 rounded-2xl bg-white/[0.02] border border-white/5 p-3">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider">
            <span className="text-[#D4FF00]">{goingPercentage}% confirmaron presencia</span>
            <span className="text-neutral-400">{totalVotes} {totalVotes === 1 ? "voto" : "votos"}</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4FF00] to-lime-300 transition-all duration-500 rounded-full"
              style={{ width: `${goingPercentage}%` }}
            />
          </div>
        </div>
      )}

      {showLogin && !user && (
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4FF00]/40 bg-[#D4FF00]/10 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#D4FF00] hover:bg-[#D4FF00]/20 transition-colors"
        >
          <LogIn className="h-3.5 w-3.5" /> Iniciá sesión para votar
        </button>
      )}

      {rsvp.error && (
        <p className="text-center text-[11px] font-semibold text-rose-400">
          No pudimos guardar tu respuesta. Intentá nuevamente.
        </p>
      )}
    </div>
  );
}
