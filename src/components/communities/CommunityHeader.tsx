"use client";

import { ChevronRight, Users } from "lucide-react";
import { DetailHeader } from "@/components/ui/DetailHeader";

interface CommunityHeaderProps {
  name: string;
  onBack: () => void;
  onOpenInfo: () => void;
  isInfoOpen: boolean;
}

export function CommunityHeader({
  name,
  onBack,
  onOpenInfo,
  isInfoOpen,
}: CommunityHeaderProps) {
  return (
    <DetailHeader
      position="sticky"
      onBack={onBack}
      backAriaLabel="Volver"
      showSave={false}
      showShare={false}
      data-back-label="Volver"
    >
      <div className="sr-only" aria-label="Volver" />
      <button
        type="button"
        onClick={onOpenInfo}
        aria-haspopup="dialog"
        aria-expanded={isInfoOpen}
        aria-label={`Ver información de ${name}`}
        className="pointer-events-auto flex h-10 min-w-0 max-w-full items-center gap-2 rounded-full border-0 bg-transparent px-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00]/70 cursor-pointer"
      >
        <Users className="h-4 w-4 shrink-0 text-[#D4FF00]" />
        <span className="min-w-0 truncate text-sm sm:text-base font-black uppercase tracking-wider text-white">
          {name}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#D4FF00]" />
      </button>
    </DetailHeader>
  );
}
