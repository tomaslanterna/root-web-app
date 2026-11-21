"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { isActiveSwipeBack, registerSwipeBack, subscribeSwipeBack } from "@/lib/swipeBack";

interface SwipeBackProps {
  /** Same handler as the screen's back button, so the gesture respects its origin. */
  onBack?: () => void;
  /** For back links: the route the link points to. */
  href?: string;
  enabled?: boolean;
}

const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const LEAVE_MS = 180;
const ENTER_MS = 280;

// DOM writes live outside the component: <main> belongs to the root layout.
const lockPage = () => { document.documentElement.style.overflowX = "hidden"; };
const unlockPage = () => { document.documentElement.style.overflowX = ""; };

// iOS-style interactive back: the whole screen (<main>) follows the finger and
// slides away; the previous screen then enters with a short parallax.
// Render it next to the back button; it listens on the enclosing <main>.
export function SwipeBack({ onBack, href, enabled = true }: SwipeBackProps) {
  const router = useRouter();
  const [owner] = useState(() => ({}));
  useEffect(() => registerSwipeBack(owner), [owner]);
  const active = useSyncExternalStore(subscribeSwipeBack, () => isActiveSwipeBack(owner), () => false);

  const mainRef = useRef<HTMLElement | null>(null);
  const leaving = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    const main = mainRef.current;
    if (!main) return;
    main.style.transition = "";
    main.style.transform = "";
    main.style.boxShadow = "";
    main.style.willChange = "";
    unlockPage();
  };
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

  const { ref } = useHorizontalSwipe(
    1,
    enabled && active,
    () => {
      const main = mainRef.current;
      const go = () => {
        // El gesto ya animó la salida: la transición de pantalla (PageTransition) no se suma encima.
        document.documentElement.classList.add("root-swipe-back");
        setTimeout(() => document.documentElement.classList.remove("root-swipe-back"), 1000);
        if (onBack) onBack();
        else if (href) router.push(href);
        else router.back();
      };
      if (!main) { go(); return; }
      leaving.current = true;
      main.style.transition = `transform ${LEAVE_MS}ms ${EASE}`;
      main.style.transform = "translate3d(100%, 0, 0)";
      later(go, LEAVE_MS);
      // Navigation never landed (e.g. blocked): bring the screen back.
      later(() => { leaving.current = false; clear(); }, 2500);
    },
    {
      onProgress: (distance) => {
        const main = mainRef.current ?? ref.current?.closest<HTMLElement>("main") ?? null;
        if (!main || leaving.current) return;
        if (!mainRef.current) {
          mainRef.current = main;
          main.style.willChange = "transform";
          main.style.boxShadow = "-18px 0 44px rgba(0, 0, 0, 0.55)";
          // The shifted screen must not widen the page.
          lockPage();
        }
        main.style.transition = "none";
        main.style.transform = `translate3d(${Math.max(0, distance)}px, 0, 0)`;
      },
      onCancel: () => {
        const main = mainRef.current;
        if (!main || leaving.current) return;
        main.style.transition = `transform ${LEAVE_MS}ms ${EASE}`;
        main.style.transform = "translate3d(0, 0, 0)";
        later(clear, LEAVE_MS + 20);
      },
    },
    // The native iOS shell has no system back gesture, so the left edge is ours there.
    // Android and mobile browsers already go back from the edge.
    { scope: "main", edges: Capacitor.getPlatform() === "ios" },
  );

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    const main = mainRef.current;
    if (!main) return;
    clear();
    if (leaving.current) {
      // <main> outlives the route: replay the previous screen's entrance on it.
      main.dataset.popEnter = "";
      setTimeout(() => { delete main.dataset.popEnter; }, ENTER_MS + 40);
    }
  }, []);

  return <div ref={ref} hidden />;
}
