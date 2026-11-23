import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";

type SearchTab = "usuarios" | "eventos" | "comunidades";

const gridClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

/** Misma forma que la tarjeta de usuario de la búsqueda: avatar redondo y dos líneas. */
function UserResultSkeleton({ i }: { i: number }) {
  return (
    <div className="p-3.5 rounded-card bg-surface border border-line flex items-center gap-3.5">
      <div className="size-12 shrink-0 rounded-full bg-surface-2" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="h-4 rounded bg-white/10" style={{ width: `${52 + ((i * 13) % 32)}%` }} />
        <div className="h-3 w-2/5 rounded bg-white/5" />
      </div>
    </div>
  );
}

/** Misma forma que CommunityCard: portada de 142 px, título, descripción y pie. */
function CommunityResultSkeleton() {
  return (
    <div className="flex min-h-[238px] flex-col overflow-hidden rounded-[22px] border border-line bg-surface">
      <div className="relative h-[142px] bg-surface-2">
        <div className="absolute right-3 top-3 h-7 w-14 rounded-full bg-white/10" />
        <div className="absolute bottom-3 left-3 h-3 w-28 rounded bg-white/10" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-5 w-3/5 rounded bg-white/10" />
        <div className="h-3.5 w-full rounded bg-white/5" />
        <div className="h-3.5 w-2/3 rounded bg-white/5" />
        <div className="mt-auto h-4 w-1/3 rounded bg-white/10" />
      </div>
    </div>
  );
}

/** Carga de resultados de búsqueda: cada pestaña muestra el esqueleto de lo que va a traer. */
export function SearchResultsSkeleton({ tab, className }: { tab: SearchTab; className?: string }) {
  return (
    <div role="status" aria-label="Buscando" className={className}>
      <div aria-hidden="true" className="space-y-4 animate-pulse select-none">
        <div className="h-3 w-20 rounded bg-white/10" />
        {tab === "usuarios" && (
          <div className={`${gridClass} gap-3`}>
            {Array.from({ length: 8 }, (_, i) => <UserResultSkeleton key={i} i={i} />)}
          </div>
        )}
        {tab === "eventos" && (
          <div className={`${gridClass} gap-4`}>
            {Array.from({ length: 6 }, (_, i) => <EventCardSkeleton key={i} />)}
          </div>
        )}
        {tab === "comunidades" && (
          <div className={`${gridClass} gap-4`}>
            {Array.from({ length: 6 }, (_, i) => <CommunityResultSkeleton key={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
