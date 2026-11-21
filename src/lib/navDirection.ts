/**
 * Dirección del swipe al cambiar de pantalla (ver `.page-slide` en globals.css):
 * - "forward" (por defecto): la pantalla nueva entra desde la derecha.
 * - "back": la nueva entra desde la izquierda. Se marca al volver (botón atrás del sistema, router.back)
 *   y al tocar una pestaña de la barra que está a la izquierda de la actual.
 * Se guarda en <html data-nav-dir> solo durante la transición.
 */
let timer: ReturnType<typeof setTimeout> | undefined;

export function setNavDirection(direction: "forward" | "back") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.navDir = direction;
  clearTimeout(timer);
  timer = setTimeout(() => {
    delete document.documentElement.dataset.navDir;
  }, 900);
}
