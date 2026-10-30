"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogIn } from "lucide-react";
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
    <div className={cn("space-y-3", className)}>
      <div role="group" aria-label="¿Vas a ir?" className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={status === "going"}
          onClick={() => selectStatus("going")}
          disabled={rsvp.isLoading}
          className={cn(
            "h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] font-semibold transition-colors duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-accent",
            status === "going"
              ? "bg-accent text-on-accent"
              : "bg-surface-2 text-ink border border-line-strong hover:bg-[#23272D]",
          )}
        >
          <Check className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
          Voy
        </button>
        <button
          type="button"
          aria-pressed={status === "not_going"}
          onClick={() => selectStatus("not_going")}
          disabled={rsvp.isLoading}
          className={cn(
            "h-12 rounded-xl text-[15px] font-semibold transition-colors duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-accent",
            status === "not_going"
              ? "bg-ink text-bg"
              : "bg-surface-2 text-ink border border-line-strong hover:bg-[#23272D]",
          )}
        >
          No voy
        </button>
      </div>

      {showMetrics && totalVotes > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-ink-2">
              <span className="num-mono font-semibold text-accent">{goingPercentage}%</span> confirmaron
            </span>
            <span className="text-ink-2">
              <span className="num-mono font-semibold text-ink">{goingCount}</span> en pista
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-[width] duration-500"
              style={{ width: `${goingPercentage}%` }}
            />
          </div>
        </div>
      )}

      {showLogin && !user && (
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors"
        >
          <LogIn className="size-4" aria-hidden="true" /> Iniciá sesión para votar
        </button>
      )}

      {rsvp.error && (
        <p role="alert" className="text-center text-[13px] text-danger">
          No pudimos guardar tu respuesta. Intentá nuevamente.
        </p>
      )}
    </div>
  );
}
