"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { ConfirmModal } from "@/components/ui/Modal";
import { useNativeBack } from "@/hooks/useNativeBack";

export function CapacitorSetup() {
  const { confirmExit, cancelExit, exit } = useNativeBack();
  useEffect(() => {
    const setupCapacitor = async () => {
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
      }
    };

    setupCapacitor();
  }, []);

  return <ConfirmModal isOpen={confirmExit} onClose={cancelExit} onConfirm={exit}
    title="¿Salir de Root?" message="¿Querés salir de la aplicación?"
    confirmText="Salir" cancelText="Seguir en Root" />;
}
