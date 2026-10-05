"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Bookmark, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailHeaderProps {
  onBack?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  isCopied?: boolean;
  showSave?: boolean;
  showShare?: boolean;
  className?: string;
  isSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onClearSearch?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  showBrand?: boolean;
}

export function DetailHeader({ 
  onBack, 
  onShare, 
  onSave, 
  isSaved = false,
  isCopied = false,
  showSave = true, 
  showShare = true,
  isSearch = false,
  searchValue = "",
  onSearchChange,
  onClearSearch,
  searchInputRef,
  showBrand = false,
  className 
}: DetailHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const backButton = (
    <button
      onClick={handleBack}
      className="w-10 h-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
      aria-label="Volver"
    >
      <ArrowLeft className="w-5 h-5 text-white" />
    </button>
  );

  const search = (
    <div className="flex-1 pointer-events-auto">
      <div className="w-full h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center px-4 border border-white/10 focus-within:border-[#D4FF00]/50 transition-colors">
        <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar..."
          className="bg-transparent border-none outline-none w-full text-sm font-semibold text-white placeholder-neutral-500"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        {searchValue && (
          <button onClick={onClearSearch} className="p-1 rounded-full hover:bg-white/10 ml-1 shrink-0">
            <span className="text-[10px] text-neutral-400 font-bold uppercase">Limpiar</span>
          </button>
        )}
      </div>
    </div>
  );

  const actions = (
    <div className="flex gap-2 pointer-events-auto ml-auto">
      {showSave && (
        <button
          onClick={onSave}
          className={cn(
            "w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors cursor-pointer",
            isSaved
              ? "bg-[#D4FF00]/15 border-[#D4FF00]/50 text-[#D4FF00]"
              : "bg-black/40 border-white/10 text-white hover:bg-white/10"
          )}
          aria-label={isSaved ? "Guardado en favoritos" : "Guardar"}
        >
          <Bookmark className={cn("w-4 h-4 transition-all", isSaved && "fill-[#D4FF00]")} />
        </button>
      )}

      {showShare && (
        <button
          onClick={onShare}
          className={cn(
            "w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors cursor-pointer",
            isCopied
              ? "bg-[#D4FF00]/15 border-[#D4FF00]/50 text-[#D4FF00]"
              : "bg-black/40 border-white/10 text-white hover:bg-white/10"
          )}
          aria-label="Compartir"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-[#D4FF00] stroke-[2.5]" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );

  if (showBrand) {
    return (
      <header className={cn("fixed top-0 inset-x-0 z-50 mx-auto w-full max-w-md bg-gradient-to-b from-black/90 via-black/60 to-transparent px-4 pb-4 pt-safe-header pointer-events-none md:max-w-[1360px]", className)}>
        <div className="flex h-9 items-center">
          <Link href="/feed" className="pointer-events-auto flex items-center gap-2" aria-label="Ir al feed de root">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4FF00] text-sm font-black italic tracking-tighter text-neutral-950 shadow-md shadow-[#D4FF00]/15">
              r
            </span>
            <span className="text-xl font-black italic tracking-tighter text-white">root</span>
          </Link>
        </div>
        <div className="mt-2 flex items-center gap-3">
          {backButton}
          {isSearch ? search : actions}
        </div>
      </header>
    );
  }

  return (
    <header className={cn("fixed top-0 inset-x-0 z-50 mx-auto w-full max-w-md bg-gradient-to-b from-black/80 to-transparent pb-4 pt-safe-1 px-4 flex items-center gap-3 pointer-events-none md:max-w-[1360px]", className)}>
      {backButton}
      {isSearch ? search : actions}
    </header>
  );
}
