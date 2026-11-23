"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { RootBootAnimation } from "@/components/brand/RootBootAnimation";

/** La animación arma el logo en menos de 1 s; dejamos ver la cara bailar un rato antes de irnos. */
const MIN_VISIBLE_MS = 3000;
/** Si la página tarda en cargar, no esperamos más de esto. */
const MAX_VISIBLE_MS = 8000;
const FADE_MS = 300;

/**
 * Pantalla de carga al abrir la app: la animación vectorial de root (RootBootAnimation) a pantalla completa.
 * Se renderiza desde el servidor para que sea lo primero que se pinta, y se va con un
 * fundido cuando la página terminó de cargar y pasó el tiempo mínimo.
 */
export function AppSplash() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "gone">("visible");
  const [run, setRun] = useState(false);

  // En la app nativa la "r" del splash se queda hasta que la web hidrata; al ocultarla arranca la animación,
  // que empieza en el mismo ícono que muestra el splash nativo (sin salto):
  // 1) ícono nativo mientras carga la webview, 2) animación web mientras la página hace sus requests.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) void SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
    const frame = requestAnimationFrame(() => setRun(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const startedAt = performance.now();
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let removeTimer: ReturnType<typeof setTimeout> | undefined;

    const hide = () => {
      if (hideTimer) return;
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt));
      hideTimer = setTimeout(() => {
        setPhase("leaving");
        removeTimer = setTimeout(() => setPhase("gone"), FADE_MS);
      }, wait);
    };

    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide, { once: true });
    const fallback = setTimeout(hide, MAX_VISIBLE_MS);

    return () => {
      window.removeEventListener("load", hide);
      clearTimeout(fallback);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      aria-label="Cargando root"
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ease-out motion-reduce:transition-none ${
        phase === "leaving" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <RootBootAnimation run={run} />
    </div>
  );
}
