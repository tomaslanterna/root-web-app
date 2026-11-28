"use client";

import { useKycGate } from "@/context/KycGateContext";

/**
 * Para los puntos de entrada de subir un after o mandar un evento: `requireKyc(() => router.push(...))`.
 * Sin sesión lleva a /login; sin identidad verificada abre la hoja "Verificá tu identidad" en lugar de navegar.
 */
export function useRequireKyc() {
  return useKycGate().requireKyc;
}

export { useKycGate };
