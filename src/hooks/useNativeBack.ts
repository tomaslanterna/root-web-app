"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { consumeNativeBack, nativeBackDestination, registerNativeBackHandler } from "@/lib/nativeBack";

export function useNativeBackHandler(active: boolean, onBack: () => void) {
  const callback = useRef(onBack);
  useEffect(() => { callback.current = onBack; }, [onBack]);
  useEffect(() => {
    if (!active) return;
    return registerNativeBackHandler(() => callback.current());
  }, [active]);
}

export function useNativeBack() {
  const router = useRouter();
  const [confirmExit, setConfirmExit] = useState(false);
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    let disposed = false;
    let listener: PluginListenerHandle | undefined;
    void App.addListener("backButton", ({ canGoBack }) => {
      if (consumeNativeBack()) return;
      const destination = nativeBackDestination(window.location.pathname, canGoBack);
      if (destination === "confirm-exit") setConfirmExit(true);
      else if (destination === "history-back") router.back();
      else router.replace(destination);
    }).then((handle) => {
      if (disposed) void handle.remove();
      else listener = handle;
    }).catch(() => console.error("No pudimos registrar el botón Back de Android."));
    return () => { disposed = true; void listener?.remove(); };
  }, [router]);

  return {
    confirmExit,
    cancelExit: () => setConfirmExit(false),
    exit: () => { void App.exitApp().catch(() => setConfirmExit(false)); },
  };
}
