"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatList } from "@/app/chat/ChatList";
import { useAuth } from "@/context/AuthContext";
import { LoginRequired } from "@/components/ui/LoginRequired";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { useNativeBackHandler } from "@/hooks/useNativeBack";

interface InboxPresentation {
  interactive: boolean;
  dragging: boolean;
  offset: string;
  onProgress: (distance: number) => void;
  onCancel: () => void;
  onClose: () => void;
}

export function ChatInbox({ overlay = false, presentation }: { overlay?: boolean; presentation?: InboxPresentation }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [closing, setClosing] = useState(false);
  const interactive = presentation?.interactive ?? true;
  const backButton = useRef<HTMLButtonElement>(null);
  const close = () => {
    if (closing) return;
    if (!overlay) { router.push("/feed"); return; }
    presentation?.onClose();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { router.back(); return; }
    setClosing(true);
  };
  const { ref, distance, dragging } = useHorizontalSwipe(1, !!user && !closing && interactive, close,
    presentation ? { onProgress: presentation.onProgress, onCancel: presentation.onCancel } : undefined);
  useNativeBackHandler(interactive, close);
  useEffect(() => {
    if (!overlay || !interactive) return;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollY = window.scrollY;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    backButton.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previous; window.scrollTo({ top: scrollY, behavior: "instant" }); focused?.focus({ preventScroll: true }); };
  }, [overlay, interactive]);
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => router.back(), 220);
    return () => clearTimeout(timer);
  }, [closing, router]);
  return (
    <div ref={ref} inert={!interactive} role={overlay && interactive ? "dialog" : undefined} aria-modal={overlay && interactive || undefined} aria-hidden={!interactive || undefined} aria-label="Bandeja de mensajes"
      onKeyDown={(event) => {
        if (event.target instanceof Element && event.target.closest('[role="dialog"]') !== event.currentTarget && overlay) return;
        if (event.key === "Escape") { event.stopPropagation(); close(); }
        if (!overlay || event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href],select,textarea,[tabindex="0"]'));
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      className={`chat-inbox-screen ${!interactive ? "chat-inbox-preview pointer-events-none" : ""} ${overlay ? "fixed inset-y-0 inset-x-0 z-[60] mx-auto w-full max-w-md overflow-y-auto overscroll-contain bg-[#0B0D10] pb-[var(--root-safe-bottom)] md:top-24 md:max-w-[1264px]" : "h-full min-h-0 overflow-y-auto overscroll-contain"}`}
      style={{ transform: closing ? "translateX(100%)" : distance ? `translateX(${distance}px)` : presentation ? `translateX(${presentation.offset})` : undefined, transition: dragging || presentation?.dragging ? "none" : "transform 220ms ease-out" }}>
      {!isLoading && !user ? <LoginRequired /> : user ? <ChatList embedded={overlay} onBack={close} backButtonRef={backButton} className="pb-28 md:mx-auto md:w-full md:max-w-2xl" /> : null}
    </div>
  );
}
