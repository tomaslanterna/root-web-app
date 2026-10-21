"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";

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
    <header className="pointer-events-none sticky inset-x-0 top-0 z-50 mx-auto w-full max-w-md bg-[#0B0D10]/95 px-3 pb-2 pt-safe-header backdrop-blur-xl md:max-w-[1360px] md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00]/70"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onOpenInfo}
          aria-haspopup="dialog"
          aria-expanded={isInfoOpen}
          aria-label={`Ver información de ${name}`}
          className="pointer-events-auto flex h-11 min-w-0 max-w-[calc(100%-3.25rem)] items-center gap-2 rounded-full border border-white/10 bg-black/55 px-4 text-left backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00]/70"
        >
          <span className="min-w-0 truncate text-sm font-extrabold tracking-tight text-white sm:text-base">
            {name}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#D4FF00]" />
        </button>
      </div>
    </header>
  );
}
