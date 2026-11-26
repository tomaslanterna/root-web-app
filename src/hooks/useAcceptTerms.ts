"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { usersApi } from "@/services/users";
import { TERMS_VERSION } from "@/lib/terms";

/** Acepta los Términos y la Política de privacidad vigentes y actualiza el usuario de la sesión. */
export function useAcceptTerms() {
  const { token, login } = useAuth();
  const [error, setError] = useState("");
  const accept = useMutation(() => usersApi.updateMe({ acceptedTerms: true, termsVersion: TERMS_VERSION }), {
    onSuccess: (updatedUser) => {
      setError("");
      // El backend devuelve el usuario con termsAcceptedAt: con eso la hoja se cierra sola.
      if (token) login(token, updatedUser);
    },
    onError: () => setError("No pudimos guardar tu aceptación. Intentá nuevamente."),
  });
  return { accept, error };
}
