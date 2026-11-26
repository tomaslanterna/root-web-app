"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useInterests } from "@/hooks/useInterests";
import { InterestsSheet } from "@/components/InterestsSheet";
import { useAuth } from "@/context/AuthContext";
import { needsTermsAcceptance } from "@/lib/terms";

/** Pantallas donde no se pregunta: el ingreso y la carga de datos obligatorios van primero. */
const SKIP = /^\/(login|register|forgot-password|reset-password|complete-profile|kyc)/;

/**
 * Al iniciar sesión, si la persona todavía no respondió sus intereses musicales, sube la hoja para elegirlos.
 * "Ahora no" también cuenta como respuesta: no se vuelve a preguntar (se pueden cambiar desde Configuración).
 */
export function InterestsPrompt() {
  const pathname = usePathname();
  const { answered, options, genres, isSaving, saveInterests } = useInterests();
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  // Primero los Términos (TermsAcceptanceSheet): las dos hojas no se muestran a la vez.
  const pendingTerms = Boolean(user && needsTermsAcceptance(user));

  const open = answered === false && !dismissed && !pendingTerms && !SKIP.test(pathname);
  if (!open) return null;

  return (
    <InterestsSheet
      isOpen
      mode="onboarding"
      options={options}
      initialGenres={genres}
      isSaving={isSaving}
      onSave={saveInterests}
      // Cerrar con la X o deslizando la oculta por esta visita; vuelve a preguntar la próxima vez que entre.
      onClose={() => setDismissed(true)}
    />
  );
}
