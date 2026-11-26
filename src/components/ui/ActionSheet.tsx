"use client";

import type { ReactNode } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { cn } from "@/lib/utils";

export interface ActionSheetAction {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Acción que no se deshace fácil (bloquear, denunciar): se muestra en rojo. */
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: ActionSheetAction[];
}

const ROW_HEIGHT = 56;

/** Menú de acciones (⋯) que sube desde abajo. Al elegir una, se cierra y después corre la acción. */
export function ActionSheet({ isOpen, onClose, title, actions }: ActionSheetProps) {
  // Asa + encabezado + filas + margen inferior (el área segura se suma con padding).
  const height = 24 + (title ? 60 : 0) + actions.length * (ROW_HEIGHT + 4) + 56;
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      hideHeader={!title}
      ariaLabel={title || "Acciones"}
      initialHeight={height}
      minHeight={Math.min(height, 280)}
      bodyClassName="px-3 pt-1"
    >
      <ul role="menu" aria-label={title || "Acciones"} className="m-0 p-0 list-none flex flex-col gap-1">
        {actions.map((action) => (
          <li key={action.id} role="none">
            <button
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                onClose();
                action.onSelect();
              }}
              className={cn(
                "w-full h-14 px-3 flex items-center gap-3 rounded-control text-left text-[15px] font-semibold transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent",
                action.destructive ? "text-danger hover:bg-danger/10" : "text-ink hover:bg-surface-2",
              )}
            >
              {action.icon && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-9 shrink-0 rounded-full flex items-center justify-center [&>svg]:size-[18px]",
                    action.destructive ? "bg-danger/10" : "bg-surface-2",
                  )}
                >
                  {action.icon}
                </span>
              )}
              <span className="min-w-0 truncate">{action.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
