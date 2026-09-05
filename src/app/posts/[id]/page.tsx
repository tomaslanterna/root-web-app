"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Heart, Bookmark, MessageCircle, MoreHorizontal } from "lucide-react";
import { MOCK_POSTS, MOCK_USERS, MOCK_COMMENTS } from "@/lib/mocks";
import { Avatar } from "@/components/ui/Avatar";
import { DetailHeader } from "@/components/ui/DetailHeader";
import { CommentSection } from "@/components/ui/CommentSection";
import { cn } from "@/lib/utils";

import { useMutation } from "@/hooks/useMutation";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  
  // React.use() to unwrap params if it is a Promise (Next.js 15+)
  const unwrappedParams = params instanceof Promise ? React.use(params) : params;
  const id = unwrappedParams.id;
  
  const [post, setPost] = useState<any>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const {
    mutate: fetchPost,
    isLoading: isLoadingPost,
  } = useMutation<any, string>(
    async (postId) => {
      const { api } = await import("@/lib/api");
      const response = await api.get(`/v1/posts/${postId}`);
      return response.data;
    },
    {
      onSuccess: (response) => {
        setPost(response);
        setLikesCount(response.likesCount || 0);
        setHasLoaded(true);
      },
      onError: () => setHasLoaded(true),
    }
  );

  React.useEffect(() => {
    void fetchPost(id).catch(() => undefined);
  }, [id, fetchPost]);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  if (!hasLoaded && isLoadingPost) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0B0D10] p-6 text-white">
        <div className="w-8 h-8 border-4 border-[#D4FF00] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-wider text-neutral-400">Cargando post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B0D10] p-6 text-center text-white">
        <p className="text-sm font-bold uppercase text-neutral-300">No pudimos encontrar el post</p>
      </div>
    );
  }

  // Separa el primer párrafo del resto para la letra capital
  const paragraphs = post.longContent?.split('\n').filter((p: string) => p.trim() !== '') || [post.content];
  const firstParagraph = paragraphs[0];
  const restParagraphs = paragraphs.slice(1);

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white pb-24">
      {/* 1. Header Fijo/Transparente */}
      <DetailHeader />

      {/* 2. Hero Section Editorial */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] bg-neutral-900 overflow-hidden">
        {post.headerImageUrl && (
          <img 
            src={post.headerImageUrl} 
            alt="Hero cover" 
            className="w-full h-full object-cover opacity-85"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/40 to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 inset-x-0 px-4 pb-8 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-6 leading-[1.1] shadow-black/50 drop-shadow-lg">
            {post.title || "Sin Título"}
          </h1>
          
          <div className="flex items-center gap-3">
            <Avatar src={post.authorAvatar} fallback={post.authorName?.charAt(0) || "U"} size="md" className="ring-2 ring-[#D4FF00]/40 shadow-xl" />
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-1 drop-shadow-md">
                {post.authorName || "Autor Desconocido"}
                {post.isVerified && (
                  <span className="w-3.5 h-3.5 bg-[#D4FF00] rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                  </span>
                )}
              </p>
              <p className="text-xs text-neutral-300 font-semibold tracking-wide uppercase drop-shadow-md">
                {new Date(post.timestamp).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Experiencia de Lectura */}
      <main className="px-5 py-8 max-w-2xl mx-auto">
        <article className="text-neutral-300 leading-[1.8] text-[17px] md:text-lg font-medium tracking-wide">
          {firstParagraph && (
            <p className="mb-6 first-letter:text-6xl first-letter:font-black first-letter:text-[#D4FF00] first-letter:mr-3 first-letter:float-left first-line:uppercase first-line:tracking-widest first-line:text-white">
              {firstParagraph}
            </p>
          )}
          {restParagraphs.map((paragraph: string, idx: number) => (
            <p key={idx} className="mb-6">{paragraph}</p>
          ))}
        </article>

        {/* Divider */}
        <div className="flex items-center justify-center my-14 gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]/60"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]/30"></span>
        </div>
      </main>

      {/* 4. Sección de Comentarios */}
      <CommentSection 
        targetId={post.id}
        title="Comentarios"
        isMock={false}
        endpointType="posts"
        className="px-5"
      />

      {/* 5. Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-[#0B0D10]/80 backdrop-blur-xl border-t border-white/10 py-3 sm:py-4 px-6 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={handleLike} className="flex items-center gap-2 group cursor-pointer">
              <Heart className={cn("w-6 h-6 transition-transform active:scale-90", liked ? "fill-[#D4FF00] stroke-[#D4FF00]" : "stroke-neutral-400 group-hover:stroke-white")} />
              <span className={cn("text-sm font-black", liked ? "text-[#D4FF00]" : "text-neutral-400 group-hover:text-white transition-colors")}>{likesCount}</span>
            </button>
            <button className="flex items-center gap-2 group cursor-pointer">
              <MessageCircle className="w-6 h-6 stroke-neutral-400 group-hover:stroke-white transition-transform active:scale-90" />
              <span className="text-sm font-black text-neutral-400 group-hover:text-white transition-colors">0</span>
            </button>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
            <MoreHorizontal className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
