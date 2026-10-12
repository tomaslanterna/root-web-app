"use client";

import { useMutation } from "@/hooks/useMutation";
import { authApi } from "@/services/auth";
import { recoveryError } from "@/lib/passwordRecovery";

export function usePasswordRecovery() {
  const mutation = useMutation(authApi.requestPasswordReset);
  return { ...mutation, errorMessage: recoveryError(mutation.error) };
}

export function useResetPassword() {
  const mutation = useMutation(authApi.resetPassword);
  return { ...mutation, errorMessage: recoveryError(mutation.error) };
}
