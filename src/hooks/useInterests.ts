"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";
import { usersApi, type MusicInterests } from "@/services/users";

/** Se dispara al guardar intereses: los destacados se vuelven a pedir para reordenarse. */
export const INTERESTS_UPDATED = "root:interests-updated";

/** Géneros por defecto si el backend todavía no manda la lista (mismo orden que domain.MusicGenres). */
export const DEFAULT_MUSIC_GENRES = [
  "Techno", "House", "Tech House", "Melodic Techno", "Afro House", "Deep House",
  "Minimal", "Progressive", "Trance", "Hard Techno", "Drum & Bass", "Disco",
];

export const MAX_INTERESTS = 8;

/** Intereses musicales de quien tiene la sesión: los carga al iniciar sesión y permite guardarlos. */
export function useInterests() {
  const { user } = useAuth();
  const [interests, setInterests] = useState<MusicInterests | null>(null);
  const { mutate: load, isLoading } = useMutation(usersApi.getInterests, { onSuccess: setInterests });
  const { mutate: save, isLoading: isSaving, error: saveError } = useMutation(usersApi.setInterests, {
    onSuccess: (genres) => {
      setInterests((prev) => ({ genres, answered: true, options: prev?.options ?? DEFAULT_MUSIC_GENRES }));
      window.dispatchEvent(new Event(INTERESTS_UPDATED));
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    void load(undefined).catch(() => undefined);
  }, [user?.id, load]);

  const saveInterests = useCallback((genres: string[]) => save(genres), [save]);

  return {
    genres: interests?.genres ?? [],
    options: interests?.options?.length ? interests.options : DEFAULT_MUSIC_GENRES,
    /** null mientras carga o sin sesión: no se sabe todavía si ya respondió. */
    answered: user && interests ? interests.answered : null,
    isLoading,
    isSaving,
    saveError,
    saveInterests,
  };
}
