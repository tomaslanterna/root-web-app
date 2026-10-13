"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  readonly?: boolean;
  allowZero?: boolean;
  label?: string;
  className?: string;
  appearance?: "stars" | "circles" | "slider";
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 24,
  readonly = false,
  allowZero = false,
  label = "Puntuación",
  className,
  appearance = "stars",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [interacting, setInteracting] = useState(false);

  if (appearance === "slider") {
    const score = value ?? (readonly ? 0 : 1);
    const hasScore = value !== null || !readonly;
    const active = interacting && !readonly;
    return <div className={cn("min-w-0 space-y-1", className)}>
      <div aria-hidden="true" className="flex items-center justify-center" style={{ height: size * 2.5 }}>
        <Star size={size} strokeWidth={1.5} strokeDasharray={score === 0 ? "1.4 2.8" : undefined}
          className={cn("motion-safe:transition-[transform,color,fill] motion-safe:duration-200 motion-safe:ease-out", score > 0 ? "fill-[#D4FF00] text-[#D4FF00]" : "fill-transparent text-neutral-500")}
          style={{ transform: `scale(${(0.8 + score / max * 1.2) * (active ? 1.06 : 1)})` }} />
      </div>
      <input type="range" min={0} max={max} step={1} value={score} disabled={readonly}
        aria-label={label} aria-valuetext={hasScore ? `${score} de ${max}` : "Sin puntuar"} data-active={active}
        className="star-rating-slider block h-11 w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00]"
        style={{ "--rating-progress": `${score / max * 100}%` } as React.CSSProperties}
        onChange={event => { if (!readonly) onChange?.(Number(event.currentTarget.value)); }}
        onPointerDown={() => { if (!readonly) setInteracting(true); }}
        onPointerUp={event => { setInteracting(false); if (!readonly && value === null) onChange?.(Number(event.currentTarget.value)); }}
        onPointerCancel={() => setInteracting(false)} onFocus={() => { if (!readonly) setInteracting(true); }} onBlur={() => setInteracting(false)}
        onKeyDown={event => {
          if (!readonly && value === null && ["Home", "ArrowLeft", "ArrowDown", "Enter", " "].includes(event.key)) {
            if (event.key === "Enter" || event.key === " ") event.preventDefault();
            onChange?.(event.key === "Enter" || event.key === " " ? score : 0);
          }
        }} />
      <div className="flex items-center justify-between gap-2 text-[10px] leading-4 tabular-nums text-neutral-500"><span>0</span><span className={hasScore ? "text-[#D4FF00]" : undefined}>{hasScore ? `${score}/${max}` : "Sin puntuar"}</span><span>{max}</span></div>
    </div>;
  }

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  const displayValue = hoverValue ?? value ?? 0;
  if (readonly) return <div className={cn("flex items-center gap-1", className)} role="img" aria-label={value === null ? "Sin valoración" : `${value} de ${max} estrellas`}>
    {Array.from({ length: max }, (_, i) => appearance === "circles"
      ? <span key={i} aria-hidden="true" style={{ width: size, height: size }} className={cn("shrink-0 rounded-full border-2", i < (value ?? 0) ? "border-[#D4FF00] bg-[#D4FF00]" : "border-neutral-700")} />
      : <Star key={i} size={size} aria-hidden="true" className={i < (value ?? 0) ? "fill-[#D4FF00] text-[#D4FF00]" : "text-neutral-700"} />)}
  </div>;
  const options = Array.from({ length: max + (allowZero ? 1 : 0) }, (_, i) => i + (allowZero ? 0 : 1));

  const option = (rating: number) => (
        <button
          key={rating}
          type="button"
          role="radio"
          aria-checked={value === rating}
          aria-label={`${rating} de ${max} estrellas`}
          data-rating={rating}
          tabIndex={value === rating || ((value === null || (!allowZero && value === 0)) && rating === options[0]) ? 0 : -1}
          onKeyDown={event => {
            let next: number | undefined;
            if (event.key === "ArrowRight" || event.key === "ArrowUp") next = rating === max ? options[0] : rating + 1;
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = rating === options[0] ? max : rating - 1;
            if (event.key === "Home") next = options[0];
            if (event.key === "End") next = max;
            if (next !== undefined) { event.preventDefault(); setHoverValue(null); onChange?.(next); (event.currentTarget.closest('[role="radiogroup"]') || event.currentTarget.parentElement)?.querySelector<HTMLButtonElement>(`[data-rating="${next}"]`)?.focus(); }
          }}
          onClick={() => handleClick(rating)}
          onMouseEnter={() => handleMouseEnter(rating)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
          className={cn(
            "min-h-11 min-w-9 flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00] motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-95",
            appearance === "circles" && rating > 0 && "flex-1 max-w-11",
            appearance === "circles" && rating === 0 && "mt-1 px-2 text-[11px] min-h-9 font-normal text-neutral-400",
            rating === 0 && "mr-1 border border-white/15 text-sm font-bold",
            rating === 0 && value === 0 && "border-[#D4FF00] text-[#D4FF00]"
          )}
        >
          {rating === 0 ? (appearance === "circles" ? "0 estrellas" : "0") : appearance === "circles" ? <span aria-hidden="true" className={cn("aspect-square w-full rounded-full border border-[#D4FF00] motion-safe:transition-colors motion-safe:duration-200", rating <= displayValue ? "bg-[#D4FF00]" : "bg-[#D4FF00]/10")} /> : <Star
            aria-hidden="true"
            size={size}
            className={cn(
              "transition-colors duration-200",
              rating <= displayValue
                ? "fill-[#D4FF00] text-[#D4FF00]"
                : "fill-neutral-800 text-neutral-700"
            )}
          />}
        </button>
  );
  return (
    <div className={cn(appearance === "circles" ? "space-y-2" : "flex items-center gap-1", className)} role="radiogroup" aria-label={label}>
      {appearance === "circles" ? <><div className="flex items-center justify-between gap-2">{options.filter(rating => rating > 0).map(option)}</div>{allowZero && option(0)}</> : options.map(option)}
    </div>
  );
}
