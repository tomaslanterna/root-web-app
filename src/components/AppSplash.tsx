"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { RootBootAnimation } from "@/components/brand/RootBootAnimation";

/** El cuadrado se expande a pantalla completa y "root" aparece (0,84 s) y baila un poco: el logo siempre se ve entero. */
const MIN_VISIBLE_MS = 2000;
/** Si la página tarda en cargar, no dejamos al usuario esperando más que esto. */
const MAX_VISIBLE_MS = 4500;
const FADE_MS = 300;

/**
 * Pantalla de carga al abrir la app: la animación de root (ver RootBootAnimation). Arranca con el mismo
 * ícono quieto que el splash nativo, se expande hasta pintar TODA la pantalla de lima y aparece "root".
 * Se renderiza desde el servidor para que sea lo primero que se pinta, y se va con un fundido cuando la
 * página terminó de cargar y la animación ya se vio completa.
 */
export function AppSplash() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "gone">("visible");

  // En la app nativa el splash nativo (el ícono quieto) se queda hasta que esta animación ya está pintada:
  // 1) ícono nativo mientras carga la webview, 2) esta animación, que arranca con el mismo cuadro.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const hideNative = () => void SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
    // Dos cuadros: el HTML ya se pintó con la animación en su primer cuadro.
    const frame = requestAnimationFrame(() => requestAnimationFrame(hideNative));
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
      className={`fixed inset-0 z-[100] bg-bg transition-opacity duration-300 ease-out motion-reduce:transition-none ${
        phase === "leaving" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <RootBootAnimation />
    </div>
  );
}
