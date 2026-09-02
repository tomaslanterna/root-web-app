"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogIn, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { cn } from "@/lib/utils";
import { eventsApi } from "@/services/events";
import type { EventRSVPStatus, RSVPResponse } from "@/types/events";

interface EventAttendanceVoteProps {
  eventId: string;
  initialGoing: number;
  initialNotGoing: number;
  initialStatus?: EventRSVPStatus | null;
  onChange?: (response: RSVPResponse) => void;
}

export function EventAttendanceVote({
  eventId,
  initialGoing,
  initialNotGoing,
  initialStatus = null,
  onChange,
}: EventAttendanceVoteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [goingCount, setGoingCount] = useState(initialGoing);
  const [notGoingCount, setNotGoingCount] = useState(initialNotGoing);
  const [status, setStatus] = useState<EventRSVPStatus | null>(initialStatus);
  const [showLogin, setShowLogin] = useState(false);

  const rsvp = useMutation<RSVPResponse, EventRSVPStatus | null>(async (nextStatus) => {
    if (nextStatus === null) {
      return eventsApi.clearEventRsvp(eventId);
    }
    return eventsApi.rsvpEvent(eventId, nextStatus);
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
    if (!rsvp.isLoading) {
      void rsvp.mutate(status === nextStatus ? null : nextStatus).catch(() => undefined);
    }
  };

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-[#14171F] p-4 shadow-lg">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => selectStatus("going")}
          disabled={rsvp.isLoading}
          aria-pressed={status === "going"}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-wider transition-all",
            status === "going"
              ? "border-[#D4FF00] bg-[#D4FF00] text-neutral-950 ring-2 ring-[#D4FF00]/30"
              : "border-white/10 bg-[#0B0D10] text-neutral-300 hover:border-[#D4FF00]/50 hover:text-white",
          )}
        >
          <CheckCircle2 className="h-4 w-4" /> Voy ({goingCount})
        </button>
        <button
          type="button"
          onClick={() => selectStatus("not_going")}
          disabled={rsvp.isLoading}
          aria-pressed={status === "not_going"}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-wider transition-all",
            status === "not_going"
              ? "border-rose-500 bg-rose-500 text-white ring-2 ring-rose-500/30"
              : "border-white/10 bg-[#0B0D10] text-neutral-300 hover:border-rose-500/50 hover:text-white",
          )}
        >
          <XCircle className="h-4 w-4" /> No voy ({notGoingCount})
        </button>
      </div>

      {showLogin && !user && (
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4FF00]/30 bg-[#D4FF00]/10 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#D4FF00]"
        >
          <LogIn className="h-3.5 w-3.5" /> Iniciá sesión para responder
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
