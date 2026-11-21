"use client";

import React, { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PullToRefresh } from "@/components/ui/PullToRefresh";

/**
 * Pantallas sin el pull to refresh global:
 * - /events tiene el suyo, que recarga destacados y listado sin remontar la página.
 * - Mensajes: la bandeja (ChatList) tiene el suyo, anclado a su header; los chats usan el arrastre para leer lo anterior.
 * - Cámara de KYC y evento en vivo usan el arrastre vertical para otra cosa.
 * - Formularios: refrescar borraría lo que la persona está escribiendo.
 */
const EXCLUDED: RegExp[] = [
  /^\/events\/?$/,
  /^\/chat(\/|$)/,
  /^\/events\/[^/]+\/live/,
  /^\/kyc/,
  /^\/create\//,
  /^\/(login|register|forgot-password|reset-password|complete-profile)/,
];

/** Lo que dura el ícono como mínimo, para que el gesto tenga respuesta aunque la recarga sea instantánea. */
const MIN_REFRESH_MS = 600;

/**
 * Pull to refresh en todas las pantallas: al soltar vuelve a montar la página (sus hooks piden los datos de nuevo)
 * y refresca los componentes de servidor. Los contextos de arriba (sesión, chat en vivo) quedan como están.
 */
export function GlobalPullToRefresh({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [generation, setGeneration] = useState(0);

  const refresh = useCallback(async () => {
    router.refresh();
    setGeneration((value) => value + 1);
    await new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_MS));
  }, [router]);

  if (EXCLUDED.some((pattern) => pattern.test(pathname))) return <>{children}</>;

  return (
    <PullToRefresh onRefresh={refresh} mouse={false}>
      <React.Fragment key={generation}>{children}</React.Fragment>
    </PullToRefresh>
  );
}
