"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Modal } from "@/components/ui/Modal";

/** true desde 1024 px: en escritorio las hojas se muestran como diálogo centrado. */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

/** Hoja inferior en mobile y diálogo centrado desde 1024 px, con el mismo contenido y pie. */
export function ResponsiveSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  initialHeight = 760,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer: ReactNode;
  /** Alto inicial de la hoja en mobile (px). */
  initialHeight?: number;
}) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" footer={footer}>
        {children}
      </Modal>
    );
  }
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} maxHeightRatio={0.94} initialHeight={initialHeight}>
      <div className="px-5 pt-2 pb-[calc(1rem+var(--root-safe-bottom))] flex flex-col gap-5">
        {children}
        <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-1 bg-surface border-t border-line flex flex-col gap-2">{footer}</div>
      </div>
    </BottomSheet>
  );
}
