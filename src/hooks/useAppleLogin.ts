"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { authApi } from "@/services/auth";
import { AppleSignInCanceledError, signInWithApple } from "@/lib/appleSignIn";
import { loginDestination } from "@/lib/loginDestination";
import { needsProfileCompletion } from "@/lib/terms";
import type { AuthResponse } from "@/types/auth";

/**
 * Login / registro con Apple. Una cuenta nueva (o sin términos aceptados) pasa por /complete-profile, igual que con
 * Google. Si la persona cierra la hoja de Apple no se muestra ningún error.
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
        onError(
          error.response?.status === 503
            ? "El inicio de sesión con Apple todavía no está disponible."
            : "Falló el inicio de sesión con Apple. Intentá nuevamente.",
        );
      },
    },
  );
}
