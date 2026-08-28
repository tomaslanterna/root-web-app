"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, ShieldCheck, UserCheck, Users, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { api } from "@/lib/api";
import type { EventAttendee, PaginatedResponse } from "@/types/events";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface FollowedAttendeesModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  totalGoingCount: number;
}

const pageSize = 20;

export function FollowedAttendeesModal({
  eventId,
  isOpen,
  onClose,
  totalGoingCount,
}: FollowedAttendeesModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const {
    mutate: fetchAttendees,
    isLoading: isLoadingAttendees,
    error: attendeesError,
  } = useMutation<PaginatedResponse<EventAttendee>, number>(
    async (offset) => {
      const response = await api.get<PaginatedResponse<EventAttendee>>(
        `/v1/events/${eventId}/attendees/followed`,
        { params: { limit: pageSize, offset } },
      );
      return response.data;
    },
    {
      onSuccess: (response, offset) => {
        setAttendees((current) => (offset === 0 ? response.data : [...current, ...response.data]));
        setTotal(response.meta.total);
        setHasMore(response.meta.hasMore);
        setHasLoaded(true);
      },
      onError: () => setHasLoaded(true),
    },
  );

  useEffect(() => {
    if (isOpen && user) {
      void fetchAttendees(0).catch(() => undefined);
    }
  }, [eventId, fetchAttendees, isOpen, user]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Personas que seguís y van al evento"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#14171F] shadow-2xl sm:max-w-md sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#0B0D10]/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4FF00]/15 text-[#D4FF00]">
              <UserCheck className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Personas que seguís
              </h3>
              <p className="text-[11px] font-semibold text-neutral-400">
                {totalGoingCount} personas van en total · {total} conocidas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full bg-white/5 p-2 text-neutral-400 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {!user ? (
            <div className="space-y-4 py-10 text-center">
              <LogIn className="mx-auto h-8 w-8 text-[#D4FF00]" />
              <p className="text-xs font-semibold text-neutral-300">
                Iniciá sesión para ver cuáles de las personas que seguís van.
              </p>
              <Button onClick={() => router.push("/login")} size="sm">
                Iniciar sesión
              </Button>
            </div>
          ) : !hasLoaded && isLoadingAttendees ? (
            <div className="flex flex-col items-center gap-2 py-10 text-neutral-400">
              <Loader2 className="h-6 w-6 animate-spin text-[#D4FF00]" />
              <span className="text-xs font-semibold">Cargando personas...</span>
            </div>
          ) : attendeesError && attendees.length === 0 ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-xs font-semibold text-rose-400">No pudimos cargar la lista.</p>
              <Button size="sm" variant="outline" onClick={() => void fetchAttendees(0)}>
                Reintentar
              </Button>
            </div>
          ) : attendees.length > 0 ? (
            attendees.map((attendee) => (
              <article
                key={attendee.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#0B0D10]/60 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    src={attendee.avatarUrl}
                    fallback={attendee.name}
                    size="md"
                    className="border-white/10 bg-neutral-800"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs font-black text-white">{attendee.name}</span>
                      {attendee.isKycVerified && (
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#D4FF00]" />
                      )}
                    </div>
                    <span className="block truncate text-[11px] font-semibold text-neutral-400">
                      @{attendee.username}
                    </span>
                  </div>
                </div>
                <span className="ml-2 flex shrink-0 items-center gap-1 rounded-full border border-[#D4FF00]/20 bg-[#D4FF00]/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#D4FF00]">
                  <UserCheck className="h-3 w-3" /> Va
                </span>
              </article>
            ))
          ) : (
            <div className="space-y-2 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-neutral-500">
                <Users className="h-6 w-6" />
              </span>
              <p className="text-xs font-bold text-neutral-300">
                Nadie que seguís marcó “Voy” todavía.
              </p>
              <p className="text-[11px] text-neutral-500">
                El total general incluye a todas las personas, aunque no aparezcan acá.
              </p>
            </div>
          )}

          {user && hasMore && (
            <Button
              type="button"
              variant="outline"
              size="full"
              disabled={isLoadingAttendees}
              onClick={() => void fetchAttendees(attendees.length)}
            >
              {isLoadingAttendees ? "Cargando..." : "Cargar más personas"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
