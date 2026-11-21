"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Pila de rutas visitadas dentro de la app en esta pestaña. Sirve para saber si "volver" tiene adónde ir:
// si la persona entró directo por un link (o la app recién abrió), no hay pantalla previa y se usa el fallback.
const stack: string[] = [];

function track(path: string) {
  if (stack[stack.length - 1] === path) return;
  if (stack[stack.length - 2] === path) stack.pop(); // fue un "atrás"
  else stack.push(path);
}

/** Registra cada cambio de pantalla. Se monta una sola vez en el layout raíz. */
export function useTrackNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    track(pathname);
  }, [pathname]);
}

/**
 * Volver a la pantalla previa de la app. Si no hay una (link directo, app recién abierta), va a `fallback`.
 */
export function useBackNavigation(fallback = "/events") {
  const router = useRouter();
  return useCallback(() => {
    if (stack.length > 1) router.back();
    else router.push(fallback);
  }, [router, fallback]);
}
