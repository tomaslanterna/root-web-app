"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@/hooks/useMutation";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/services/chat";

/**
 * Abre (o crea) el chat directo con otro usuario y navega a `/chat/{id}`, igual que "Mensaje" en el perfil.
 * Sin sesión lleva a `/login`. Guarda a quién se le está escribiendo para mostrar carga o error en esa fila.
 */
export function useDirectChat() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const { mutate: createDirect, isLoading, error } = useMutation(chatApi.createDirect);

  const startChat = useCallback(
    async (userId: string) => {
      if (isAuthLoading) return;
      if (!user) {
        router.push("/login");
        return;
      }
      if (userId === user.id) return;
      setTargetUserId(userId);
      try {
        const chat = await createDirect(userId);
        router.push(`/chat/${chat.id}`);
      } catch {
        // El error queda en `failedUserId` para mostrarlo junto al botón.
      }
    },
    [createDirect, isAuthLoading, router, user],
  );

  return {
    startChat,
    /** Mientras se resuelve la sesión no se sabe si el usuario es él mismo. */
    isAuthLoading,
    currentUserId: user?.id ?? null,
    pendingUserId: isLoading ? targetUserId : null,
    failedUserId: !isLoading && error ? targetUserId : null,
  };
}
