import * as React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "./Card";
import { Avatar } from "./Avatar";
import { Heart, MessageCircle, Share2, Sparkles, Calendar, Users } from "lucide-react";
import { MOCK_USERS, MOCK_EVENTS, MOCK_COMMUNITIES, Post } from "@/lib/mocks";
import Link from "next/link";
import { cn } from "@/lib/utils";


interface PostCardProps {
  post: Post;
  variant?: "light" | "electronic";
}

export function PostCard({ post, variant = "light" }: PostCardProps) {
  const author = MOCK_USERS.find((u) => u.id === post.authorId);
  const relatedEvent = MOCK_EVENTS.find((e) => e.id === post.eventId);
  const relatedCommunity = MOCK_COMMUNITIES.find((c) => c.id === post.communityId);

  const [liked, setLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(post.likesCount);

  const isElectronic = variant === "electronic";

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  return (
    <Card
      className={cn(
        "w-full rounded-3xl transition-all duration-300 overflow-hidden group",
        isElectronic
          ? "bg-[#14171F] border border-white/10 hover:border-white/20 shadow-lg text-white"
          : "bg-white border border-neutral-200/80 hover:border-neutral-300 shadow-xs text-neutral-950"
      )}
    >
      {/* Compact Banner Header (if media exists) */}
      {post.headerImageUrl && (
        <CardHeader className="h-32 sm:h-36 relative overflow-hidden bg-neutral-900">
          <Link href={`/posts/${post.id}`} className="block w-full h-full">
            <img
              src={post.headerImageUrl}
              alt="Post Header"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />

          {relatedEvent && (
            <Link
              href={`/events/${relatedEvent.id}`}
              className="absolute top-3 left-3 px-3 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 hover:bg-neutral-950 transition-colors shadow-sm z-10"
            >
              <Calendar className="w-3 h-3 text-[#D4FF00]" />
              <span className="truncate max-w-[160px]">{relatedEvent.title}</span>
            </Link>
          )}

          {relatedCommunity && (
            <Link
              href={`/communities/${relatedCommunity.id}`}
              className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#14171F]/90 backdrop-blur-md border border-white/15 text-[#D4FF00] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 hover:bg-white hover:text-neutral-950 transition-colors shadow-sm z-10"
            >
              <Users className="w-3 h-3 text-[#D4FF00]" />
              <span className="truncate max-w-[140px]">{relatedCommunity.name}</span>
            </Link>
          )}
        </CardHeader>
      )}

      {/* Author & Timestamp Bar */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            src={author?.avatarUrl}
            fallback={author?.name || "U"}
            size="sm"
            className={cn("ring-2", isElectronic ? "ring-[#D4FF00]/40" : "ring-neutral-900/10")}
          />
          <div>
            <p className={cn("text-xs font-black uppercase tracking-wider", isElectronic ? "text-white" : "text-neutral-950")}>
              {author?.name}
            </p>
            <p className={cn("text-[10px] font-semibold uppercase tracking-wider", isElectronic ? "text-neutral-400" : "text-neutral-400")}>
              {new Date(post.timestamp).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
            </p>
          </div>
        </div>

        {relatedCommunity ? (
          <Link
            href={`/communities/${relatedCommunity.id}`}
            className={cn(
              "text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors",
              isElectronic
                ? "bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30 hover:bg-[#D4FF00] hover:text-neutral-950"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            )}
          >
            <Users className="w-3 h-3" /> {relatedCommunity.name}
          </Link>
        ) : (
          <span
            className={cn(
              "text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1",
              isElectronic
                ? "bg-white/10 text-neutral-300 border border-white/10"
                : "bg-neutral-100 text-neutral-600"
            )}
          >
            <Sparkles className={cn("w-3 h-3", isElectronic ? "text-[#D4FF00]" : "text-neutral-950")} /> General
          </span>
        )}
      </div>

      {/* Main Content Body Clickable */}
      <Link href={`/posts/${post.id}`} className="block">
        <CardContent className="px-4 py-2 space-y-1">
          {post.title && (
            <h3
              className={cn(
                "text-sm font-black uppercase tracking-tight transition-colors",
                isElectronic ? "text-white group-hover:text-[#D4FF00]" : "text-neutral-950 group-hover:text-neutral-700"
              )}
            >
              {post.title}
            </h3>
          )}
          <p
            className={cn(
              "text-xs sm:text-sm leading-relaxed font-medium line-clamp-3",
              isElectronic ? "text-neutral-300" : "text-neutral-800"
            )}
          >
            {post.content}
          </p>
        </CardContent>
      </Link>

      {/* Footer with Actions */}
      <CardFooter
        className={cn(
          "px-4 py-3 border-t flex items-center justify-between",
          isElectronic
            ? "border-white/5 bg-neutral-950/40"
            : "border-neutral-100 bg-neutral-50/50"
        )}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLike}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors group/btn active:scale-90",
              isElectronic ? "hover:bg-white/10" : "hover:bg-neutral-200/60"
            )}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-all duration-200",
                liked
                  ? isElectronic
                    ? "fill-[#D4FF00] stroke-[#D4FF00] scale-110"
                    : "fill-neutral-950 stroke-neutral-950 scale-110"
                  : isElectronic
                  ? "stroke-neutral-400 group-hover/btn:stroke-[#D4FF00]"
                  : "stroke-neutral-600 group-hover/btn:stroke-neutral-950"
              )}
            />
            <span className={cn("text-xs font-extrabold", isElectronic ? (liked ? "text-[#D4FF00]" : "text-white") : "text-neutral-950")}>
              {likesCount}
            </span>
          </button>

          <Link
            href={`/posts/${post.id}`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors active:scale-90",
              isElectronic
                ? "text-neutral-400 hover:text-white hover:bg-white/10"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-extrabold uppercase tracking-wider">Comentar</span>
          </Link>
        </div>

        <Link
          href={`/posts/${post.id}`}
          className={cn(
            "text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 hover:underline",
            isElectronic ? "text-[#D4FF00]" : "text-neutral-950"
          )}
        >
          Leer más →
        </Link>
      </CardFooter>
    </Card>
  );
}




