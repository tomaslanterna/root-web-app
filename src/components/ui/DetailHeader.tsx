"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Bookmark, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailHeaderProps {
  onBack?: () => void;
  backAriaLabel?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  titleTrailing?: React.ReactNode;
  onContentClick?: () => void;
  contentAriaLabel?: string;
  children?: React.ReactNode;
  rightActions?: React.ReactNode;
  position?: "fixed" | "sticky";
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
  backAriaLabel = "Volver",
  icon,
  title,
  subtitle,
  titleTrailing,
  onContentClick,
  contentAriaLabel,
  children,
  rightActions,
  position = "fixed",
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
  className,
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
      type="button"
      onClick={handleBack}
      className="w-10 h-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
      aria-label={backAriaLabel}
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
          placeholder="Buscar eventos, usuarios o comunidades..."
          className="bg-transparent border-none outline-none w-full text-sm font-semibold text-white placeholder-neutral-500"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        {searchValue && (
          <button
            type="button"
            onClick={onClearSearch}
            className="p-1 rounded-full hover:bg-white/10 ml-1 shrink-0"
          >
            <span className="text-[10px] text-neutral-400 font-bold uppercase">Limpiar</span>
          </button>
        )}
      </div>
    </div>
  );

  const titleInner = title ? (
    <div className="min-w-0 flex flex-col justify-center text-left">
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="shrink-0 flex items-center">{icon}</span>}
        <h1 className="truncate text-sm sm:text-base font-black uppercase tracking-wider text-white">
          {title}
        </h1>
        {titleTrailing && <span className="shrink-0 flex items-center">{titleTrailing}</span>}
      </div>
      {subtitle && (
        <p className="text-[10px] text-neutral-400 font-bold truncate mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  ) : null;

  const centerContent = isSearch ? (
    search
  ) : children ? (
    <div className="min-w-0 flex-1 pointer-events-auto">{children}</div>
  ) : titleInner ? (
    onContentClick ? (
      <button
        type="button"
        onClick={onContentClick}
        aria-label={contentAriaLabel}
        className="pointer-events-auto min-w-0 flex-1 rounded-2xl px-2 py-1 -mx-1 text-left transition-colors hover:bg-white/5 active:bg-white/10 cursor-pointer"
      >
        {titleInner}
      </button>
    ) : (
      <div className="min-w-0 flex-1 pointer-events-auto">{titleInner}</div>
    )
  ) : null;

  const hasActions = Boolean(rightActions || showSave || showShare);

  const actions = hasActions ? (
    <div className="flex items-center gap-2 pointer-events-auto ml-auto shrink-0">
      {rightActions}
      {showSave && (
        <button
          type="button"
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
          type="button"
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
  ) : null;

  return (
    <header
      className={cn(
        position === "sticky"
          ? "sticky top-0 inset-x-0 z-40 mx-auto w-full max-w-md bg-[#0B0D10]/95 backdrop-blur-xl px-4 pb-3 pt-safe-header flex items-center gap-3 pointer-events-none md:max-w-[1360px]"
          : "fixed top-0 inset-x-0 z-50 mx-auto w-full max-w-md bg-gradient-to-b from-black/85 via-black/45 to-transparent px-4 pb-3 pt-safe-header flex items-center gap-3 pointer-events-none md:max-w-[1360px]",
        className
      )}
    >
      {backButton}
      {centerContent}
      {!isSearch && actions}
    </header>
  );
}
