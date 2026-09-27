"use client";

import * as React from "react";
import { Card } from "./Card";
import { Avatar } from "./Avatar";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import type { Post } from "@/types/posts";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  variant?: "light" | "electronic";
}

export function PostCard({ post, variant = "light" }: PostCardProps) {
  const pathname = usePathname();
  const isElectronic = variant === "electronic";

  const linkRef = React.useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 } // Dispara cuando el 15% es visible
    );
    if (linkRef.current) {
      observer.observe(linkRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <Link 
      ref={linkRef}
      href={`/posts/${post.id}?origin=${pathname}`} 
      className={cn(
        "block w-full transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] md:hover:scale-[1.02]",
        isVisible 
          ? "scale-100 opacity-100 translate-y-0 blur-none" 
          : "scale-[0.70] md:scale-[0.92] opacity-0 md:opacity-60 translate-y-16 md:translate-y-0 blur-sm md:blur-none"
      )}
    >
      <Card
        className={cn(
          "relative w-full rounded-3xl overflow-hidden group h-48 sm:h-56 transition-all duration-300",
          isElectronic
            ? "border-white/10 hover:border-white/20 shadow-lg text-white"
            : "border-neutral-200/80 hover:border-neutral-300 shadow-xs text-neutral-950"
        )}
      >
        {/* Background Image */}
        {post.headerImageUrl ? (
          <img
            src={post.headerImageUrl}
            alt="Post Background"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={cn("absolute inset-0 w-full h-full", isElectronic ? "bg-neutral-900" : "bg-neutral-100")} />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        {/* Content over image */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end space-y-2">
          {/* Title */}
          {post.title && (
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white line-clamp-2">
              {post.title}
            </h3>
          )}

          {/* Author Info */}
          <div className="flex items-center gap-2">
            <Avatar
              src={post.authorAvatar}
              fallback={post.authorName || "U"}
              size="sm"
              className="!w-6 !h-6 ring-1 ring-white/20"
            />
            <p className="flex items-center gap-1 text-xs text-neutral-300 font-normal">
              {post.authorName || "Usuario Desconocido"}
              {post.isVerified ? (
                <BadgeCheck className="w-3.5 h-3.5 text-black fill-[#D4FF00]" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="mx-1 opacity-50">•</span>
              {new Date(post.timestamp).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}




