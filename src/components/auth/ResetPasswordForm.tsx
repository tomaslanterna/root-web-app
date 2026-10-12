"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useResetPassword } from "@/hooks/usePasswordRecovery";
import { resetPasswordValidation } from "@/lib/passwordRecovery";

export function ResetPasswordForm() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validation, setValidation] = useState("");
  const reset = useResetPassword();
  useEffect(() => {
    // Fragments are not sent to Next, server logs, referrers or the backend.
    let active = true;
    const readToken = () => {
      if (!active) return;
      const value = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      setToken(/^[A-Za-z0-9_-]{43}$/.test(value) ? value : "");
    };
    queueMicrotask(readToken);
    window.addEventListener("hashchange", readToken);
    return () => { active = false; window.removeEventListener("hashchange", readToken); };
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = resetPasswordValidation(password, confirmPassword);
    setValidation(message);
    if (message || !token || reset.isLoading) return;
    await reset.mutate({ token, password, confirmPassword }).then(() => {
      setPassword(""); setConfirmPassword(""); setToken("");
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }).catch(() => undefined);
  };
  if (reset.data && !reset.error) return (
    <div role="status" className="space-y-4 rounded-2xl border border-acid-lime/20 bg-acid-lime/5 p-5">
      <CheckCircle2 className="text-acid-lime" aria-hidden="true" />
      <p className="text-sm">Tu contraseña fue actualizada. Iniciá sesión con tu nueva contraseña.</p>
      <Link href="/login" className="inline-flex min-h-11 items-center text-acid-lime font-bold hover:underline">Ir al login</Link>
    </div>
  );
  if (token === null) return <Loader2 className="animate-spin text-acid-lime" aria-label="Cargando enlace" />;
  if (!token) return <div role="alert" className="space-y-3 text-sm"><p>No encontramos un enlace válido de recuperación.</p><Link href="/forgot-password" className="inline-flex min-h-11 items-center text-acid-lime font-semibold">Solicitar otro enlace</Link></div>;
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="new-password" className="text-sm font-semibold">Nueva contraseña</label>
        <PasswordInput id="new-password" name="password" autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} placeholder="Al menos 8 caracteres" aria-describedby="password-help" />
        <p id="password-help" className="text-xs text-neutral-500">Al menos 8 caracteres. Máximo 72 bytes; los caracteres especiales pueden ocupar más de uno.</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-sm font-semibold">Confirmar contraseña</label>
        <PasswordInput id="confirm-password" name="confirmPassword" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Repetí tu nueva contraseña" />
      </div>
      {(validation || reset.errorMessage) && <p role="alert" className="text-sm text-red-400">{validation || reset.errorMessage}</p>}
      {reset.error && <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm text-acid-lime hover:underline">Solicitar otro enlace</Link>}
      <Button type="submit" size="full" disabled={reset.isLoading} className="rounded-2xl py-4">
        {reset.isLoading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Actualizar contraseña
      </Button>
    </form>
  );
}
