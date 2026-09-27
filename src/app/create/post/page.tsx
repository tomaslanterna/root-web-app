"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { ChevronLeft, Image as ImageIcon, Sparkles, Loader2, Check, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams?.get("communityId");

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Data
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // AI State
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content, enhancedContent]);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleEnhanceText = async () => {
    if (!content.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await api.post("/v1/ai/enhance-text", { text: content });
      if (res.data?.enhanced_text) {
        setEnhancedContent(res.data.enhanced_text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const submitPost = async () => {
    setIsSubmitting(true);
    try {
      let headerImageUrl = "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await api.post("/v1/posts/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        headerImageUrl = uploadRes.data.key;
      }

      const payload = {
        title: title.trim(),
        content: enhancedContent || content.trim(),
        header_image_url: headerImageUrl,
        community_id: communityId || undefined,
      };
      await api.post("/v1/posts", payload);
      
      // Go back to feed or community
      if (communityId) {
        router.push(`/communities/${communityId}`);
      } else {
        router.push("/feed");
      }
    } catch (err) {
      console.error("Error creating post:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col pb-20">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0B0D10]/90 backdrop-blur-md px-4 pb-3 pt-safe-header flex items-center justify-between border-b border-white/5">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : router.back()} 
          className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-xs font-black uppercase tracking-widest text-neutral-300">
          Nuevo Post {step}/2
        </span>
        <button 
          onClick={() => {
            if (step === 1 && imagePreview) setStep(2);
            else if (step === 2) submitPost();
          }}
          disabled={step === 1 && !imagePreview}
          className="text-[#D4FF00] text-xs font-black uppercase tracking-widest disabled:opacity-30 transition-opacity"
        >
          {step === 1 ? "Siguiente" : "Publicar"}
        </button>
      </header>

      {/* CONTENT WIZARD */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {step === 1 && (
          <div className="flex-1 flex flex-col p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-4 text-white">Selecciona una imagen</h2>
            
            <label className="relative flex-1 min-h-[300px] max-h-[500px] w-full bg-[#14171F] rounded-3xl border border-dashed border-white/10 hover:border-[#D4FF00]/50 transition-colors cursor-pointer overflow-hidden flex flex-col items-center justify-center group">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              
              {imagePreview ? (
                <div className="absolute inset-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white font-bold tracking-widest uppercase text-xs flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Cambiar Imagen
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-neutral-500 group-hover:text-[#D4FF00] transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-extrabold tracking-widest uppercase">Subir desde carrete</span>
                </div>
              )}
            </label>
            <p className="text-center text-[10px] text-neutral-500 mt-4 uppercase tracking-widest font-bold">Recomendado: 16:9 o 4:3</p>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col p-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header Preview Miniature */}
            {imagePreview && (
              <div className="w-full h-24 rounded-2xl overflow-hidden relative">
                <img src={imagePreview} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D4FF00]">Preview del header</span>
                </div>
              </div>
            )}

            <div className="space-y-4 flex-1 flex flex-col">
              <input 
                type="text" 
                placeholder="TÍTULO (OPCIONAL)"
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-none text-2xl font-black italic tracking-tighter text-white placeholder:text-neutral-600 focus:outline-none focus:ring-0"
              />

              <div className="relative flex-1 flex flex-col">
                <textarea
                  ref={textareaRef}
                  placeholder="Escribe el contenido de tu publicación aquí..."
                  value={enhancedContent !== null ? enhancedContent : content}
                  onChange={(e) => {
                    if (enhancedContent !== null) setEnhancedContent(null);
                    setContent(e.target.value);
                  }}
                  className="w-full flex-1 min-h-[250px] bg-[#14171F] border border-white/10 rounded-2xl p-4 text-base font-medium text-neutral-200 placeholder:text-neutral-500 resize-none focus:outline-none focus:border-[#D4FF00]/50 leading-relaxed transition-colors"
                />

                {/* AI Assistant Button */}
                {!enhancedContent && (
                  <div className="absolute bottom-4 right-4 flex justify-end">
                    <Button 
                      onClick={handleEnhanceText} 
                      disabled={isEnhancing || content.length < 10}
                      variant="primary"
                      className="rounded-full shadow-lg shadow-[#D4FF00]/20 flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:grayscale"
                    >
                      {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isEnhancing ? "Mejorando..." : "Mejorar texto con IA"}
                    </Button>
                  </div>
                )}

                {/* AI Diff/Accept state */}
                {enhancedContent && (
                  <div className="mt-4 p-4 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/20 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 mb-2 text-[#D4FF00]">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">IA aplicó mejoras</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent border-white/10 hover:bg-white/5" onClick={() => setEnhancedContent(null)}>
                        <X className="w-4 h-4 mr-1" /> Descartar
                      </Button>
                      <Button size="sm" variant="primary" className="flex-1" onClick={() => setContent(enhancedContent)}>
                        <Check className="w-4 h-4 mr-1" /> Mantener
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Overlay de Carga Final */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#D4FF00] animate-spin mb-4" />
          <span className="text-sm font-black uppercase tracking-widest text-[#D4FF00] animate-pulse">Publicando...</span>
        </div>
      )}
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <React.Suspense fallback={<div className="min-h-[100dvh] bg-[#0B0D10] text-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D4FF00]" /></div>}>
      <CreatePostContent />
    </React.Suspense>
  );
}
