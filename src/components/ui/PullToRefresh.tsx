"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Solo permitir pull si el usuario está hasta arriba del todo
    if (window.scrollY <= 0) {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startY.current = clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isPulling.current || refreshing) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
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
      {/* Indicador de carga (spinner o flecha) */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center z-50 pointer-events-none transition-transform"
        style={{ 
          transform: `translateY(${pullY > 0 ? pullY - 40 : -40}px)`,
          opacity: pullY / 60 
        }}
      >
        <div className="w-10 h-10 rounded-full bg-[#14171F] flex items-center justify-center border border-[#D4FF00]/20 shadow-[0_0_15px_rgba(212,255,0,0.15)]">
          {refreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#D4FF00]" />
          ) : (
            <ArrowDown 
              className="w-5 h-5 text-[#D4FF00] transition-transform duration-200" 
              style={{ transform: `rotate(${Math.min(pullY * 3, 180)}deg)` }} 
            />
          )}
        </div>
      </div>

      {/* Contenido principal animado hacia abajo */}
      <div 
        style={{ 
          transform: `translateY(${pullY}px)`, 
          transition: isPulling.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' 
        }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
}
