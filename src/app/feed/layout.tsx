"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FeedInboxContext } from "@/context/FeedInboxContext";
import { ChatInbox } from "@/components/chat/ChatInbox";
import { useAuth } from "@/context/AuthContext";
import { useNativeBackHandler } from "@/hooks/useNativeBack";

const CLOSED = { distance: 0, visible: false, dragging: false, opening: false, returning: false };

export default function FeedLayout({ children, inbox }: { children: React.ReactNode; inbox: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isInbox = pathname === "/chat";
  const [previousPath, setPreviousPath] = useState(pathname);
  const [motion, setMotion] = useState(CLOSED);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);
  // Reset gesture state when the router commits/back/forward restores a screen.
  // The directory below keeps the same identity across preview -> open.
  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setMotion(CLOSED);
  }
  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);
  const cancel = () => {
    clearTimer();
    setMotion({ ...CLOSED, visible: true });
    timer.current = setTimeout(() => setMotion(CLOSED), 220);
  };
  useNativeBackHandler(motion.visible && !isInbox && !motion.opening, cancel);
  const open = () => {
    clearTimer();
    if (!user) { router.push("/login"); return; }
    const commit = () => {
      setMotion({ ...CLOSED, visible: true, opening: true });
      router.push("/chat?from=feed", { scroll: false });
    };
    if (motion.visible) commit();
    else {
      // Paint the right-hand screen before animating a button/keyboard opening.
      setMotion({ ...CLOSED, visible: true });
      frame.current = requestAnimationFrame(() => {
        frame.current = requestAnimationFrame(commit);
      });
    }
  };
  const move = (distance: number) => {
    clearTimer();
    setMotion({ ...CLOSED, distance: Math.abs(distance), visible: true, dragging: true });
  };
  const interactive = isInbox || motion.opening;
  return (
    <FeedInboxContext value={{ open, move, cancel }}>
      <div className="feed-inbox-content" inert={interactive} aria-hidden={interactive || undefined}
        style={{ transform: motion.returning ? "translateX(0)" : interactive ? `translateX(calc(-100% + ${motion.distance}px))` : motion.visible ? `translateX(${-motion.distance}px)` : undefined,
          transition: motion.dragging ? "none" : "transform 220ms ease-out" }}>
        {children}
      </div>
      {user && (isInbox || motion.visible) && <ChatInbox overlay
        presentation={{ interactive, dragging: motion.dragging, offset: interactive ? "0px" : `calc(100% - ${motion.distance}px)`,
          onProgress: move, onCancel: () => setMotion(CLOSED), onClose: () => setMotion({ ...CLOSED, returning: true }) }} />}
      {inbox}
    </FeedInboxContext>
  );
}
