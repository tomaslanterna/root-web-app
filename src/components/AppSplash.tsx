"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

/** El video revela el logo al segundo 1; dejamos ver la cara un rato antes de irnos. */
const MIN_VISIBLE_MS = 3000;
/** Si la página tarda en cargar, no esperamos más que lo que dura el video (8 s). */
const MAX_VISIBLE_MS = 8000;
const FADE_MS = 300;
/** Fondo del video: oscuro con el ícono hasta 1,05 s, y ahí corta a todo lima. */
const DARK_BG = "#0a0a0c";
const VIDEO_LIME = "#D3EC00";
const LIME_FROM_S = 1.05;

type FrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

/**
 * Pantalla de carga al abrir la app: el video "Root cara de asco" a pantalla completa.
 * Se renderiza desde el servidor para que sea lo primero que se pinta, y se va con un
 * fundido cuando la página terminó de cargar y pasó el tiempo mínimo.
 */
export function AppSplash() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "gone">("visible");
  const [lime, setLime] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // En la app nativa la "r" del splash se queda hasta que el video ya tiene su primer cuadro:
  // 1) "r" nativa mientras carga la webview, 2) loader web (video) mientras la página hace sus requests.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const hideNative = () => void SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
    const video = videoRef.current;
    if (!video || video.readyState >= 2) {
      hideNative();
      return;
    }
    video.addEventListener("loadeddata", hideNative, { once: true });
    video.addEventListener("error", hideNative, { once: true });
    return () => {
      video.removeEventListener("loadeddata", hideNative);
      video.removeEventListener("error", hideNative);
    };
  }, []);

  // Las barras que deja el video en pantallas más altas o más anchas siguen su fondo: oscuro al arrancar, lima después.
  useEffect(() => {
    const video = videoRef.current as FrameVideo | null;
    if (!video) return;
    // Algunos navegadores bloquean el autoplay hasta que el video está listo: lo pedimos de nuevo.
    void video.play().catch(() => undefined);

    // Cuadro a cuadro cuando se puede, así las barras cambian junto con el corte del video;
    // timeupdate queda de respaldo (los callbacks por cuadro se frenan si la vista no se pinta).
    let handle = 0;
    const onFrame = (_: number, meta: { mediaTime: number }) => {
      if (meta.mediaTime >= LIME_FROM_S) setLime(true);
      else handle = video.requestVideoFrameCallback!(onFrame);
    };
    if (video.requestVideoFrameCallback) handle = video.requestVideoFrameCallback(onFrame);

    const sync = () => {
      if (video.currentTime >= LIME_FROM_S) setLime(true);
    };
    video.addEventListener("timeupdate", sync);
    return () => {
      video.removeEventListener("timeupdate", sync);
      if (handle) video.cancelVideoFrameCallback?.(handle);
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
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ease-out motion-reduce:transition-none ${
        phase === "leaving" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: lime ? VIDEO_LIME : DARK_BG }}
    >
      <video
        ref={videoRef}
        src="/brand/root-cara-de-asco.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        disablePictureInPicture
        className="h-full w-full object-contain select-none pointer-events-none"
      />
    </div>
  );
}
