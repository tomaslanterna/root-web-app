"use client";

import { useEffect, useRef, useState } from "react";
import { swipeIntent, swipeThreshold } from "@/lib/horizontalSwipe";

// Scoped to the owning screen, never a document-level gesture handler.
export function useHorizontalSwipe(direction: -1 | 1, enabled: boolean, onComplete: () => void,
  feedback?: { onProgress: (distance: number) => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onComplete);
  const feedbackRef = useRef(feedback);
  const [distance, setDistance] = useState(0);
  const [dragging, setDragging] = useState(false);
  useEffect(() => { callback.current = onComplete; }, [onComplete]);
  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    let start: { x: number; y: number; locked: boolean } | null = null;
    let delta = 0;
    let suppressClick = false;
    const reset = () => { start = null; delta = 0; setDistance(0); setDragging(false); };
    const begin = (event: TouchEvent) => {
      if (start?.locked) feedbackRef.current?.onCancel();
      suppressClick = false;
      reset();
      if (event.touches.length !== 1 || Array.from(document.querySelectorAll('[aria-modal="true"], [role="dialog"], [data-swipe-block]')).some((dialog) => dialog !== node && !dialog.contains(node))) return;
      let target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input,textarea,select,button,[contenteditable="true"],[data-no-swipe],[role="slider"]')) return;
      while (target && target !== node) {
        if (target.scrollWidth > target.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(target).overflowX)) return;
        target = target.parentElement;
      }
      const touch = event.touches[0];
      if (touch.clientX < 24 || touch.clientX > window.innerWidth - 24) return;
      start = { x: touch.clientX, y: touch.clientY, locked: false };
    };
    const move = (event: TouchEvent) => {
      if (!start) return;
      if (event.touches.length !== 1) { if (start.locked) feedbackRef.current?.onCancel(); reset(); return; }
      const dx = event.touches[0].clientX - start.x;
      const dy = event.touches[0].clientY - start.y;
      if (!start.locked) {
        const intent = swipeIntent(dx, dy, direction);
        if (intent === "cancel") { reset(); return; }
        if (intent === "pending") return;
        start.locked = true;
        setDragging(true);
      }
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      delta = Math.min(node.clientWidth, Math.max(0, dx * direction));
      setDistance(delta * direction);
      feedbackRef.current?.onProgress(delta * direction);
    };
    const end = () => {
      const complete = !!start?.locked && delta >= swipeThreshold(node.clientWidth);
      suppressClick = !!start?.locked;
      reset();
      if (complete) callback.current();
      else if (suppressClick) feedbackRef.current?.onCancel();
    };
    const cancel = () => { suppressClick = !!start?.locked; reset(); if (suppressClick) feedbackRef.current?.onCancel(); };
    const click = (event: MouseEvent) => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } };
    node.addEventListener("touchstart", begin, { passive: true });
    node.addEventListener("touchmove", move, { passive: false });
    node.addEventListener("touchend", end);
    node.addEventListener("touchcancel", cancel);
    node.addEventListener("click", click, true);
    return () => {
      node.removeEventListener("touchstart", begin); node.removeEventListener("touchmove", move);
      node.removeEventListener("touchend", end); node.removeEventListener("touchcancel", cancel); node.removeEventListener("click", click, true);
    };
  }, [direction, enabled]);
  return { ref, distance, dragging };
}
