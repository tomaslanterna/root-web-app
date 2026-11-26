"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { usersApi } from "@/services/users";

/** Aviso que muestra /login después de eliminar la cuenta. */
export const ACCOUNT_DELETED_PARAM = "deleted";

/** Datos de esa cuenta que quedaron guardados en este dispositivo (posts locales, swipes, perfil de vibe). */
function clearLocalAccountData(userId: string, username: string) {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter(
      (key): key is string => !!key,
    );
    for (const key of keys) {
      if (key === `root_user_posts_${username}` || key === "root_vibe_profile" || key.includes(userId)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* Storage no disponible. */
  }
}

/**
 * Elimina la cuenta. Después de la respuesta el token ya no vale, así que la sesión se borra localmente
 * (sin llamar a /logout) y se vuelve al login con el aviso "Tu cuenta fue eliminada".
 */
export function useAccountDeletion() {
  const { user, clearSession } = useAuth();
  const router = useRouter();
  const { mutate, isLoading, error } = useMutation(usersApi.deleteAccount, {
    onSuccess: () => {
      if (user) clearLocalAccountData(user.id, user.username);
      clearSession();
      router.replace(`/login?${ACCOUNT_DELETED_PARAM}=1`);
    },
  });
  return { deleteAccount: () => mutate(undefined), isDeleting: isLoading, error };
}
