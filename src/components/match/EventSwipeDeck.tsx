"use client";

import React, { useState, useRef } from "react";
import { Event, UserVibeProfile } from "@/lib/mocks";
import { SwipeCard } from "./SwipeCard";
import { SwipeControls } from "./SwipeControls";
import { Sparkles, RotateCcw, SlidersHorizontal, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventSwipeDeckProps {
  events: Event[];
  vibeProfile: UserVibeProfile;
  onSwipe: (eventId: string, direction: "like" | "pass" | "superlike") => void;
  onOpenPreferences: () => void;
  onResetSwipes: () => void;
  swipedIds: Record<string, string>;
}

export function EventSwipeDeck({
  events,
  vibeProfile,
  onSwipe,
  onOpenPreferences,
  onResetSwipes,
  swipedIds,
}: EventSwipeDeckProps) {
  // Filter out swiped events
  const remainingEvents = events.filter((e) => !swipedIds[e.id]);

  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitAnimation, setExitAnimation] = useState<"like" | "pass" | "superlike" | null>(null);

  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentEvent = remainingEvents[0];
  const nextEvent = remainingEvents[1];
  const thirdEvent = remainingEvents[2];

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!currentEvent || exitAnimation) return;
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const executeSwipe = (direction: "like" | "pass" | "superlike") => {
    if (!currentEvent) return;
    setExitAnimation(direction);

    setTimeout(() => {
      onSwipe(currentEvent.id, direction);
      setDragOffset({ x: 0, y: 0 });
      setExitAnimation(null);
      setIsDragging(false);
    }, 280);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    const thresholdX = 100;
    const thresholdY = -90;

    if (dragOffset.y < thresholdY && Math.abs(dragOffset.x) < 90) {
      executeSwipe("superlike");
    } else if (dragOffset.x > thresholdX) {
      executeSwipe("like");
    } else if (dragOffset.x < -thresholdX) {
      executeSwipe("pass");
    } else {
      // Revert smoothly
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Card Transform Styles
  const getCardStyle = () => {
    if (exitAnimation === "like") {
      return {
        transform: "translate3d(120vw, 30px, 0) rotate(25deg)",
        opacity: 0,
        transition: "transform 0.3s ease-in, opacity 0.25s ease-in",
      };
    }
    if (exitAnimation === "pass") {
      return {
        transform: "translate3d(-120vw, 30px, 0) rotate(-25deg)",
        opacity: 0,
        transition: "transform 0.3s ease-in, opacity 0.25s ease-in",
      };
    }
    if (exitAnimation === "superlike") {
      return {
        transform: "translate3d(0, -120vh, 0) scale(1.1)",
        opacity: 0,
        transition: "transform 0.3s ease-in, opacity 0.25s ease-in",
      };
    }
    if (isDragging) {
      const rotation = dragOffset.x * 0.07;
      return {
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`,
        transition: "none",
        cursor: "grabbing",
      };
    }
    return {
      transform: "translate3d(0, 0, 0) rotate(0deg)",
      transition: "transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)",
    };
  };

  if (!currentEvent) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-5 my-auto min-h-[500px] rounded-3xl bg-[#14171F]/80 border border-white/10 shadow-2xl backdrop-blur-xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] flex items-center justify-center border border-[#D4FF00]/30 shadow-lg shadow-[#D4FF00]/10 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-1.5 max-w-xs">
          <h3 className="text-lg font-black uppercase tracking-wider text-white">
            ¡Has visto todos los eventos!
          </h3>
          <p className="text-xs text-neutral-400 font-medium leading-relaxed">
            No hay más eventos por ahora en tu zona. Puedes reiniciar tus swipes o cambiar tus filtros de vibra para encontrar más crews.
          </p>
        </div>

        <div className="flex flex-col w-full gap-2.5 pt-2 max-w-xs">
          <button
            type="button"
            onClick={onResetSwipes}
            className="w-full py-3 px-4 rounded-full bg-[#D4FF00] text-neutral-950 font-black uppercase tracking-wider text-xs shadow-lg shadow-[#D4FF00]/20 flex items-center justify-center gap-2 hover:bg-[#bce400] active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>Volver a Explorar</span>
          </button>

          <button
            type="button"
            onClick={onOpenPreferences}
            className="w-full py-3 px-4 rounded-full bg-white/10 text-white font-black uppercase tracking-wider text-xs border border-white/10 flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Cambiar Filtros de Vibra</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 3D Stack Container */}
      <div className="relative w-full aspect-[2/3] max-w-sm mx-auto touch-none select-none">
        {/* 3rd Card Background Preview */}
        {thirdEvent && (
          <div className="absolute inset-0 rounded-3xl scale-[0.88] translate-y-6 opacity-40 blur-[1px] bg-neutral-900 border border-white/5 pointer-events-none -z-20 transition-transform duration-300" />
        )}

        {/* 2nd Card (Underneath next in line) */}
        {nextEvent && (
          <div
            className="absolute inset-0 rounded-3xl scale-[0.94] translate-y-3 opacity-80 pointer-events-none -z-10 transition-transform duration-300 shadow-xl"
            style={{
              transform: isDragging
                ? `scale(${0.94 + Math.min(Math.abs(dragOffset.x) / 1000, 0.05)}) translateY(${3 - Math.min(Math.abs(dragOffset.x) / 50, 2)}px)`
                : "scale(0.94) translateY(8px)",
            }}
          >
            <SwipeCard
              event={nextEvent}
              isTopCard={false}
              vibeProfile={vibeProfile}
            />
          </div>
        )}

        {/* Top Active Card (Swipable) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={getCardStyle()}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing will-change-transform z-10"
        >
          <SwipeCard
            event={currentEvent}
            isTopCard={true}
            dragOffset={dragOffset}
            vibeProfile={vibeProfile}
          />
        </div>
      </div>

      {/* Floating Controls Bar */}
      <SwipeControls
        onPass={() => executeSwipe("pass")}
        onLike={() => executeSwipe("like")}
        onSuperlike={() => executeSwipe("superlike")}
        onOpenPreferences={onOpenPreferences}
        disabled={!!exitAnimation}
      />
    </div>
  );
}
