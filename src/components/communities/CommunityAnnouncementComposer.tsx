"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CalendarDays, ImagePlus, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CreateCommunityAnnouncementInput } from "@/types/communities";

interface CommunityAnnouncementComposerProps {
  isPublishing: boolean;
  errorMessage?: string;
  onPublish: (
    input: CreateCommunityAnnouncementInput,
    image?: File,
  ) => Promise<unknown>;
}

export function CommunityAnnouncementComposer({
  isPublishing,
  errorMessage,
  onPublish,
}: CommunityAnnouncementComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [eventId, setEventId] = useState("");
  const [image, setImage] = useState<File>();
  const [preview, setPreview] = useState<string>();

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const selectImage = (file?: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : undefined);
  };

  const submit = async () => {
    if (!title.trim() && !content.trim()) return;
    await onPublish(
      {
        title: title.trim() || undefined,
        content: content.trim(),
        eventId: eventId.trim() || undefined,
      },
      image,
    );
    setTitle("");
    setContent("");
    setEventId("");
    selectImage(undefined);
  };

  return (
    <section className="rounded-3xl border-0 bg-[#111114] p-5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4FF00]">
          Canal de difusión
        </p>
        <h2 className="mt-1 text-lg font-black uppercase text-white">
          Nuevo anuncio
        </h2>
      </div>

      <div className="space-y-3">
        <input
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título (opcional)"
          className="h-11 w-full rounded-2xl border-0 bg-[#0B0D10] px-4 text-sm font-bold text-white outline-none placeholder:text-neutral-600 focus:ring-1 focus:ring-[#D4FF00]/50 shadow-sm"
        />
        <textarea
          value={content}
          maxLength={2000}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Escribí el anuncio para la comunidad..."
          className="min-h-32 w-full resize-none rounded-2xl border-0 bg-[#0B0D10] p-4 text-sm leading-relaxed text-white outline-none placeholder:text-neutral-600 focus:ring-1 focus:ring-[#D4FF00]/50 shadow-sm"
        />

        {preview && (
          <div className="relative h-36 overflow-hidden rounded-2xl border-0 shadow-md">
            <Image
              src={preview}
              alt="Vista previa"
              fill
              unoptimized
              sizes="100vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => selectImage(undefined)}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white"
              aria-label="Quitar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-white/5 text-xs font-black uppercase tracking-wider text-neutral-300 hover:bg-white/10 transition-colors">
            <ImagePlus className="h-4 w-4 text-[#D4FF00]" />
            {image ? "Cambiar imagen" : "Agregar imagen"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => selectImage(event.target.files?.[0])}
            />
          </label>
          <label className="relative">
            <CalendarDays className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4FF00]" />
            <input
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              placeholder="ID de evento (opcional)"
              className="h-11 w-full rounded-full border-0 bg-[#0B0D10] pl-11 pr-4 text-xs font-bold text-white outline-none placeholder:text-neutral-600 focus:ring-1 focus:ring-[#D4FF00]/50 shadow-sm"
            />
          </label>
        </div>

        {errorMessage && <p className="text-xs font-bold text-red-400">{errorMessage}</p>}

        <div className="flex items-center justify-between gap-4 pt-1">
          <span className="text-[10px] font-bold text-neutral-600">
            {content.length}/2000
          </span>
          <Button
            onClick={() => void submit().catch(() => undefined)}
            disabled={isPublishing || (!title.trim() && !content.trim())}
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publicar
          </Button>
        </div>
      </div>
    </section>
  );
}
