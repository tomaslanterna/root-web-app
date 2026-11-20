"use client";

import React, { useState, useRef, useEffect } from 'react';
import { RootMark } from '@/components/ui/RootLogo';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Permite arrastrar con el mouse (desktop). Fuera del home se apaga para no pelear con selecciones y sliders. */
  mouse?: boolean;
}

/** true si el toque empezó dentro de algo que ya tiene scroll propio hacia abajo (chat, modal, lista interna). */
function startsInScrolledArea(target: EventTarget | null) {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body) {
    if (node.scrollTop > 0) return true;
    node = node.parentElement;
  }
  return false;
}

/**
 * Header de la pantalla: el primer <header> fijo o sticky pegado arriba. El ícono sale por debajo de él
 * y, si está dentro del contenido que baja, se lo compensa para que no se mueva.
 */
function findTopHeader() {
  for (const header of Array.from(document.querySelectorAll("header"))) {
    const { position } = getComputedStyle(header);
    if (position !== "sticky" && position !== "fixed") continue;
    const rect = header.getBoundingClientRect();
    if (rect.height > 0 && rect.top <= 1) return header;
  }
  return null;
}

export function PullToRefresh({ onRefresh, children, mouse = true }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullActive, setPullActive] = useState(false);
  
  const startY = useRef(0);
  const startX = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerBottom, setHeaderBottom] = useState(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Solo permitir pull si el usuario está hasta arriba del todo
    if (!('touches' in e) && !mouse) return;
    if (window.scrollY <= 0 && !startsInScrolledArea(e.target)) {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startY.current = clientY;
      startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
      isPulling.current = true;
      setPullActive(true);
      const header = findTopHeader();
      // Solo se compensa el header que está dentro del contenido que baja con el gesto.
      headerRef.current = header && contentRef.current?.contains(header) ? header : null;
      setHeaderBottom(header ? header.getBoundingClientRect().bottom : 0);
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

  // El header que baja con el contenido se corre hacia arriba lo mismo, así queda quieto.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    header.style.transition = pullActive ? "none" : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)";
    header.style.transform = pullY > 0 ? `translateY(${-pullY}px)` : "";
  }, [pullY, pullActive]);

  // El ícono asoma desde abajo del header y queda centrado en el hueco que abre el gesto.
  const iconY = Math.min(pullY - 30, (pullY - 30) / 2);

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
        aria-label={refreshing ? "Actualizando" : "Deslizá para actualizar"}
        className="pointer-events-none fixed inset-x-0 z-50 h-24 overflow-hidden"
        style={{ top: headerBottom, visibility: pullY > 0 ? "visible" : "hidden" }}
      >
        <div
          className="flex w-full justify-center"
          style={{
            transform: `translateY(${iconY}px)`,
            opacity: Math.min(1, pullY / 42),
            transition: pullActive ? "none" : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s",
          }}
        >
          <RootMark size={30} className="shadow-[0_0_14px_rgba(212,255,0,0.28)] motion-safe:animate-pulse" />
        </div>
      </div>

      {/* Contenido principal animado hacia abajo */}
      <div
        ref={contentRef}
        style={{
          // Sin transform en reposo: un transform rompería los position: fixed de la página (headers, modales).
          transform: pullY > 0 ? `translateY(${pullY}px)` : undefined,
          transition: pullActive ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
}
