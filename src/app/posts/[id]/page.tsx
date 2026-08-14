import { MOCK_POSTS, MOCK_USERS, MOCK_COMMUNITIES, MOCK_EVENTS } from "@/lib/mocks";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CommentSection } from "@/components/ui/CommentSection";
import { ArrowLeft, Sparkles, Users, Calendar } from "lucide-react";
import Link from "next/link";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = MOCK_POSTS.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#0B0D10] text-white">
        <p className="text-sm font-bold uppercase text-neutral-400">Publicación no encontrada</p>
        <Link href="/feed" className="mt-4">
          <Button variant="outline" size="sm">Volver al Feed</Button>
        </Link>
      </div>
    );
  }

  const author = MOCK_USERS.find((u) => u.id === post.authorId);
  const community = MOCK_COMMUNITIES.find((c) => c.id === post.communityId);
  const relatedEvent = MOCK_EVENTS.find((e) => e.id === post.eventId);

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white pb-28">
      {/* Top sticky navigation */}
      <div className="sticky top-0 z-40 glass-header-obsidian px-4 py-3 flex items-center justify-between">
        <Link
          href="/feed"
          className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 active:scale-95 transition-all text-white flex items-center gap-1 text-xs font-bold uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </Link>
        
        {community ? (
          <Link
            href={`/communities/${community.id}`}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30 flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-3 h-3 text-[#D4FF00]" /> {community.name}
          </Link>
        ) : (
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Artículo General
          </span>
        )}
      </div>

      <article className="p-4 space-y-6 max-w-xl mx-auto w-full">
        {/* Article Header Image */}
        {post.headerImageUrl && (
          <div className="relative w-full aspect-[16/10] sm:aspect-[2/1] rounded-3xl overflow-hidden shadow-lg border border-white/10 bg-neutral-900">
            <img
              src={post.headerImageUrl}
              alt={post.title || "Header image"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
            
            {relatedEvent && (
              <Link
                href={`/events/${relatedEvent.id}`}
                className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-neutral-950/80 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-widest border border-white/20 shadow-sm flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#D4FF00]" />
                <span>{relatedEvent.title}</span>
              </Link>
            )}
          </div>
        )}

        {/* Title & Metadata */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-snug">
            {post.title || post.content.substring(0, 40) + "..."}
          </h1>

          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Avatar
                src={author?.avatarUrl}
                fallback={author?.name || "A"}
                size="md"
                className="ring-2 ring-[#D4FF00]/40"
              />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white">{author?.name}</p>
                <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                  {new Date(post.timestamp).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-[#D4FF00] border border-white/10 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" /> Artículo
            </span>
          </div>
        </div>

        {/* Article Long Body */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#14171F] border border-white/10 shadow-lg space-y-4 text-neutral-200 leading-relaxed font-medium text-xs sm:text-sm">
          <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
            {post.content}
          </p>

          {post.longContent && (
            <div className="space-y-4 pt-2 border-t border-white/10 whitespace-pre-line text-neutral-300">
              {post.longContent}
            </div>
          )}
        </div>

        {/* Interactive Comment Section */}
        <CommentSection targetId={post.id} title="Debate y Comentarios del Artículo" />
      </article>
    </div>
  );
}

