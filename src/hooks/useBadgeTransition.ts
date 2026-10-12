"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { badgeTransitionFrames } from "@/lib/badgeTransition";

type Phase = "closed" | "opening" | "open" | "closing";
const historyKey = "rootBadgeDetail";

export function useBadgeTransition(canClose: () => boolean) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("closed");
  const phaseRef = useRef<Phase>("closed");
  const source = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const movingRef = useRef<HTMLDivElement>(null);
  const closeGuard = useRef(canClose);
  useEffect(() => { closeGuard.current = canClose; }, [canClose]);

  const open = useCallback((id: string, element: HTMLElement) => {
    if (phaseRef.current !== "closed") return;
    source.current = element;
    const next = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "open" : "opening";
    phaseRef.current = next;
    window.history.pushState({ ...window.history.state, [historyKey]: id }, "", window.location.href);
    setEventId(id); setPhase(next);
  }, []);

  const finishClose = useCallback(() => {
    phaseRef.current = "closed";
    if (window.history.state?.[historyKey]) window.history.back();
    setEventId(null); setPhase("closed");
  }, []);
  const close = useCallback(() => {
    if (phaseRef.current !== "open") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finishClose(); return; }
    phaseRef.current = "closing"; setPhase("closing");
  }, [finishClose]);

  useEffect(() => {
    if (!eventId) return;
    const onPop = () => {
      if (phaseRef.current === "closed" || phaseRef.current === "closing" || window.history.state?.[historyKey] === eventId) return;
      // Restore this entry until the guarded close finishes. Back never bypasses
      // unsaved-change confirmation, and the underlying profile stays mounted.
      window.history.pushState({ ...window.history.state, [historyKey]: eventId }, "", window.location.href);
      if (phaseRef.current === "opening") { phaseRef.current = "open"; setPhase("open"); }
      if (closeGuard.current()) close();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [eventId, close]);

  useLayoutEffect(() => {
    if (phase !== "opening" && phase !== "closing") return;
    const origin = source.current?.getBoundingClientRect();
    const destination = heroRef.current?.getBoundingClientRect();
    const element = movingRef.current;
    const finish = () => {
      if (phase === "closing") finishClose();
      else { phaseRef.current = "open"; setPhase("open"); }
    };
    if (!origin?.width || !destination?.width || !element?.animate) {
      const timer = window.setTimeout(finish, 0);
      return () => window.clearTimeout(timer);
    }
    // A long review may scroll the hero out of view. Do not fly an invisible
    // element across the screen: let the detail fade out in that case instead.
    if (phase === "closing" && (destination.top < 0 || destination.top + destination.height > window.innerHeight || origin.top < 0 || origin.top + origin.height > window.innerHeight)) {
      const timer = window.setTimeout(finish, 160);
      return () => window.clearTimeout(timer);
    }
    // One shared visual, same artwork/score as the source and detail. Only its
    // transform changes; no layout tween, screenshots, image copies or new library.
    Object.assign(element.style, { left: `${destination.left}px`, top: `${destination.top}px`, width: `${destination.width}px`, visibility: "visible", transformOrigin: "top left" });
    const animation = element.animate(badgeTransitionFrames(origin, destination, phase === "opening"), { duration: 320, easing: "cubic-bezier(.2,.65,.2,1)", fill: "both" });
    void animation.finished.then(finish, () => undefined);
    return () => animation.cancel();
  }, [phase, eventId, finishClose]);

  return { eventId, phase, open, close, heroRef, movingRef, moving: phase === "opening" || phase === "closing" };
}
