/**
 * Dirección del swipe al cambiar de pantalla (ver `.page-slide` en globals.css):
 * - "forward" (por defecto): la pantalla nueva entra desde la derecha.
 * - "back": la nueva entra desde la izquierda. Se marca al volver (botón atrás del sistema, router.back)
 *   y al tocar una pestaña de la barra que está a la izquierda de la actual.
 * Se guarda en <html data-nav-dir> solo durante la transición.
 */
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Para una pantalla que ya se anima sola al abrirse o cerrarse (la bandeja de mensajes, el gesto de volver): evita
 * que la transición global de PageTransition y la de NavigationTracker se sumen encima y la pantalla "salte".
 * Reusa la clase `root-swipe-back`, que globals.css ya usa para apagar esas transiciones.
 */
export function skipPageTransition(ms = 1000) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.add("root-swipe-back");
  setTimeout(() => root.classList.remove("root-swipe-back"), ms);
}

export function setNavDirection(direction: "forward" | "back") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.navDir = direction;
  clearTimeout(timer);
  timer = setTimeout(() => {
    delete document.documentElement.dataset.navDir;
  }, 900);
}
