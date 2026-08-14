"use client";

import * as React from "react";
import { Plus, X, Image, Ticket, Users, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTIONS = [
  {
    title: "Nueva Publicación",
    description: "Comparte fotos, tracks o sets con la comunidad",
    icon: Image,
    href: "#",
    badge: "Feed",
  },
  {
    title: "Vender Entrada Reventa",
    description: "Publica tu ticket verificado de forma segura",
    icon: Ticket,
    href: "/resale",
    badge: "P2P",
  },
  {
    title: "Nueva Comunidad RRPP",
    description: "Crea tu grupo de listas, accesos y beneficio",
    icon: Users,
    href: "/communities",
    badge: "Social",
  },
  {
    title: "Verificación de Identidad",
    description: "Valida tu documento para comerciar entradas",
    icon: ShieldCheck,
    href: "/profile",
    badge: "KYC",
  },
];

export function QuickActionMenu({ isOpen, onClose }: QuickActionMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-2xl animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-[#0B0D10]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 z-10 animate-fade-in overflow-hidden text-white">
        {/* Glow accent element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4FF00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4FF00]" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Acciones Rápidas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                onClick={onClose}
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#14171F] hover:bg-[#D4FF00] hover:text-neutral-950 border border-white/10 hover:border-[#D4FF00] transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white/10 group-hover:bg-neutral-950 text-[#D4FF00] group-hover:text-[#D4FF00] border border-white/10 shadow-2xs transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-white group-hover:text-neutral-950">
                      {action.title}
                    </h3>
                    <p className="text-xs text-neutral-400 group-hover:text-neutral-900 font-medium">
                      {action.description}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 group-hover:bg-neutral-950/20 text-neutral-300 group-hover:text-neutral-950 transition-colors">
                  {action.badge}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

