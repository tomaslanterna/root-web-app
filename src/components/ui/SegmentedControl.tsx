"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Nombre accesible del grupo, por ejemplo "Vista". */
  label?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex items-center p-[3px] rounded-xl bg-surface border border-line overflow-x-auto hide-scrollbar",
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              "h-[38px] px-3 rounded-[9px] text-[13px] whitespace-nowrap flex items-center gap-1.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent",
              isActive
                ? "bg-ink text-bg font-semibold"
                : "text-ink-2 font-medium hover:text-ink"
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden="true" />}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span className="num-mono text-xs opacity-80">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
