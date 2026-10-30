"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Users,
  User,
} from "lucide-react";
import { DiscoBallIcon } from "@/components/ui/DancerIcon";
import { cn, isValidImageUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { QuickActionMenu } from "@/components/ui/QuickActionMenu";
import { Avatar } from "@/components/ui/Avatar";
import { Capacitor } from "@capacitor/core";

const subscribeMounted = () => () => {};

const NAV_ITEMS = [
  { label: "Eventos", href: "/events", icon: Calendar },
  { label: "Crews", href: "/match", icon: DiscoBallIcon },
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
  const lastScrollY = useRef(0);

  const isIOS =
    typeof window !== "undefined" &&
    (Capacitor.getPlatform() === "ios" ||
      document.documentElement.classList.contains("platform-ios") ||
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  useEffect(() => {
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
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const delta = currentScrollY - lastScrollY.current;

      // Al scrollear hacia abajo se oculta el header flotante de desktop
      if (delta > 8) {
        setIsVisible(false); // Para el header flotante de desktop
      }
      // Al scrollear hacia arriba vuelve a aparecer
      else if (delta < -8) {
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

  // Ocultar barra en registro, recuperación, onboarding y KYC (en /login se ve, como invitado)
  const isAuthOrOnboarding =
    pathname === "/register" ||
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
    pathname.startsWith("/crews/") ||
    pathname.startsWith("/dance-ranker") ||
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
          { label: "Crews", href: "/match", icon: DiscoBallIcon },
          { label: "Comunidades", href: "/communities", icon: Users },
        ]
      : []),
  ];

  // Items para el dock móvil (abajo)
  // Sin sesión solo se ven Eventos e Ingresar.
  const visibleMobileItems = NAV_ITEMS.filter(
    (item) => user || item.label === "Eventos" || item.label === "Perfil",
  ).map((item) => {
    if (item.label === "Perfil") {
      if (user?.username) {
        return { ...item, href: `/profile/${user.username}` };
      }
      return { ...item, label: "Ingresar", href: "/login" };
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

      {/* 2. Dock inferior móvil: icono + etiqueta, el activo con fondo lima suave */}
      <nav
        aria-label="Navegación principal móvil"
        inert={hideOnMobile}
        aria-hidden={hideOnMobile || undefined}
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 flex justify-center transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-opacity md:hidden",
          isIOS
            ? "bottom-[max(0.75rem,var(--root-safe-bottom))]"
            : "bottom-[var(--root-mobile-nav-bottom)]",
          hideOnMobile
            ? "translate-y-32 opacity-0 pointer-events-none"
            : "translate-y-0",
        )}
      >
        <div className="w-full h-16 px-1.5 flex items-center justify-around gap-1 rounded-hero bg-[#15171B] border border-line shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
          {visibleMobileItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ||
              (item.label === "Perfil" && isProfileActive);
            const Icon = item.icon;
            const showAvatar =
              item.label === "Perfil" && isValidImageUrl(user?.avatarUrl);

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex-1 min-w-0 h-[52px] rounded-card flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-accent",
                  isActive ? "bg-accent/10 text-ink" : "text-[#8A9099] hover:text-ink",
                )}
              >
                {showAvatar ? (
                  <img
                    src={user!.avatarUrl!.trim()}
                    alt=""
                    className={cn(
                      "size-[22px] rounded-full object-cover",
                      isActive ? "ring-2 ring-accent" : "ring-1 ring-white/20",
                    )}
                  />
                ) : (
                  <Icon
                    aria-hidden="true"
                    className={cn("size-[22px]", isActive && "text-accent")}
                    strokeWidth={2}
                  />
                )}
                <span className="truncate max-w-full px-1">{item.label}</span>
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
