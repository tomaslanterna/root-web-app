"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { ConfirmModal } from "@/components/ui/Modal";
import { useNativeBack } from "@/hooks/useNativeBack";
import { resolveDeepLinkPath } from "@/lib/deepLinks";

export function CapacitorSetup() {
  const router = useRouter();
  const { confirmExit, cancelExit, exit } = useNativeBack();
  useEffect(() => {
    let urlListener: PluginListenerHandle | undefined;
    let disposed = false;

    const handleIncomingUrl = (url?: string) => {
      if (!url) return;
      const targetPath = resolveDeepLinkPath(url);
      if (targetPath) {
        router.push(targetPath);
      }
    };

    const setupCapacitor = async () => {
      if (typeof window !== "undefined") {
        const platform = Capacitor.getPlatform();
        const isIOS =
          platform === "ios" ||
          /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        if (isIOS) {
          document.documentElement.classList.add("platform-ios");
        } else if (platform === "android" || /android/i.test(navigator.userAgent)) {
          document.documentElement.classList.add("platform-android");
        }
      }

      if (Capacitor.isNativePlatform()) {
        try {
          // Asegurar que los íconos de la barra (batería, hora) sean blancos (Dark mode)
          await StatusBar.setStyle({ style: Style.Dark });
          
          // En Android, pintar el fondo de la barra para que coincida con el tema
          if (Capacitor.getPlatform() === "android") {
            await StatusBar.setBackgroundColor({ color: "#0B0D10" });
          }
        } catch (e) {
          console.error("Error setting up StatusBar", e);
        }

        try {
          const handle = await App.addListener("appUrlOpen", (event) => {
            handleIncomingUrl(event.url);
          });
          if (disposed) {
            void handle.remove();
          } else {
            urlListener = handle;
          }

          const launchUrl = await App.getLaunchUrl();
          if (launchUrl?.url) {
            handleIncomingUrl(launchUrl.url);
          }
        } catch (e) {
          console.error("Error setting up deep links", e);
        }
      }
    };

    void setupCapacitor();

    return () => {
      disposed = true;
      void urlListener?.remove();
    };
  }, [router]);

  return <ConfirmModal isOpen={confirmExit} onClose={cancelExit} onConfirm={exit}
    title="¿Salir de Root?" message="¿Querés salir de la aplicación?"
    confirmText="Salir" cancelText="Seguir en Root" />;
}
