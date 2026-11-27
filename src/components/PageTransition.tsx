"use client";

import { useLayoutEffect, useState, ViewTransition } from "react";
import { usePathname } from "next/navigation";

/**
 * Transición al cambiar de pantalla: swipe lateral (CSS `.page-slide` en globals.css). Next envuelve cada
 * navegación en una transición de React, así que el cambio de contenido dispara el `update` de este
 * <ViewTransition>. La barra de navegación tiene su propia capa (view-transition-name en BottomNav) que
 * queda quieta encima. La dirección la marca lib/navDirection.ts.
 *
 * Solo se desliza cuando cambia la ruta. Dentro de una misma pantalla, React también usa transiciones para
 * revelar contenido que estaba suspendido: la primera vez que se abre una ruta se ve `loading.tsx`, después el
 * skeleton propio de la página y después el contenido. Si esos cambios también deslizaran, la pantalla entraría
 * dos veces seguidas (pasaba en el detalle del evento y en el perfil).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Ruta que ya está en pantalla. Mientras no coincide con la actual, el commit es una navegación y desliza.
  const [shownPathname, setShownPathname] = useState(pathname);
  const isNavigation = shownPathname !== pathname;

  // Apenas se confirma la navegación, se vuelve a renderizar con update="none". Sin esto, el <ViewTransition>
  // conservaría "page-slide": las revelaciones de Suspense no vuelven a renderizar este componente y React usa
  // la última prop que tuvo.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tiene que pasar justo después del commit de la navegación
    if (isNavigation) setShownPathname(pathname);
  }, [isNavigation, pathname]);

  return (
    <ViewTransition name="page" default="none" update={isNavigation ? "page-slide" : "none"}>
      <div data-page-root className="flex w-full min-w-0 flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
