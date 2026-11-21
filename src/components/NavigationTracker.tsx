"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTrackNavigation } from "@/hooks/useBackNavigation";
import { setNavDirection } from "@/lib/navDirection";

const SLIDE = { duration: 340, easing: "cubic-bezier(0.32, 0.72, 0, 1)" };

/**
 * Lleva la cuenta de las pantallas visitadas para que "volver" sepa si hay una pantalla previa,
 * y anima las vueltas atrás.
 *
 * Hacia adelante el swipe lo hace el View Transition de PageTransition. Al volver (botón del sistema o
 * router.back) Next no corre una transición, así que acá la pantalla nueva entra desde la izquierda en
 * cuanto cambia la ruta. La barra de navegación queda quieta. Si la vuelta fue con el gesto (SwipeBack), ese ya animó: no se suma.
 */
export function NavigationTracker() {
  useTrackNavigation();
  const pathname = usePathname();
  const previous = useRef(pathname);
  // Solo las vueltas del historial (popstate) se animan acá; los toques en la barra ya usan el View Transition.
  const popped = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      popped.current = true;
      setNavDirection("back");
    };
    window.addEventListener("popstate", onPopState, { capture: true });
    return () => window.removeEventListener("popstate", onPopState, { capture: true });
  }, []);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    const wasPop = popped.current;
    popped.current = false;
    const root = document.documentElement;
    if (!wasPop || root.classList.contains("root-swipe-back")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // `translate` (y no `transform`): no pisa transforms propios de la pantalla.
    document
      .querySelector<HTMLElement>("[data-page-root]")
      ?.animate([{ translate: "-28% 0", opacity: 0.6 }, { translate: "0 0", opacity: 1 }], SLIDE);
  }, [pathname]);

  return null;
}
