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
        "md:bottom-auto md:left-0 md:top-0 md:h-screen md:w-64 md:flex-col md:justify-between md:py-8 md:px-6 md:bg-[#0B0D10] md:rounded-none md:border-r md:border-white/10 md:translate-x-0",
        pathname === "/register" || pathname === "/login" ? "hidden" : ""
      )}>
        <div className={cn(
          // Mobile styles (pill container)
          "glass-obsidian w-full rounded-full p-1.5 flex items-center justify-around shadow-2xl backdrop-blur-2xl border border-white/10",
          // Desktop styles (flat container)
          "md:!bg-transparent md:!backdrop-blur-none md:!border-none md:!shadow-none md:p-0 md:flex-col md:items-start md:justify-start md:gap-4 md:w-full"
        )}>
          {/* Desktop Logo (hidden on mobile) */}
          <div className="hidden md:flex mb-10 px-4 w-full items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-[#D4FF00] text-neutral-950 flex items-center justify-center font-black italic text-sm tracking-tighter shadow-md shadow-[#D4FF00]/15 group-hover:scale-105 transition-transform">
                r
              </div>
              <h1 className="text-xl font-black italic tracking-tighter text-white group-hover:text-neutral-200 transition-colors">root</h1>
            </Link>
          </div>

          {visibleItems.map((item) => {
              const isActive = pathname === item.href || (item.label === "Perfil" && pathname.startsWith("/profile/"));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col md:flex-row items-center justify-center md:justify-start py-1.5 md:py-3 px-3.5 md:px-4 rounded-full w-full transition-all duration-300 group select-none",
                    isActive
                      ? "text-neutral-950 font-black"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  {/* Active Indicator Backdrop Pill */}
                  {isActive && (
                    <span className="absolute inset-0 bg-[#D4FF00] rounded-full shadow-md shadow-[#D4FF00]/15 animate-fade-in -z-10" />
                  )}

                  <Icon
                    className={cn(
                      "w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 group-active:scale-90 md:mr-4 flex-shrink-0",
                      isActive ? "stroke-[2.5] text-neutral-950" : "stroke-[1.8]"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] md:text-[15px] uppercase md:capitalize md:tracking-normal tracking-wider font-black md:font-bold mt-0.5 md:mt-0 transition-colors",
                      isActive ? "text-neutral-950" : "text-neutral-400 group-hover:text-white"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
            
            {/* Desktop Action Button (hidden on mobile) */}
            <div className="hidden md:block w-full mt-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="w-full bg-[#D4FF00] text-neutral-950 py-3 rounded-full hover:bg-[#bce400] active:scale-95 transition-all shadow-md shadow-[#D4FF00]/10 flex items-center justify-center gap-2 font-black uppercase tracking-wider"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Crear</span>
              </button>
            </div>
        </div>
        
        {/* Desktop empty spacer for bottom area */}
        <div className="hidden md:block px-4 w-full">
           {/* Here we can later add user mini-profile or settings shortcut */}
        </div>
      </nav>

      <QuickActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
