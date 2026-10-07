"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RecoveryLayout } from "@/components/auth/RecoveryLayout";
import { usePasswordRecovery } from "@/hooks/usePasswordRecovery";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const recovery = usePasswordRecovery();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!recovery.isLoading) await recovery.mutate(email.trim()).catch(() => undefined);
  };
  return (
    <RecoveryLayout title="Recuperá tu contraseña" description="Ingresá el email de tu cuenta para solicitar un enlace de recuperación.">
      {recovery.data && !recovery.error ? (
        <div role="status" className="rounded-2xl border border-acid-lime/20 bg-acid-lime/5 p-5 space-y-3">
          <CheckCircle2 className="text-acid-lime" aria-hidden="true" />
          <p className="text-sm font-bold">Solicitud recibida</p>
          <p className="text-sm leading-relaxed">Revisá tu correo y spam durante los próximos minutos. Solo las cuentas con contraseña pueden recibir un enlace. Esta confirmación no significa que el correo ya se haya enviado. Si te registraste con Google, seguí usando “Continuar con Google”.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="recovery-email" className="text-sm font-semibold">Email</label>
            <div className="relative">
              <Mail size={18} aria-hidden="true" className="absolute left-4 top-4 text-neutral-500" />
              <input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="tu@email.com" className="w-full rounded-2xl bg-[#14171F] border border-white/10 py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-acid-lime/50 focus:ring-1 focus:ring-acid-lime/50" />
            </div>
          </div>
          {recovery.errorMessage && <p role="alert" className="text-sm text-red-400">{recovery.errorMessage}</p>}
          <Button type="submit" size="full" disabled={recovery.isLoading} className="rounded-2xl py-4">
            {recovery.isLoading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Solicitar enlace
          </Button>
        </form>
      )}
    </RecoveryLayout>
  );
}
