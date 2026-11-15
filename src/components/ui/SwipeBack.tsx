"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { ChevronLeft } from "lucide-react";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { swipeThreshold } from "@/lib/horizontalSwipe";
import { isActiveSwipeBack, registerSwipeBack, subscribeSwipeBack } from "@/lib/swipeBack";

interface SwipeBackProps {
  /** Same handler as the screen's back button, so the gesture respects its origin. */
  onBack?: () => void;
  /** For back links: the route the link points to. */
  href?: string;
  enabled?: boolean;
}

// Swipe right anywhere on the screen to go back. Render it next to the back
// button; it listens on the enclosing <main>, not on the document.
export function SwipeBack({ onBack, href, enabled = true }: SwipeBackProps) {
  const router = useRouter();
  const [owner] = useState(() => ({}));
  useEffect(() => registerSwipeBack(owner), [owner]);
  const active = useSyncExternalStore(subscribeSwipeBack, () => isActiveSwipeBack(owner), () => false);
  const { ref, distance, dragging } = useHorizontalSwipe(
    1,
    enabled && active,
    () => {
      if (onBack) onBack();
      else if (href) router.push(href);
      else router.back();
    },
    undefined,
    // The native iOS shell has no system back gesture, so the left edge is ours there.
    // Android and mobile browsers already go back from the edge.
    { scope: "main", edges: Capacitor.getPlatform() === "ios" },
  );
  const armed = dragging && distance >= swipeThreshold(window.innerWidth);

  return (
    <>
      <div ref={ref} hidden />
      {dragging && createPortal(
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed left-0 top-1/2 z-[70] flex size-11 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-colors ${armed ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink"}`}
          style={{ transform: `translate(${Math.min(distance, 132) - 48}px, -50%)`, opacity: Math.min(1, distance / 48) }}
        >
          <ChevronLeft className="size-[22px]" />
        </div>,
        document.body,
      )}
    </>
  );
}
