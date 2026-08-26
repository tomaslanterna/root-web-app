"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Calendar, Ticket, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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
  
  if (
    pathname === "/register" ||
    pathname === "/search" ||
    searchParams.get("from") === "search"
  ) return null;

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
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="glass-obsidian rounded-full p-1.5 flex items-center justify-around shadow-2xl backdrop-blur-2xl border border-white/10">
        {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.label === "Perfil" && pathname.startsWith("/profile/"));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-full transition-all duration-300 group select-none",
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
                    "w-5 h-5 transition-transform duration-200 group-active:scale-90",
                    isActive ? "stroke-[2.5] text-neutral-950" : "stroke-[1.8]"
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-wider font-black mt-0.5 transition-colors",
                    isActive ? "text-neutral-950" : "text-neutral-400"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
