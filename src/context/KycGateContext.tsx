"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { KycRequiredSheet } from "@/components/kyc/KycRequiredSheet";
import { useMutation } from "@/hooks/useMutation";
import { usersApi } from "@/services/users";
import { isAftersDemo } from "@/services/aftersDemo";
import { isKycRequiredError } from "@/lib/apiErrors";
import { kycGateDecision } from "@/lib/kycRedirect";

interface KycGateValue {
  /** Sin sesión lleva a /login; sin identidad verificada abre la hoja; si no, ejecuta `action`. */
  requireKyc: (action: () => void) => void;
  openKycSheet: () => void;
  /** Si el error es 403 kyc_required abre la hoja y devuelve true. */
  handleKycError: (error: unknown) => boolean;
}

const KycGateContext = createContext<KycGateValue | null>(null);

/**
 * Una sola hoja "Verificá tu identidad" para toda la app. La regla la impone el backend en cada endpoint;
 * esto solo evita mandar a alguien a un formulario que no va a poder enviar.
 */
export function KycGateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, token, login } = useAuth();
  const pathname = usePathname();
  // La hoja queda atada a la pantalla donde se abrió: si se navega a otra, se cierra sola.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const isOpen = openOn !== null && openOn === pathname;
  const setIsOpen = useCallback((open: boolean) => setOpenOn(open ? pathname : null), [pathname]);
  const { mutate: fetchStatus } = useMutation((username: string) => usersApi.getKycStatus(username));

  // La sesión guarda isKycVerified del login: si se aprobó después, se actualiza una vez por cuenta.
  const checkedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !token || user.isKycVerified || checkedFor.current === user.id || isAftersDemo()) return;
    checkedFor.current = user.id;
    void fetchStatus(user.username)
      .then((verified) => {
        if (verified) login(token, { ...user, isKycVerified: true });
      })
      .catch(() => undefined);
  }, [user, token, login, fetchStatus]);

  const openKycSheet = useCallback(() => setIsOpen(true), [setIsOpen]);

  const requireKyc = useCallback(
    (action: () => void) => {
      const decision = kycGateDecision(user);
      if (decision === "login") router.push("/login");
      else if (decision === "verify") setIsOpen(true);
      else action();
    },
    [user, router, setIsOpen],
  );

  const handleKycError = useCallback((error: unknown) => {
    if (!isKycRequiredError(error)) return false;
    setIsOpen(true);
    return true;
  }, [setIsOpen]);

  const value = useMemo(() => ({ requireKyc, openKycSheet, handleKycError }), [requireKyc, openKycSheet, handleKycError]);

  return (
    <KycGateContext value={value}>
      {children}
      <KycRequiredSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </KycGateContext>
  );
}

export function useKycGate(): KycGateValue {
  const context = useContext(KycGateContext);
  if (!context) throw new Error("useKycGate must be used within a KycGateProvider");
  return context;
}
