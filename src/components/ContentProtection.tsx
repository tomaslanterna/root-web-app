"use client";

import { useEffect } from "react";

/** Elementos cuyo contenido es una imagen o un video (incluye flyers dentro de links). */
const MEDIA_SELECTOR = "img, picture, video, canvas, svg";

/**
 * Sin menú de "Guardar imagen" al mantener presionado (iOS) y sin arrastrar imágenes ni links. Los campos de texto
 * conservan su menú. Va en un <style> propio y no en globals.css: el minificador de CSS de Next (lightningcss)
 * borra estos prefijos de proveedor.
 */
const PROTECTION_CSS = `
* { -webkit-touch-callout: none; }
input, textarea, [contenteditable="true"] { -webkit-touch-callout: default; }
img, video, svg, picture, canvas, a { -webkit-user-drag: none; }
`;

function isMedia(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(MEDIA_SELECTOR) !== null;
}

/**
 * Evita guardar o arrastrar imágenes: bloquea el menú contextual sobre imágenes (clic derecho en escritorio y
 * long-press en Android, que ofrece "Descargar imagen") y su arrastre. El menú contextual sobre texto o campos
 * de formulario queda igual. La selección de texto ya está bloqueada en globals.css (salvo en campos).
 *
 * No impide bajar una imagen con las herramientas de desarrollador: solo saca las vías de la interfaz.
 */
export function ContentProtection() {
  useEffect(() => {
    const blockMedia = (event: Event) => {
      if (isMedia(event.target)) event.preventDefault();
    };
    document.addEventListener("contextmenu", blockMedia);
    document.addEventListener("dragstart", blockMedia);
    return () => {
      document.removeEventListener("contextmenu", blockMedia);
      document.removeEventListener("dragstart", blockMedia);
    };
  }, []);

  return (
    <style href="root-content-protection" precedence="default">
      {PROTECTION_CSS}
    </style>
  );
}
