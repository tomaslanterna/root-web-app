"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogIn, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDanceContext } from "@/context/DanceContext";
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
  const { refreshLiveStatus } = useDanceContext();
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
      if (response.userRsvp === "going") {
        void refreshLiveStatus?.().catch(() => undefined);
      }
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
      {/* Botones Simples y Directos: VOY / NO VOY */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => selectStatus("going")}
          disabled={rsvp.isLoading}
          className={cn(
            "relative flex items-center justify-center gap-2 rounded-2xl border-0 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95",
            status === "going"
              ? "bg-[#D4FF00] text-neutral-950 shadow-[0_8px_30px_rgba(212,255,0,0.16)]"
              : "bg-[#14171F] text-neutral-200 hover:bg-[#1B202B] hover:text-white shadow-sm"
          )}
        >
          <CheckCircle2 className={cn("h-4 w-4 shrink-0 stroke-[2]", status === "going" ? "text-neutral-950" : "text-[#D4FF00]")} />
          <span>Voy</span>
        </button>

        <button
          type="button"
          onClick={() => selectStatus("not_going")}
          disabled={rsvp.isLoading}
          className={cn(
            "relative flex items-center justify-center gap-2 rounded-2xl border-0 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95",
            status === "not_going"
              ? "bg-rose-500 text-white shadow-[0_8px_30px_rgba(244,63,94,0.2)]"
              : "bg-[#14171F] text-neutral-300 hover:bg-[#1B202B] hover:text-white shadow-sm"
          )}
        >
          <XCircle className={cn("h-4 w-4 shrink-0 stroke-[2]", status === "not_going" ? "text-white" : "text-rose-400")} />
          <span>No voy</span>
        </button>
      </div>

      {/* Pulso en Vivo y Porcentaje Comunitario */}
      {showMetrics && totalVotes > 0 && (
        <div className="space-y-1.5 rounded-2xl bg-[#111114] border-0 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="num-display text-xs text-[#D4FF00]">{goingPercentage}%</span>{" "}
              <span className="tech-label text-[9px] text-[#D4FF00]/80">confirmaron</span>
            </div>
            <div>
              <span className="num-display text-xs text-white">{goingCount}</span>{" "}
              <span className="tech-label text-[9px] text-neutral-400">en pista</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4FF00] transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(212,255,0,0.2)]"
              style={{ width: `${goingPercentage}%` }}
            />
          </div>
        </div>
      )}

      {showLogin && !user && (
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4FF00]/40 bg-[#D4FF00]/10 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#D4FF00] hover:bg-[#D4FF00]/20 transition-colors cursor-pointer"
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
