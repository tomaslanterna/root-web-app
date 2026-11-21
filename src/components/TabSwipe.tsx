"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { setNavDirection } from "@/lib/navDirection";

/**
 * Swipe lateral entre las pestañas de la barra, en el mismo orden que la barra:
 * hacia la izquierda va a la pestaña siguiente y hacia la derecha a la anterior.
 * Solo en las pantallas raíz de cada pestaña; en las internas, deslizar a la derecha es volver (SwipeBack).
 * Nunca abre mensajes: la bandeja se abre solo con su botón.
 */
export function TabSwipe() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const tabs = user?.username
    ? ["/events", "/match", "/communities", `/profile/${user.username}`]
    : ["/events", "/login"];
  const current = pathname === "/profile" && user ? tabs.length - 1 : tabs.indexOf(pathname);
  const onTab = current >= 0;

  const go = (index: number, direction: "forward" | "back") => {
    setNavDirection(direction);
    router.push(tabs[index]);
  };

  // Escuchan en <body>: el gesto vale en toda la pantalla salvo filas con scroll horizontal, campos y capas abiertas.
  const { ref: nextRef } = useHorizontalSwipe(-1, onTab && current < tabs.length - 1, () => go(current + 1, "forward"), undefined, {
    scope: "body",
  });
  const { ref: previousRef } = useHorizontalSwipe(1, onTab && current > 0, () => go(current - 1, "back"), undefined, {
    scope: "body",
  });

  return (
    <>
      <div ref={nextRef} hidden />
      <div ref={previousRef} hidden />
    </>
  );
}
