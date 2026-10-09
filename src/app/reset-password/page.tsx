import type { Metadata } from "next";
import { RecoveryLayout } from "@/components/auth/RecoveryLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Nueva contraseña | Root", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return <RecoveryLayout title="Elegí una nueva contraseña" description="Ingresá tu nueva contraseña y confirmala para recuperar el acceso."><ResetPasswordForm /></RecoveryLayout>;
}
