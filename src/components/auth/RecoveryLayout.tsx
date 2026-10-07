import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function RecoveryLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="min-h-[100dvh] flex flex-col justify-center bg-obsidian px-6 pt-safe-header pb-[calc(2rem+var(--root-safe-bottom))] text-white">
      <div className="w-full max-w-sm mx-auto space-y-7 py-8">
        <Link href="/login" className="inline-flex items-center gap-2 min-h-11 text-sm text-neutral-400 hover:text-white focus-visible:outline-2 focus-visible:outline-acid-lime rounded">
          <ArrowLeft size={18} aria-hidden="true" /> Volver al login
        </Link>
        <div className="space-y-3">
          <p className="text-3xl font-black tracking-tighter">root<span className="text-acid-lime">.</span></p>
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
