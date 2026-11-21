import { ViewTransition } from "react";

/**
 * Transición al cambiar de pantalla: swipe lateral (CSS `.page-slide` en globals.css). Next envuelve cada
 * navegación en una transición de React, así que el cambio de contenido dispara el `update` de este
 * <ViewTransition>. La barra de navegación tiene su propia capa (view-transition-name en BottomNav) que
 * queda quieta encima. La dirección la marca lib/navDirection.ts.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition name="page" default="none" update="page-slide">
      <div data-page-root className="flex w-full min-w-0 flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
