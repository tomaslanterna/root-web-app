import { ChevronDown, Sparkles } from "lucide-react";
import type { EventBadge } from "@/types/badges";
import { EventBadgeArtwork } from "./EventBadgeArtwork";

const designs = [
  { appearance: "reviewed", title: "Reseñada", description: "Flyer a color y arco verde según tu nota." },
  { appearance: "unreviewed", title: "Sin reseñar", description: "Flyer atenuado, indicador «Reseñar» y arco inactivo." },
  { appearance: "mostDanced", title: "La más bailada", description: "Corona y laureles lima distinguen tu fiesta con más pasos." },
] as const;

export function BadgeDesignGuide({ example }: { example?: EventBadge }) {
  return (
    <details className="group border-y border-white/[.07]">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00] [&::-webkit-details-marker]:hidden">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4FF00]/10 text-[#D4FF00]"><Sparkles size={15} aria-hidden="true" /></span>
        <span className="min-w-0"><span className="data-display block text-xs text-neutral-200">Cómo leer tus insignias</span><span className="mt-0.5 block text-[10px] font-bold italic tracking-[-.035em] text-neutral-600">Color, progreso y actividad de cada noche</span></span>
        <ChevronDown size={15} aria-hidden="true" className="ml-auto shrink-0 text-neutral-600 motion-safe:transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-white/[.05] pb-5 pt-5">
        <div className="grid grid-cols-3 gap-3 text-center sm:gap-5">
          {designs.map(design => (
            <div key={design.appearance} className="min-w-0">
              {example && <div aria-hidden="true" className="mx-auto mb-3 max-w-[4.75rem]"><EventBadgeArtwork badge={example} compact illustration={design.appearance} /></div>}
              <h3 className="data-display text-[11px] leading-4 text-neutral-200">{design.title}</h3>
              <p className="mt-1.5 text-[10px] font-bold italic leading-[1.45] tracking-[-.035em] text-neutral-500">{design.description}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-md text-center text-[10px] font-bold italic leading-relaxed tracking-[-.035em] text-neutral-600">El arco refleja tu puntuación. La corona y los laureles lima identifican la noche con más pasos del año. Los ejemplos no modifican tu actividad.</p>
      </div>
    </details>
  );
}
