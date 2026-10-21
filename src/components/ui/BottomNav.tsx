"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Users,
  User,
} from "lucide-react";
import { DancerIcon } from "@/components/ui/DancerIcon";
import { cn, isValidImageUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { QuickActionMenu } from "@/components/ui/QuickActionMenu";
import { Avatar } from "@/components/ui/Avatar";
import { Capacitor } from "@capacitor/core";

const subscribeMounted = () => () => {};

const NAV_ITEMS = [
  { label: "Eventos", href: "/events", icon: Calendar },
  { label: "Crews", href: "/match", icon: DancerIcon },
  { label: "Comunidades", href: "/communities", icon: Users },
  { label: "Perfil", href: "/profile", icon: User },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const [isMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const lastScrollY = useRef(0);

  const isIOS =
    typeof window !== "undefined" &&
    (Capacitor.getPlatform() === "ios" ||
      document.documentElement.classList.contains("platform-ios") ||
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  useEffect(() => {
    setIsCompact(false);
    setIsVisible(true);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Al inicio de la página (< 30px) siempre vuelve a su tamaño original
      if (currentScrollY <= 30) {
        setIsCompact(false);
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const delta = currentScrollY - lastScrollY.current;

      // Al scrollear hacia abajo: la tabbar se achica (efecto Instagram)
      if (delta > 8) {
        setIsCompact(true);
        setIsVisible(false); // Para el header flotante de desktop
      }
      // Al scrollear hacia arriba: la tabbar vuelve al tamaño original
      else if (delta < -8) {
        setIsCompact(false);
        setIsVisible(true); // Para el header flotante de desktop
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [router]);

  // Ocultar barra completamente en flujos de autenticación / onboarding / KYC
  const isAuthOrOnboarding =
    pathname === "/register" ||
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/complete-profile" ||
    pathname === "/kyc";

  // Determinamos si deberíamos ocultar la barra en mobile según la ruta
  const hideOnMobile =
    (pathname === "/chat" &&
      (searchParams.get("from") === "feed" ||
        searchParams.get("from") === "events")) ||
    pathname === "/search" ||
    pathname.startsWith("/transfers/") ||
    pathname.startsWith("/posts/") ||
    pathname.startsWith("/events/") ||
    pathname.startsWith("/communities/") ||
    pathname.startsWith("/chat/") ||
    searchParams.get("from") === "search";

  if (!mounted || isAuthOrOnboarding) return null;

  const isItemActive = (href: string) => {
    if (href === "/events" && (pathname === "/" || pathname === "/events"))
      return true;
    return (
      pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
    );
  };

  const isProfileActive = pathname.startsWith("/profile");

  // Items para la cápsula flotante de escritorio
  const desktopCenterItems = [
    { label: "Eventos", href: "/events", icon: Calendar },
    ...(user
      ? [
          { label: "Crews", href: "/match", icon: DancerIcon },
          { label: "Comunidades", href: "/communities", icon: Users },
        ]
      : []),
  ];

  // Items para el dock móvil (abajo)
  const visibleMobileItems = NAV_ITEMS.map((item) => {
    if (item.label === "Perfil") {
      if (user?.username) {
        return { ...item, href: `/profile/${user.username}` };
      }
      return { ...item, href: "/login" };
    }
    return item;
  });

  return (
    <>
      {/* 1. Desktop Top Floating Capsule (Estilo Glassmorphism Apple / Linear con Auto-Hide) */}
      <header
        className={cn(
          "hidden md:flex fixed top-4 inset-x-0 z-50 justify-center pointer-events-none px-4 sm:px-6 transition-all duration-300 ease-out",
          isVisible || pathname === "/events"
            ? "translate-y-0 opacity-100"
            : "-translate-y-24 opacity-0 pointer-events-none",
        )}
      >
        <div className="pointer-events-auto relative flex items-center justify-between w-full max-w-4xl h-14 rounded-full bg-gradient-to-b from-white/[0.09] via-neutral-950/75 to-[#0B0D10]/85 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.14] shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_0_rgba(255,255,255,0.22),inset_0_-1px_1px_0_rgba(0,0,0,0.5)] px-5 select-none transition-all duration-300 overflow-hidden">
          {/* Liquid Glass: Specular top edge highlight */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-80" />
          {/* Liquid Glass: Ambient soft refraction */}
          <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-20 bg-white/[0.03] blur-2xl rounded-full" />

          {/* Lado Izquierdo: Brand Logo de Root */}
          <div className="flex items-center gap-3 relative z-10">
            <Link
              href="/events"
              title="root"
              aria-label="root home"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-7 h-7 rounded-xl bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-xs tracking-tighter shadow-[0_6px_20px_rgba(212,255,0,0.16)] group-hover:scale-105 active:scale-95 transition-transform">
                r
              </div>
              <span className="text-lg font-black italic tracking-tighter text-white group-hover:text-[#D4FF00] transition-colors">
                root
              </span>
            </Link>
          </div>

          {/* Centro: Enlaces de Navegación Refinados (Liquid Glass Capsule) */}
          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-1.5 relative z-10"
          >
            {desktopCenterItems.map((item) => {
              const isActive = isItemActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs transition-all duration-200",
                    isActive
                      ? "text-white font-extrabold bg-gradient-to-b from-white/[0.14] to-white/[0.04] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2),0_2px_8px_rgba(0,0,0,0.4)] border border-white/[0.12]"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.05] font-medium",
                  )}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]" />
                  )}
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5 transition-colors",
                      isActive
                        ? "stroke-[2.2] text-[#D4FF00]"
                        : "stroke-[1.8] text-neutral-400",
                    )}
                  />
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Lado Derecho: Perfil / Acceso (Limpio y minimalista, sin Crear ni buscador duplicado) */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href={`/profile/${user.username || ""}`}
                title="Mi Perfil"
                className={cn(
                  "flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border transition-all duration-200 active:scale-95",
                  isProfileActive
                    ? "bg-gradient-to-b from-white/[0.15] to-white/[0.05] border-[#D4FF00]/50 text-white shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.2)]"
                    : "bg-white/[0.04] border-white/10 text-neutral-300 hover:text-white hover:border-white/25 hover:bg-white/[0.08]",
                )}
              >
                {user.avatarUrl ? (
                  <Avatar
                    src={user.avatarUrl}
                    fallback={user.username || "Usuario"}
                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black",
                      isProfileActive
                        ? "bg-[#D4FF00] text-neutral-950"
                        : "bg-neutral-800 text-neutral-300",
                    )}
                  >
                    {user.username ? (
                      user.username.charAt(0).toUpperCase()
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                  </div>
                )}
                <span className="text-xs font-semibold truncate max-w-[110px]">
                  {user.username ? `@${user.username}` : "Perfil"}
                </span>
                {isProfileActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_6px_#D4FF00]" />
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#D4FF00] hover:brightness-105 text-neutral-950 transition-all text-xs font-black uppercase tracking-wider shadow-[0_6px_20px_rgba(212,255,0,0.16)] active:scale-95"
              >
                <User className="w-3 h-3 stroke-[2.5]" />
                <span>Ingresar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Mobile Floating Bottom Dock (Pill inferior para móviles) */}
      <nav
        aria-label="Navegación principal móvil"
        inert={hideOnMobile}
        aria-hidden={hideOnMobile || undefined}
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-7 flex justify-center transition-all duration-300 ease-out md:hidden",
          isIOS
            ? "bottom-[max(0.75rem,var(--root-safe-bottom))]"
            : "bottom-[var(--root-mobile-nav-bottom)]",
          hideOnMobile
            ? "translate-y-32 opacity-0 pointer-events-none"
            : isCompact
              ? "translate-y-1"
              : "translate-y-0",
        )}
      >
        <div
          className={cn(
            "liquid-glass-dock rounded-full flex items-center justify-around transition-all duration-300 ease-out w-full",
            isCompact
              ? "max-w-xs h-12 p-1 shadow-[0_16px_36px_rgba(0,0,0,0.85)] scale-95"
              : "max-w-md h-14 p-1 shadow-[0_20px_50px_rgba(0,0,0,0.7)] scale-100",
          )}
        >
          {/* Liquid Glass: Specular top edge highlight */}
          <div className="liquid-glass-specular" />
          {/* Liquid Glass: Ambient soft refraction */}
          <div className="liquid-glass-refraction -top-8 left-1/2 -translate-x-1/2 w-64 h-16" />

          {visibleMobileItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ||
              (item.label === "Perfil" && isProfileActive);
            const Icon = item.icon;
            const isProfileItem = item.label === "Perfil";

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative min-w-0 flex flex-1 items-center justify-center rounded-full select-none transition-all duration-200 group z-10",
                  isCompact ? "h-10" : "h-12",
                  isActive
                    ? "text-[#D4FF00]"
                    : "text-neutral-400 hover:text-white",
                )}
              >
                {isActive && (
                  <span
                    className={cn(
                      "absolute rounded-full -z-10 transition-all duration-200 animate-fade-in",
                      "bg-gradient-to-b from-white/[0.18] to-white/[0.06] border border-white/[0.16]",
                      "shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_4px_14px_rgba(0,0,0,0.4)]",
                      isCompact ? "w-[80%] max-w-[64px] h-9" : "w-[88%] max-w-[84px] h-11",
                    )}
                  />
                )}

                {/* Si es el tab de Perfil y el usuario está logueado: mostrar miniatura tipo Instagram */}
                {isProfileItem && user ? (
                  isValidImageUrl(user.avatarUrl) ? (
                    <div
                      className={cn(
                        "relative rounded-full overflow-hidden shrink-0 transition-all duration-200 group-active:scale-90",
                        isCompact ? "w-5.5 h-5.5" : "w-6.5 h-6.5",
                        isActive
                          ? "ring-2 ring-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.45)]"
                          : "ring-1 ring-white/20 opacity-75 group-hover:opacity-100",
                      )}
                    >
                      <img
                        src={user.avatarUrl.trim()}
                        alt={user.username || "Perfil"}
                        className="aspect-square h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-full flex items-center justify-center font-black transition-all duration-200 group-active:scale-90 shrink-0",
                        isCompact ? "w-5.5 h-5.5 text-[10px]" : "w-6.5 h-6.5 text-xs",
                        isActive
                          ? "bg-[#D4FF00]/15 text-[#D4FF00] ring-2 ring-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.4)]"
                          : "bg-white/[0.08] text-neutral-300 ring-1 ring-white/15",
                      )}
                    >
                      {user.username ? (
                        user.username.charAt(0).toUpperCase()
                      ) : (
                        <User
                          className={cn(
                            isCompact ? "w-4 h-4" : "w-4.5 h-4.5",
                            isActive ? "text-[#D4FF00]" : "text-neutral-400",
                          )}
                        />
                      )}
                    </div>
                  )
                ) : (
                  <Icon
                    className={cn(
                      "transition-all duration-200 group-active:scale-90 flex-shrink-0",
                      isCompact ? "w-5 h-5" : "w-6 h-6",
                      isActive
                        ? "stroke-[2.25] text-[#D4FF00] drop-shadow-[0_0_10px_rgba(212,255,0,0.45)]"
                        : "stroke-[1.75] text-neutral-400 group-hover:text-neutral-200",
                    )}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <QuickActionMenu
        isOpen={isMenuOpen}
        onClose={() => {}}
      />
    </>
  );
}
