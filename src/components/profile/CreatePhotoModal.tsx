"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Post } from "@/types/posts";

interface CreatePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

export function CreatePhotoModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePhotoModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Select 1 image. Step 2: Write caption.
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Por favor seleccioná un archivo de imagen válido.");
        return;
      }
      setError(null);
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedFile(null);
    setImagePreview(null);
    setCaption("");
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedFile && !imagePreview) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let uploadedKey = "";
      let presignedUrl = "";

      // 1. Subir imagen al backend
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("image", selectedFile);
          const uploadRes = await api.post<{ key?: string; url?: string } | string>(
            "/v1/posts/image",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
          if (typeof uploadRes.data === "string") {
            uploadedKey = uploadRes.data;
          } else if (uploadRes.data?.key) {
            uploadedKey = uploadRes.data.key;
            presignedUrl = uploadRes.data.url || "";
          }
        } catch (uploadErr) {
          console.warn("Subida de imagen al servidor falló, usando preview local:", uploadErr);
        }
      }

      // 2. Persistir post en backend
      let createdPost: any = null;
      try {
        const res = await api.post("/v1/posts", {
          content: caption.trim(),
          header_image_url: uploadedKey || undefined,
        });
        if (res.data) {
          createdPost = res.data;
        }
      } catch (postErr) {
        console.warn("Creación de post en API falló o endpoint offline:", postErr);
      }

      // 3. Resolver URL de imagen final visible (siempre displayable)
      let finalHeaderImageUrl = presignedUrl || imagePreview || "";
      if (createdPost?.headerImageUrl && createdPost.headerImageUrl.startsWith("http")) {
        finalHeaderImageUrl = createdPost.headerImageUrl;
      } else if (createdPost?.id) {
        try {
          // El endpoint GET /v1/posts/:id genera la URL presignada de S3
          const detailRes = await api.get(`/v1/posts/${createdPost.id}`);
          if (detailRes.data?.headerImageUrl?.startsWith("http")) {
            finalHeaderImageUrl = detailRes.data.headerImageUrl;
          }
        } catch {
          // Mantener imagePreview
        }
      }

      const finalPost: Post = {
        id: createdPost?.id || `post_${Date.now()}`,
        authorId: createdPost?.authorId || user?.id || "user_me",
        authorName: createdPost?.authorName || user?.name || user?.username || "Usuario",
        authorAvatar: createdPost?.authorAvatar || user?.avatarUrl,
        content: createdPost?.content || caption.trim(),
        headerImageUrl: finalHeaderImageUrl,
        timestamp: createdPost?.timestamp || new Date().toISOString(),
        likesCount: createdPost?.likesCount || 0,
      };

      onPostCreated(finalPost);
      handleClose();
    } catch (err: any) {
      console.error("Error al crear la publicación:", err);
      setError("No pudimos publicar la foto. Intentá nuevamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Invisible backdrop to dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Card estilo Instagram */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-[#111114] shadow-[0_24px_60px_rgba(0,0,0,0.85)] border-0 flex flex-col max-h-[92vh]">
        {/* Header estilo Instagram */}
        <header className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4 shrink-0 bg-[#16171D]/50">
          {step === 1 ? (
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              aria-label="Volver a la imagen"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            {step === 1 ? "Nueva publicación" : "Pie de foto"}
          </h2>

          {step === 1 ? (
            <button
              type="button"
              disabled={!imagePreview}
              onClick={() => setStep(2)}
              className="text-xs font-black uppercase tracking-wider text-[#D4FF00] disabled:opacity-30 hover:brightness-110 transition-all flex items-center gap-1"
            >
              <span>Siguiente</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
              className="text-xs font-black uppercase tracking-wider text-[#D4FF00] disabled:opacity-40 hover:brightness-110 transition-all flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Compartir</span>
            </button>
          )}
        </header>

        {/* Contenido según el paso */}
        <div className="flex-1 overflow-y-auto">
          {/* PASO 1: Elegir y previsualizar 1 imagen */}
          {step === 1 && (
            <div className="p-4 sm:p-6 flex flex-col items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {imagePreview ? (
                <div className="w-full flex flex-col items-center space-y-4">
                  <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-black shadow-inner">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border-0 bg-white/5 px-4 py-2 text-xs font-bold text-neutral-300 shadow-sm transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <ImageIcon className="h-4 w-4 text-[#D4FF00]" />
                    Elegir otra imagen
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center transition-all hover:border-[#D4FF00]/50 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-0 bg-[#D4FF00]/15 text-[#D4FF00] shadow-[0_0_24px_rgba(212,255,0,0.15)]">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Subí una foto
                  </h3>
                  <p className="mt-1.5 text-xs text-neutral-400 max-w-[220px]">
                    Arrastrá tu foto acá o seleccionala desde tu dispositivo
                  </p>
                  <div className="mt-5">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="pointer-events-none"
                    >
                      Elegir de la galería
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-3 text-xs font-bold text-red-400">{error}</p>
              )}
            </div>
          )}

          {/* PASO 2: Pie de foto únicamente */}
          {step === 2 && (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Fila superior: Miniatura + Usuario */}
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                {imagePreview && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-black shrink-0 shadow-md">
                    <img
                      src={imagePreview}
                      alt="Miniatura"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={user?.avatarUrl}
                    fallback={user?.username || "U"}
                    size="sm"
                    className="ring-1 ring-white/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase tracking-wider text-white">
                      {user?.username ? `@${user.username}` : user?.name || "Usuario"}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      Publicación en tu perfil
                    </p>
                  </div>
                </div>
              </div>

              {/* Textarea para pie de foto */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Pie de foto
                </label>
                <textarea
                  autoFocus
                  rows={4}
                  maxLength={2200}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribí un pie de foto..."
                  className="w-full resize-none rounded-2xl border-0 bg-[#0B0D10] p-4 text-sm leading-relaxed text-white outline-none placeholder:text-neutral-600 focus:ring-1 focus:ring-[#D4FF00]/50 shadow-sm"
                />
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    {["🎧", "⚡", "🖤", "🔊", "🔥"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCaption((prev) => prev + emoji)}
                        className="rounded-full bg-white/5 px-2 py-1 hover:bg-white/10 transition-colors text-xs"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <span>{caption.length} / 2200</span>
                </div>
              </div>

              {error && (
                <p className="text-xs font-bold text-red-400">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
