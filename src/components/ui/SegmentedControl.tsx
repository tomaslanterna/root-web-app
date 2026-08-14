"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  theme?: "light" | "electronic";
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  theme = "light",
}: SegmentedControlProps<T>) {
  const isElectronic = theme === "electronic";

  return (
    <div
      className={cn(
        "flex items-center p-1 backdrop-blur-md rounded-full overflow-x-auto hide-scrollbar gap-1",
        isElectronic
          ? "bg-[#14171F]/90 border border-white/10 shadow-md"
          : "bg-neutral-200/50 border border-neutral-200/60",
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 select-none",
              isElectronic
                ? isActive
                  ? "bg-[#D4FF00] text-neutral-950 shadow-md scale-[1.02]"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
                : isActive
                ? "bg-neutral-950 text-white shadow-xs scale-[1.02]"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60"
            )}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                  isElectronic
                    ? isActive
                      ? "bg-neutral-950/20 text-neutral-950"
                      : "bg-white/10 text-neutral-400"
                    : isActive
                    ? "bg-white/20 text-white"
                    : "bg-neutral-300/60 text-neutral-700"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

