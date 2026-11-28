"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { KycRequiredSheet } from "@/components/kyc/KycRequiredSheet";

/**
 * Para pantallas que piden identidad verificada (subir un after, mandar un evento). Si se entra por URL sin
 * verificación, en lugar del formulario se ve la hoja "Verificá tu identidad"; sin sesión, va a /login.
 * Es solo para no mostrar un formulario que no se va a poder enviar: el backend vuelve a controlarlo.
 */
export function KycGateScreen({ children, fallback = "/events" }: { children: ReactNode; fallback?: string }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const goBack = useBackNavigation(fallback);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) return <div className="min-h-[100dvh] bg-bg" aria-busy="true" />;
  if (user.isKycVerified) return <>{children}</>;

  return (
    <div className="min-h-[100dvh] bg-bg text-ink flex flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="size-14 rounded-full bg-accent/12 text-accent flex items-center justify-center">
        <ShieldCheck className="size-7" aria-hidden="true" />
      </span>
      <p className="m-0 text-lg font-semibold">Necesitás tu identidad verificada</p>
      <p className="m-0 max-w-xs text-sm text-ink-2">Para subir afters o mandarnos eventos tenés que verificar tu identidad.</p>
      <KycRequiredSheet isOpen onClose={goBack} closeOnVerify={false} />
    </div>
  );
}
