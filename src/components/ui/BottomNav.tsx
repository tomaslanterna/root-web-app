"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Calendar, Ticket, MessageSquare, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { QuickActionMenu } from "@/components/ui/QuickActionMenu";

const NAV_ITEMS = [
  { label: "Feed", href: "/feed", icon: Home },
  { label: "Eventos", href: "/events", icon: Calendar },
  { label: "Transfer", href: "/transfers", icon: Ticket },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Perfil", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determinamos si deberíamos ocultar la barra en mobile según la ruta
  const hideOnMobile = 
    pathname === "/register" ||
    pathname === "/search" ||
    pathname.startsWith("/transfers/") ||
    pathname.startsWith("/posts/") ||
    pathname.startsWith("/events/") ||
    pathname.startsWith("/communities/") ||
    pathname.startsWith("/chat/") ||
    searchParams.get("from") === "search";

  if (!mounted) return null;

  const visibleItems = NAV_ITEMS.map((item) => {
    if (item.label === "Perfil" && user?.username) {
      return { ...item, href: `/profile/${user.username}` };
    }
    return item;
  }).filter((item) => {
    // Esconder Chat y Transfer si no hay usuario logueado
    if ((item.href === "/chat" || item.href === "/transfers") && !user) return false;
    return true;
  });

  return (
    <>
      <nav className={cn(
        // Estilos base (Móvil)
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 transition-transform duration-300",
        hideOnMobile ? "translate-y-32 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto" : "",
        // Estilos Desktop (Sidebar)
        "md:bottom-auto md:left-0 md:top-0 md:h-screen md:w-60 md:flex-col md:justify-between md:py-6 md:px-3 md:bg-[#0B0D10] md:rounded-none md:border-r md:border-white/10 md:translate-x-0",
        pathname === "/register" || pathname === "/login" ? "hidden" : ""
      )}>
        <div className={cn(
          // Mobile styles (pill container)
          "glass-obsidian w-full rounded-full p-1.5 flex items-center justify-around shadow-2xl backdrop-blur-2xl border border-white/10",
          // Desktop styles (flat container)
          "md:!bg-transparent md:!backdrop-blur-none md:!border-none md:!shadow-none md:p-0 md:flex-col md:items-start md:justify-start md:gap-1.5 md:w-full"
        )}>
          {/* Desktop Logo (hidden on mobile) */}
          <div className="hidden md:flex mb-6 px-3 w-full items-center">
            <Link href="/" title="root" aria-label="root home" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-2xl bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-base tracking-tighter shadow-md shadow-[#D4FF00]/15 group-hover:scale-105 active:scale-95 transition-transform">
                r
              </div>
              <span className="text-xl font-black italic tracking-tighter text-white group-hover:text-neutral-200 transition-colors">
                root
              </span>
            </Link>
          </div>

          {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ||
                (item.label === "Perfil" && pathname.startsWith("/profile"));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className={cn(
                    // Mobile styles
                    "relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-full select-none transition-all duration-200 group",
                    // Desktop styles
                    "md:flex-row md:justify-start md:py-2.5 md:px-3.5 md:rounded-2xl md:w-full",
                    isActive
                      ? "text-neutral-950 font-black md:bg-[#D4FF00] md:shadow-md md:shadow-[#D4FF00]/20"
                      : "text-neutral-400 hover:text-white md:hover:bg-white/5"
                  )}
                >
                  {/* Active Indicator Backdrop Pill */}
                  {isActive && (
                    <span className="md:hidden absolute inset-0 bg-[#D4FF00] rounded-full shadow-md shadow-[#D4FF00]/15 animate-fade-in -z-10" />
                  )}

                  <Icon
                    className={cn(
                      "w-5 h-5 md:mr-3.5 transition-transform duration-200 group-active:scale-90 flex-shrink-0",
                      isActive ? "stroke-[2.5] text-neutral-950" : "stroke-[1.8]"
                    )}
                  />
                  <span
                    className={cn(
                      // Mobile styles
                      "text-[9px] uppercase tracking-wider font-black mt-0.5 transition-colors",
                      // Desktop styles
                      "md:text-sm md:capitalize md:tracking-normal md:font-extrabold md:mt-0",
                      isActive
                        ? "text-neutral-950 md:font-black"
                        : "text-neutral-400 md:text-neutral-300 group-hover:text-white"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
            
            {/* Desktop Action Button: Crear (hidden on mobile) */}
            <div className="hidden md:block w-full pt-1">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                title="Crear"
                aria-label="Crear"
                className={cn(
                  "relative flex items-center py-2.5 px-3.5 rounded-2xl w-full select-none transition-all duration-200 group cursor-pointer",
                  isMenuOpen
                    ? "bg-[#D4FF00] text-neutral-950 font-black shadow-md shadow-[#D4FF00]/20"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="w-5 h-5 md:mr-3.5 flex items-center justify-center flex-shrink-0">
                  <Plus
                    className={cn(
                      "w-5 h-5 transition-transform duration-200 group-hover:rotate-90 group-active:scale-90",
                      isMenuOpen ? "stroke-[2.5] text-neutral-950" : "stroke-[2.2] text-[#D4FF00]"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-sm font-extrabold tracking-normal transition-colors",
                    isMenuOpen ? "text-neutral-950 font-black" : "text-neutral-300 group-hover:text-white"
                  )}
                >
                  Crear
                </span>
              </button>
            </div>
        </div>
        
        {/* Desktop empty spacer for bottom area */}
        <div className="hidden md:block w-full" />
      </nav>

      <QuickActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
