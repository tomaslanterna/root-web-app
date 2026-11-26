"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

/** "Acepto los Términos y la Política de privacidad": obligatorio para registrarse o completar el perfil. */
export function TermsCheckbox({ checked, onChange, id = "accept-terms" }: TermsCheckboxProps) {
  return (
    <div className="flex items-start gap-3 px-1">
      <span className="relative mt-0.5 size-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          name="acceptedTerms"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 size-5 cursor-pointer appearance-none rounded-md border border-line-strong bg-surface-2 transition-colors checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <Check
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0 m-auto size-3.5 text-on-accent transition-opacity", checked ? "opacity-100" : "opacity-0")}
          strokeWidth={3}
        />
      </span>
      <label htmlFor={id} className="text-[13px] leading-snug text-ink-2 cursor-pointer select-none">
        Acepto los{" "}
        <Link href="/terms" className="font-semibold text-accent underline underline-offset-2">
          Términos
        </Link>{" "}
        y la{" "}
        <Link href="/privacy" className="font-semibold text-accent underline underline-offset-2">
          Política de privacidad
        </Link>
        . No se tolera contenido ofensivo ni el acoso: podés denunciarlo y bloquear cuentas.
      </label>
    </div>
  );
}
