"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Home,
  Calendar,
  Sparkles,
  MessageSquare,
  User,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { QuickActionMenu } from "@/components/ui/QuickActionMenu";

const NAV_ITEMS = [
  { label: "Feed", href: "/feed", icon: Home },
  { label: "Eventos", href: "/events", icon: Calendar },
  { label: "Crews", href: "/match", icon: Sparkles },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Perfil", href: "/profile", icon: User },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 60) {
        setIsVisible(true);
      } else if (
        currentScrollY > lastScrollY.current &&
        currentScrollY - lastScrollY.current > 8
      ) {
        setIsVisible(false); // Al scrollear hacia abajo se oculta para no tapar contenido
      } else if (lastScrollY.current - currentScrollY > 8) {
        setIsVisible(true); // Al scrollear hacia arriba vuelve a aparecer
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
    pathname === "/complete-profile" ||
    pathname === "/kyc";

  // Determinamos si deberíamos ocultar la barra en mobile según la ruta
  const hideOnMobile =
    pathname === "/search" ||
    pathname.startsWith("/transfers/") ||
    pathname.startsWith("/posts/") ||
    pathname.startsWith("/events/") ||
    pathname.startsWith("/communities/") ||
    pathname.startsWith("/chat/") ||
    searchParams.get("from") === "search";

  if (!mounted || isAuthOrOnboarding) return null;

  const isItemActive = (href: string) => {
    if (href === "/feed" && (pathname === "/" || pathname === "/feed"))
      return true;
    return (
      pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
    );
  };

  const isProfileActive = pathname.startsWith("/profile");

  // Items para la cápsula flotante de escritorio
  const desktopCenterItems = [
    { label: "Feed", href: "/feed", icon: Home },
    { label: "Eventos", href: "/events", icon: Calendar },
    ...(user
      ? [
          { label: "Crews", href: "/match", icon: Sparkles },
          { label: "Chat", href: "/chat", icon: MessageSquare },
        ]
      : []),
  ];

  // Items para el dock móvil (abajo)
  const visibleMobileItems = NAV_ITEMS.filter((item) => {
    if (!user && (item.label === "Crews" || item.label === "Chat")) {
      return false;
    }
    return true;
  }).map((item) => {
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
          isVisible
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
              href="/feed"
              title="root"
              aria-label="root home"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-7 h-7 rounded-xl bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-xs tracking-tighter shadow-[0_0_15px_rgba(212,255,0,0.35)] group-hover:scale-105 active:scale-95 transition-transform">
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
                  <img
                    src={user.avatarUrl}
                    alt={user.username || "Usuario"}
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-b from-[#D4FF00] to-lime-400 hover:brightness-105 text-neutral-950 transition-all text-xs font-black uppercase tracking-wider shadow-[0_4px_12px_rgba(212,255,0,0.35),inset_0_1px_1px_0_rgba(255,255,255,0.4)] active:scale-95"
              >
                <User className="w-3 h-3 stroke-[2.5]" />
                <span>Ingresar</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Mobile Native iOS Liquid Glass Tab Bar (Human Interface Guidelines) */}
      <nav
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 md:hidden transition-transform duration-300 ease-out select-none",
          hideOnMobile ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100",
        )}
      >
        {/* iOS Frosted Glass Layer con Specular Hairline Rim */}
        <div className="relative w-full border-t border-white/[0.1] bg-[#0B0D10]/80 backdrop-blur-3xl backdrop-saturate-200 pt-2 pb-[max(env(safe-area-inset-bottom,0px),16px)] shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
          {/* Specular hairline top rim light (0.5px Apple feel) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="flex items-center justify-around w-full max-w-md mx-auto px-1">
            {visibleMobileItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ||
                (item.label === "Perfil" && isProfileActive);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className="relative flex-1 flex flex-col items-center justify-center py-1 transition-transform duration-150 active:scale-[0.88] cursor-pointer group"
                >
                  {/* Subtle Electric Volt radial glow behind active icon */}
                  {isActive && (
                    <span className="pointer-events-none absolute top-0 w-8 h-8 rounded-full bg-[#D4FF00]/12 blur-md -z-10 animate-fade-in" />
                  )}

                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={cn(
                        "w-[22px] h-[22px] transition-all duration-200",
                        isActive
                          ? "stroke-[2.2] text-[#D4FF00] drop-shadow-[0_0_8px_rgba(212,255,0,0.45)]"
                          : "stroke-[1.75] text-[#8E8E93] group-hover:text-white",
                      )}
                    />
                  </div>

                  {/* Native iOS SF Pro Title Case Label */}
                  <span
                    className={cn(
                      "text-[10px] tracking-tight mt-1 transition-colors leading-none",
                      isActive
                        ? "font-semibold text-[#D4FF00]"
                        : "font-medium text-[#8E8E93] group-hover:text-white",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <QuickActionMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}
