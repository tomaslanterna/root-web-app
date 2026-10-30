"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { CommunityList } from "@/components/communities/CommunityList";
import { Button } from "@/components/ui/Button";
import { useCommunityDirectory } from "@/hooks/useCommunities";
import type { CommunityFilters } from "@/types/communities";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const PAGE_SIZE = 12;
const DEFAULT_FILTERS: CommunityFilters = {
  country: "UY",
  query: "",
  category: "",
  department: "",
  limit: PAGE_SIZE,
  offset: 0,
};

const URUGUAY_DEPARTMENTS = [
  "Artigas",
  "Canelones",
  "Cerro Largo",
  "Colonia",
  "Durazno",
  "Flores",
  "Florida",
  "Lavalleja",
  "Maldonado",
  "Montevideo",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres",
] as const;

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<"mine" | "explore">("explore");
  const [draftFilters, setDraftFilters] = useState<CommunityFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CommunityFilters>(DEFAULT_FILTERS);
  const { communities, meta, load, isLoading, error } = useCommunityDirectory();

  useEffect(() => {
    if (scope === "mine" && !user) return;
    void load({ ...appliedFilters, scope }).catch(() => undefined);
  }, [load, appliedFilters, scope, user]);

  const applyFilters = () => {
    if (scope !== "explore") return;
    const next = { ...draftFilters, limit: PAGE_SIZE, offset: 0 };
    setAppliedFilters(next);
  };

  const clearFilters = () => {
    const defaults = { ...DEFAULT_FILTERS, country: scope === "mine" ? "" : DEFAULT_FILTERS.country };
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
  };

  const loadMore = () => {
    void load(
      { ...appliedFilters, scope, limit: PAGE_SIZE, offset: communities.length },
      true,
    ).catch(() => undefined);
  };

  const activeFilterCount = [
    appliedFilters.query,
    appliedFilters.category,
    appliedFilters.department,
  ].filter(Boolean).length;

  const switchScope = (tab: "mine" | "explore") => {
    setScope(tab);
    const defaults = { ...DEFAULT_FILTERS, country: tab === "mine" ? "" : DEFAULT_FILTERS.country };
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
  };

  // Los selects aplican al cambiar; la búsqueda, al confirmar con Enter.
  const applyNow = (patch: Partial<CommunityFilters>) => {
    const next = { ...draftFilters, ...patch, limit: PAGE_SIZE, offset: 0 };
    setDraftFilters(next);
    setAppliedFilters(next);
  };

  const chipClass = (active: boolean) =>
    `h-11 appearance-none rounded-full border pl-3.5 pr-9 text-sm outline-none transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
      active ? "border-accent/40 bg-accent/12 font-semibold text-accent" : "border-white/10 bg-surface text-ink"
    }`;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg pb-[calc(var(--root-mobile-nav-clearance)+1rem)] text-ink md:pb-16">
      <header className="mx-auto w-full max-w-6xl px-4 pt-[calc(0.75rem+var(--root-safe-top))] md:px-8 md:pt-6">
        <h1 className="font-display m-0 text-[32px]">Comunidades</h1>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-3.5 px-4 pt-4 md:px-8">
        <div role="tablist" aria-label="Comunidades" className="flex rounded-xl border border-line bg-surface p-[3px]">
          {(["mine", "explore"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={scope === tab} disabled={isLoading} onClick={() => switchScope(tab)} className={`h-10 flex-1 rounded-[9px] text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${scope === tab ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"}`}>{tab === "mine" ? "Mis comunidades" : "Explorar"}</button>)}
        </div>

        {scope === "explore" && <section aria-label="Filtros" className="flex flex-col gap-3">
          <div className="flex h-12 items-center gap-2.5 rounded-control border border-white/10 bg-surface px-3.5 text-ink-3 focus-within:border-accent">
            <Search className="size-5 shrink-0" aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar comunidades"
              value={draftFilters.query ?? ""}
              onChange={(event) => setDraftFilters((current) => ({ ...current, query: event.target.value }))}
              onKeyDown={(event) => event.key === "Enter" && applyFilters()}
              onBlur={() => draftFilters.query !== appliedFilters.query && applyFilters()}
              placeholder="Nombre o descripción"
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <span className="sr-only">Estilo</span>
              <select value={draftFilters.category ?? ""} onChange={(event) => applyNow({ category: event.target.value })} className={chipClass(!!appliedFilters.category)}>
                <option value="">Estilo</option>
                <option value="electrónica">Electrónica</option>
                <option value="cachengue">Cachengue</option>
                <option value="reggaetón">Reggaetón</option>
                <option value="general">Otros</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-80" aria-hidden="true" />
            </label>
            <label className="relative">
              <span className="sr-only">País</span>
              <select value={draftFilters.country ?? ""} onChange={(event) => applyNow({ country: event.target.value, department: event.target.value === "UY" ? draftFilters.department : "" })} className={chipClass(!!appliedFilters.country)}>
                <option value="">Todos los países</option>
                <option value="UY">Uruguay</option>
                <option value="AR">Argentina</option>
                <option value="BR">Brasil</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-80" aria-hidden="true" />
            </label>
            {draftFilters.country === "UY" && (
              <label className="relative">
                <span className="sr-only">Departamento</span>
                <select value={draftFilters.department ?? ""} onChange={(event) => applyNow({ department: event.target.value })} className={chipClass(!!appliedFilters.department)}>
                  <option value="">Departamento</option>
                  {URUGUAY_DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-80" aria-hidden="true" />
              </label>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="label-mono text-ink-3">
              {activeFilterCount > 0 ? `${activeFilterCount} ${activeFilterCount === 1 ? "filtro" : "filtros"} · ` : ""}
              {meta.total} comunidades
            </span>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} disabled={isLoading} className="h-11 px-1 text-sm font-semibold text-accent hover:text-accent-hover">
                Limpiar
              </button>
            )}
          </div>
        </section>}

        {scope === "mine" && !user ? <p className="m-0 rounded-card border border-line bg-surface p-6 text-center text-[15px]"><Link href="/login" className="font-semibold text-accent">Iniciá sesión para ver tus comunidades</Link></p> : error && communities.length === 0 ? (
          <section className="rounded-card border border-danger/30 bg-surface p-8 text-center">
            <p className="m-0 text-base font-semibold">No pudimos cargar las comunidades.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => void load({ ...appliedFilters, scope }).catch(() => undefined)}
            >
              Reintentar
            </Button>
          </section>
        ) : (
          <CommunityList communities={communities} isLoading={isLoading && communities.length === 0} emptyMessage={scope === "mine" ? "Todavía no pertenecés a ninguna comunidad. Descubrí una en Explorar." : "No hay comunidades con estos filtros."} />
        )}

        {meta.hasMore && (
          <div className="flex justify-center pt-2">
            <Button variant="secondary" onClick={loadMore} disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Cargar más
            </Button>
          </div>
        )}

        {scope === "explore" && (
          <p className="m-0 border-t border-line px-2 pt-6 text-center text-sm leading-relaxed text-ink-2">
            si sos RRPP y queres tener tu comunidad, contactanos!
          </p>
        )}
      </main>
    </div>
  );
}
