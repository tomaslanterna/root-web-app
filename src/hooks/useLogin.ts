"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { authApi } from "@/services/auth";
import type { AuthResponse } from "@/types/auth";
import { loginDestination } from "@/lib/loginDestination";
import { isFullName } from "@/lib/fullName";

export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const onSuccess = (data: AuthResponse) => {
    login(data.token, data.user);
    // Perfil incompleto (incluye nombre sin apellido, por ejemplo el de Google): primero se completa.
    const incomplete = !data.user.dob || !data.user.documentId || !data.user.country || !isFullName(data.user.name);
    router.push(incomplete ? "/complete-profile" : loginDestination(window.location.search));
  };
  const password = useMutation(authApi.login, {
    onSuccess,
    onError: error => setError(error.response?.status === 401 ? "Credenciales inválidas." : "No pudimos iniciar sesión. Intentá nuevamente."),
  });
  const google = useMutation(authApi.googleLogin, {
    onSuccess,
    onError: () => setError("Falló la autenticación con Google. Por favor intentá nuevamente."),
  });
  return { password, google, error, setError, isLoading: password.isLoading || google.isLoading };
}
