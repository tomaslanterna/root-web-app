"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Bookmark, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailHeaderProps {
  onBack?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  showSave?: boolean;
  showShare?: boolean;
  className?: string;
  isSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onClearSearch?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function DetailHeader({ 
  onBack, 
  onShare, 
  onSave, 
  showSave = true, 
  showShare = true,
  isSearch = false,
  searchValue = "",
  onSearchChange,
  onClearSearch,
  searchInputRef,
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

  return (
    <header className={cn("fixed top-0 inset-x-0 z-50 bg-gradient-to-b from-black/80 to-transparent pb-4 pt-4 px-4 flex items-center gap-3 pointer-events-none", className)}>
      <button 
        onClick={handleBack}
        className="w-10 h-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
        aria-label="Volver"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>
      
      {isSearch ? (
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
      ) : (
        <div className="flex gap-2 pointer-events-auto ml-auto">
          {showSave && (
            <button 
              onClick={onSave}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Guardar"
            >
              <Bookmark className="w-4 h-4 text-white" />
            </button>
          )}
          
          {showShare && (
            <button 
              onClick={onShare}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Compartir"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
