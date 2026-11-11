"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Post } from "@/types/posts";
import { compressImageFile } from "@/lib/imageCompression";
import { useNativeBackHandler } from "@/hooks/useNativeBack";

interface CreatePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  initialFile?: File | null;
  onPickAnother?: () => void;
}

export function CreatePhotoModal({
  isOpen,
  onClose,
  onPostCreated,
  initialFile,
  onPickAnother,
}: CreatePhotoModalProps) {
  const { user } = useAuth();
  const internalFileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Seleccionar imagen (fallback). Step 2: Escribir pie de foto.
  const [step, setStep] = useState<1 | 2>(initialFile ? 2 : 1);
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile || null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useNativeBackHandler(isOpen, onClose);

  // Sincronizar archivo inicial cuando viene desde la galería nativa
  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
      const url = URL.createObjectURL(initialFile);
      setImagePreview(url);
      setStep(2); // Va directo al Step 2: Pie de foto
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (!selectedFile) {
      setStep(1);
    }
  }, [initialFile]);

  if (!isOpen) return null;

  const handleInternalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setStep(2);
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

  const handleTriggerPickAnother = () => {
    if (onPickAnother) {
      onPickAnother();
    } else {
      internalFileInputRef.current?.click();
    }
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
          const fileToUpload = await compressImageFile(selectedFile);
          const formData = new FormData();
          formData.append("image", fileToUpload);
          const uploadRes = await api.post<{ key?: string; url?: string } | string>(
            "/v1/posts/image",
            formData,
          );
          if (typeof uploadRes.data === "string") {
            uploadedKey = uploadRes.data;
          } else if (uploadRes.data?.key) {
            uploadedKey = uploadRes.data.key;
            presignedUrl = uploadRes.data.url || "";
          }
        } catch (uploadErr) {
          console.error("Subida de imagen al servidor falló:", uploadErr);
          const err = uploadErr as { response?: { data?: { error?: string } }; message?: string };
          const msg =
            err?.response?.data?.error ||
            err?.message ||
            "Error al subir imagen";
          setError(`No pudimos subir la foto: ${msg}`);
          setIsSubmitting(false);
          return;
        }
      }

      if (!uploadedKey) {
        setError("No pudimos subir la foto. Por favor intentá nuevamente.");
        setIsSubmitting(false);
        return;
      }

      // 2. Persistir post en backend
      let createdPost: Partial<Post> | null = null;
      try {
        const res = await api.post("/v1/posts", {
          content: caption.trim(),
          header_image_url: uploadedKey,
        });
        if (res.data) {
          createdPost = res.data;
        }
      } catch (postErr) {
        console.error("Creación de post en API falló:", postErr);
        setError("Error al crear la publicación en el servidor.");
        setIsSubmitting(false);
        return;
      }

      // 3. Resolver URL de imagen final visible (siempre displayable)
      let finalHeaderImageUrl = presignedUrl || imagePreview || "";
      if (createdPost?.headerImageUrl && createdPost.headerImageUrl.startsWith("http")) {
        finalHeaderImageUrl = createdPost.headerImageUrl;
      } else if (createdPost?.id) {
        try {
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
    } catch (err) {
      console.error("Error al crear la publicación:", err);
      setError("No pudimos publicar la foto. Intentá nuevamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Invisible backdrop to dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      <input
        ref={internalFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInternalFileChange}
      />

      {/* Modal Card con diseño Nocturno Editorial */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-hero bg-surface text-ink shadow-[0_24px_60px_rgba(0,0,0,0.85)] border border-line flex flex-col max-h-[92vh]">
        {/* Header del modal */}
        <header className="flex h-14 items-center justify-between border-b border-line px-5 shrink-0 bg-surface">
          <div className="flex items-center gap-2">
            {step === 2 && !initialFile ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="size-9 rounded-full bg-surface-2 border border-line text-ink-2 hover:bg-white/10 hover:text-ink transition-colors flex items-center justify-center"
                aria-label="Volver a la imagen"
              >
                <ArrowLeft className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="size-9 rounded-full bg-surface-2 border border-line text-ink-2 hover:bg-white/10 hover:text-ink transition-colors flex items-center justify-center"
                aria-label="Cerrar modal"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <h2 className="text-sm sm:text-base font-bold text-ink">
            {step === 1 ? "Nueva publicación" : "Pie de foto"}
          </h2>

          <div className="flex items-center gap-2">
            {step === 1 ? (
              <button
                type="button"
                disabled={!imagePreview}
                onClick={() => setStep(2)}
                className="text-xs font-bold uppercase tracking-wider text-accent disabled:opacity-30 hover:brightness-110 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Siguiente</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSubmit()}
                className="text-xs font-bold uppercase tracking-wider text-accent disabled:opacity-40 hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Compartir</span>
              </button>
            )}
          </div>
        </header>

        {/* Contenido según el paso */}
        <div className="flex-1 overflow-y-auto">
          {/* PASO 1: Fallback para seleccionar imagen si se abrió sin foto previa */}
          {step === 1 && (
            <div className="p-5 sm:p-6 flex flex-col items-center">
              {imagePreview ? (
                <div className="w-full flex flex-col items-center space-y-4">
                  <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-control bg-black shadow-inner border border-line">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerPickAnother}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-xs font-bold text-ink-2 transition-colors hover:bg-white/10 hover:text-ink cursor-pointer"
                  >
                    <ImageIcon className="h-4 w-4 text-accent" />
                    Elegir otra imagen
                  </button>
                </div>
              ) : (
                <div
                  onClick={handleTriggerPickAnother}
                  className="flex aspect-square w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-control border-2 border-dashed border-line bg-surface-2/40 p-8 text-center transition-all hover:border-accent/50 hover:bg-surface-2/80"
                >
                  <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-[0_0_24px_rgba(212,255,0,0.15)]">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                    Subí una foto
                  </h3>
                  <p className="mt-1.5 text-xs text-ink-3 max-w-[220px]">
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
                <p className="mt-3 text-xs font-semibold text-danger">{error}</p>
              )}
            </div>
          )}

          {/* PASO 2: Pie de foto directo (tras elegir foto en la galería del SO) */}
          {step === 2 && (
            <div className="p-5 sm:p-6 space-y-4">
              {/* Fila superior: Miniatura con botón de cambiar + Datos del Usuario */}
              <div className="flex items-center gap-3.5 border-b border-line pb-4">
                {imagePreview && (
                  <div className="relative group size-20 sm:size-24 overflow-hidden rounded-control bg-black shrink-0 border border-line shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Miniatura"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={handleTriggerPickAnother}
                      title="Elegir otra foto"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-white cursor-pointer"
                    >
                      <RefreshCw className="size-4 text-accent" />
                      <span>Cambiar</span>
                    </button>
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={user?.avatarUrl}
                      fallback={user?.username || "U"}
                      size="sm"
                      className="border border-line shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold uppercase tracking-wider text-ink">
                        {user?.username ? `@${user.username}` : user?.name || "Usuario"}
                      </p>
                      <p className="text-[11px] text-ink-3 font-normal">
                        Publicación en tu perfil
                      </p>
                    </div>
                  </div>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleTriggerPickAnother}
                      className="self-start text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <ImageIcon className="size-3" />
                      <span>Cambiar imagen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea para el pie de foto */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-2">
                  Pie de foto
                </label>
                <textarea
                  autoFocus
                  rows={4}
                  maxLength={2200}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribí un pie de foto..."
                  className="w-full resize-none rounded-control border border-line bg-surface-2 p-4 text-base sm:text-sm leading-relaxed text-ink outline-none placeholder:text-ink-3 focus:border-accent transition-colors shadow-sm"
                />
                <div className="flex justify-end text-xs text-ink-3 pt-1">
                  <span className="num-mono text-[11px]">{caption.length} / 2200</span>
                </div>
              </div>

              {error && (
                <p className="text-xs font-semibold text-danger">{error}</p>
              )}

              {/* Botón inferior grande para compartir cómodamente en mobile */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="full"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmit()}
                  className="h-12 font-bold uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Publicando foto...
                    </>
                  ) : (
                    "Publicar foto"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
