"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { authApi } from "@/services/auth";
import { AppleSignInCanceledError, AppleSignInClientError, signInWithApple } from "@/lib/appleSignIn";
import { loginDestination } from "@/lib/loginDestination";
import { needsProfileCompletion } from "@/lib/terms";
import type { AuthResponse } from "@/types/auth";

/** Mensaje según dónde falló: en Apple (app o ventana) o en nuestro servidor. */
export function appleLoginErrorMessage(error: unknown): string {
  if (error instanceof AppleSignInClientError) {
    return "No se pudo abrir el inicio de sesión con Apple. Actualizá la app e intentá nuevamente.";
  }
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  if (status === 503) return "El inicio de sesión con Apple todavía no está disponible.";
  if (status === 401) return "Apple no pudo verificar tu cuenta. Intentá nuevamente.";
  return "Falló el inicio de sesión con Apple. Intentá nuevamente.";
}

/**
 * Login / registro con Apple. Una cuenta nueva (o sin términos aceptados) pasa por /complete-profile, igual que con
 * Google. Si la persona cierra la hoja o la ventana de Apple no se muestra ningún error.
 */
export function useAppleLogin(onError: (message: string) => void) {
  const { login } = useAuth();
  const router = useRouter();
  return useMutation(
    async (): Promise<AuthResponse | null> => {
      try {
        return await authApi.appleLogin(await signInWithApple());
      } catch (error) {
        if (error instanceof AppleSignInCanceledError) return null;
        throw error;
      }
    },
    {
      onSuccess: (data) => {
        if (!data) return;
        login(data.token, data.user);
        router.push(needsProfileCompletion(data.user) ? "/complete-profile" : loginDestination(window.location.search));
      },
      onError: (error) => {
        // El detalle queda en la consola (Safari > Desarrollar en el iPhone) para diagnosticar; no se muestra.
        console.error("Apple sign-in failed", error instanceof AppleSignInClientError ? error.detail : error);
        onError(appleLoginErrorMessage(error));
      },
    },
  );
}
