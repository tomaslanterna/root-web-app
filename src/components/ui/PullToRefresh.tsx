"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
 * y, si está dentro del contenido que baja, se lo compensa para que no se mueva. Si el pull to refresh
 * vive dentro de una capa (la bandeja de mensajes abierta sobre el home), se busca el header de esa capa.
 */
function findTopHeader(scope: ParentNode) {
  for (const header of Array.from(scope.querySelectorAll("header"))) {
    const style = getComputedStyle(header);
    if (style.position !== "sticky" && style.position !== "fixed") continue;
    const rect = header.getBoundingClientRect();
    // Se mide sin los desplazamientos del gesto (el del contenido y el que le pone este componente al header).
    const top = rect.top - translateY(header) - translateY(header.closest("[data-ptr-content]"));
    if (rect.height > 0 && top <= 1) return header;
  }
  return null;
}

function translateY(el: Element | null) {
  if (!el) return 0;
  const { transform } = getComputedStyle(el);
  return transform && transform !== "none" ? new DOMMatrixReadOnly(transform).m42 : 0;
}

export function PullToRefresh({ onRefresh, children, mouse = true }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullActive, setPullActive] = useState(false);
  
  const startY = useRef(0);
  const startX = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerBottom, setHeaderBottom] = useState(0);

  // La capa (dialog) donde vive este pull to refresh, si hay una: tiene su propio scroll, no el de la ventana.
  const layer = () => rootRef.current?.closest<HTMLElement>('[role="dialog"]') ?? null;
  const isAtTop = () => (layer() ? true : window.scrollY <= 0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Solo permitir pull si el usuario está hasta arriba del todo
    if (!('touches' in e) && !mouse) return;
    // Un toque dentro de una capa (dialog) le toca al pull to refresh de esa capa, no al de la pantalla de abajo.
    const dialog = e.target instanceof Element ? e.target.closest('[role="dialog"]') : null;
    if (dialog && !dialog.contains(rootRef.current)) return;
    if (isAtTop() && !startsInScrolledArea(e.target)) {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startY.current = clientY;
      startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
      isPulling.current = true;
      setPullActive(true);
      const header = findTopHeader(layer() ?? document);
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
    if (diff > 0 && isAtTop()) {
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

  // El header que baja con el contenido se corre hacia arriba lo mismo, así queda quieto. Al soltar, la página se
  // vuelve a montar mientras el contenido sigue corrido: el header nuevo se compensa apenas aparece, sin animar,
  // para que no se lo vea un momento más abajo.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const transition = pullActive ? "none" : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)";

    const sync = () => {
      const previous = headerRef.current;
      const header = pullY > 0 ? findTopHeader(content) : previous?.isConnected ? previous : null;
      if (previous && previous !== header) {
        previous.style.transition = "";
        previous.style.transform = "";
      }
      headerRef.current = header;
      if (!header) return;
      if (header !== previous) {
        // Recién aparecido: arranca compensando lo que el contenido está corrido ahora mismo (puede estar
        // animándose de 80 a 60 px) y sigue con la misma transición que él.
        header.style.transition = "none";
        header.style.transform = `translateY(${-translateY(content)}px)`;
        void header.offsetHeight;
      }
      header.style.transition = transition;
      header.style.transform = pullY > 0 ? `translateY(${-pullY}px)` : "";
    };
    sync();

    if (pullY <= 0) return;
    const observer = new MutationObserver(() => {
      if (!headerRef.current?.isConnected) sync();
      else if (headerRef.current && findTopHeader(content) !== headerRef.current) sync();
    });
    observer.observe(content, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pullY, pullActive]);

  // El ícono asoma desde abajo del header y queda centrado en el hueco que abre el gesto.
  const iconY = Math.min(pullY - 30, (pullY - 30) / 2);

  return (
    <div 
      ref={rootRef}
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
          <RootMark size={34} className="shadow-[0_0_14px_rgba(212,255,0,0.28)]" />
        </div>
      </div>

      {/* Contenido principal animado hacia abajo */}
      <div
        ref={contentRef}
        data-ptr-content
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
