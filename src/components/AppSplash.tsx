"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

/** Una vuelta completa del GIF (48 cuadros, 1,92 s): el logo siempre termina su animación. */
const MIN_VISIBLE_MS = 1920;
/** Si la página tarda en cargar, no dejamos al usuario esperando más que esto. */
const MAX_VISIBLE_MS = 4000;
const FADE_MS = 300;

/**
 * Pantalla de carga al abrir la app: el logo animado de root a pantalla completa.
 * Se renderiza desde el servidor para que sea lo primero que se pinta, y se va con un
 * fundido cuando la página terminó de cargar y el GIF dio al menos una vuelta.
 */
export function AppSplash() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "gone">("visible");
  const gifRef = useRef<HTMLImageElement>(null);

  // En la app nativa la "r" del splash se queda hasta que este loader ya está pintado:
  // 1) "r" nativa mientras carga la webview, 2) loader web (GIF) mientras la página hace sus requests.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const hideNative = () => void SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
    const gif = gifRef.current;
    if (!gif || gif.complete) {
      hideNative();
      return;
    }
    gif.addEventListener("load", hideNative, { once: true });
    gif.addEventListener("error", hideNative, { once: true });
    return () => {
      gif.removeEventListener("load", hideNative);
      gif.removeEventListener("error", hideNative);
    };
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
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0c] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
        phase === "leaving" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- GIF animado: next/image lo congelaría al optimizarlo */}
      <img
        ref={gifRef}
        src="/brand/root-loader.gif"
        alt=""
        width={960}
        height={640}
        fetchPriority="high"
        className="w-[min(80vw,420px)] h-auto select-none"
        draggable={false}
      />
    </div>
  );
}
