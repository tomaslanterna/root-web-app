"use client";

import React, { useState, useRef, useEffect } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullActive, setPullActive] = useState(false);
  
  const startY = useRef(0);
  const startX = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Solo permitir pull si el usuario está hasta arriba del todo
    if (window.scrollY <= 0) {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startY.current = clientY;
      startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
      isPulling.current = true;
      setPullActive(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isPulling.current || refreshing) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    if (Math.abs(clientX - startX.current) > 12 && Math.abs(clientX - startX.current) > Math.abs(clientY - startY.current)) { isPulling.current = false; setPullActive(false); setPullY(0); return; }
    currentY.current = clientY;
    
    const diff = currentY.current - startY.current;

    // Solo activamos si el movimiento es hacia abajo
    if (diff > 0 && window.scrollY <= 0) {
      // Aplicar fricción (0.4) para que se sienta natural y topar en 80px
      setPullY(Math.min(diff * 0.4, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    setPullActive(false);

    if (pullY >= 60) {
      setRefreshing(true);
      setPullY(60); // Mantener el loader visible
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      // Si no jaló lo suficiente, lo devolvemos a 0 suavemente
      setPullY(0);
    }
  };

  // Add passive listeners for touchmove to prevent default scrolling when pulling
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (isPulling.current && pullY > 0) {
        if (e.cancelable) e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [pullY]);

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      className="relative w-full h-full"
    >
      {/* La marca baja con el gesto; no usa cápsula ni spinner circular. */}
      <div 
        role="status"
        aria-live="polite"
        aria-label={refreshing ? "Actualizando eventos" : "Deslizá para actualizar"}
        className="pointer-events-none absolute left-0 top-0 z-50 flex w-full justify-center"
        style={{ 
          transform: `translateY(${pullY > 0 ? pullY - 34 : -34}px)`,
          opacity: Math.min(1, pullY / 42),
        }}
      >
        <span
          aria-hidden="true"
          className={`root-logo-type text-3xl lowercase text-accent drop-shadow-[0_0_10px_rgba(212,255,0,0.35)] motion-safe:animate-pulse ${refreshing ? "opacity-100" : ""}`}
          style={{ transform: `scale(${0.78 + Math.min(pullY, 60) / 270})` }}
        >
          r
        </span>
      </div>

      {/* Contenido principal animado hacia abajo */}
      <div 
        style={{ 
          transform: `translateY(${pullY}px)`, 
          transition: pullActive ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
}
