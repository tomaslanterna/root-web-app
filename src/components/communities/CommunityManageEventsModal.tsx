"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  Check,
  CheckSquare,
  Loader2,
  MapPin,
  Music,
  Search,
  Square,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Event } from "@/types/events";
import { cn } from "@/lib/utils";
import { parseEventRealDate } from "@/hooks/useDanceSync";

interface CommunityManageEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: Event[];
  selectedEventIds: string[];
  onSave: (selectedIds: string[]) => Promise<void>;
  isSaving: boolean;
}

export function CommunityManageEventsModal({
  isOpen,
  onClose,
  catalog,
  selectedEventIds,
  onSave,
  isSaving,
}: CommunityManageEventsModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedEventIds);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync initial selection when modal opens
  const handleOpenInit = () => {
    setSelected(selectedEventIds);
    setSearchQuery("");
  };

  const toggleEvent = (eventId: string) => {
    setSelected((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId],
    );
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const q = searchQuery.toLowerCase();
    return catalog.filter(
      (evt) =>
        evt.title.toLowerCase().includes(q) ||
        evt.location.toLowerCase().includes(q) ||
        evt.genre?.toLowerCase().includes(q) ||
        evt.lineup?.some((artist) => artist.toLowerCase().includes(q)),
    );
  }, [catalog, searchQuery]);

  const handleSave = async () => {
    await onSave(selected);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Eventos Promocionados"
      footer={
        <div className="flex items-center justify-between w-full gap-3 pt-3 border-t border-white/[0.06]">
          <span className="text-xs font-bold text-neutral-400">
            {selected.length} {selected.length === 1 ? "evento seleccionado" : "eventos seleccionados"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Guardar cambios
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-neutral-400 leading-relaxed">
          Seleccioná los eventos de música electrónica de la plataforma que
          deseás asociar y destacar dentro de tu comunidad.
        </p>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por evento, club, DJ..."
            className="h-10 w-full rounded-2xl border-0 bg-[#0B0D10] pl-10 pr-4 text-xs font-medium text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-[#D4FF00]/50 outline-none shadow-sm"
          />
        </div>

        {/* Events list */}
        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">No encontramos eventos que coincidan</p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isSelected = selected.includes(evt.id);

              return (
                <div
                  key={evt.id}
                  onClick={() => toggleEvent(evt.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border-0 cursor-pointer transition-all select-none shadow-sm",
                    isSelected
                      ? "bg-[#D4FF00]/15 ring-1 ring-[#D4FF00]/50"
                      : "bg-white/[0.04] hover:bg-white/[0.08]",
                  )}
                >
                  <div className="text-[#D4FF00] shrink-0">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 fill-[#D4FF00]/20" />
                    ) : (
                      <Square className="h-5 w-5 text-neutral-600" />
                    )}
                  </div>

                  {evt.cinematicBannerUrl && (
                    <div className="relative h-12 w-16 overflow-hidden rounded-xl shrink-0 bg-neutral-900">
                      <Image
                        src={evt.cinematicBannerUrl}
                        alt={evt.title}
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black uppercase text-white">
                      {evt.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-neutral-500" />
                        {parseEventRealDate(evt.date).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span>•</span>
                      <span className="truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-neutral-500" />
                        {evt.location}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
