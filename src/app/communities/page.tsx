"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Filter,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import { CommunityList } from "@/components/communities/CommunityList";
import { Button } from "@/components/ui/Button";
import { useCommunityDirectory } from "@/hooks/useCommunities";
import type { CommunityFilters } from "@/types/communities";

const PAGE_SIZE = 12;
const DEFAULT_FILTERS: CommunityFilters = {
  country: "UY",
  query: "",
  category: "",
  department: "",
  limit: PAGE_SIZE,
  offset: 0,
};

const fieldClassName =
  "h-11 w-full rounded-2xl border border-white/10 bg-[#0B0D10] px-4 text-sm font-semibold text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-[#D4FF00]/60";
const selectClassName = `${fieldClassName} appearance-none pr-12`;

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
  const [draftFilters, setDraftFilters] = useState<CommunityFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CommunityFilters>(DEFAULT_FILTERS);
  const [areFiltersExpanded, setAreFiltersExpanded] = useState(false);
  const { communities, meta, load, isLoading, error } = useCommunityDirectory();

  useEffect(() => {
    void load(DEFAULT_FILTERS).catch(() => undefined);
  }, [load]);

  const applyFilters = () => {
    const next = { ...draftFilters, limit: PAGE_SIZE, offset: 0 };
    setAppliedFilters(next);
    setAreFiltersExpanded(false);
    void load(next).catch(() => undefined);
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setAreFiltersExpanded(false);
    void load(DEFAULT_FILTERS).catch(() => undefined);
  };

  const loadMore = () => {
    void load(
      { ...appliedFilters, limit: PAGE_SIZE, offset: communities.length },
      true,
    ).catch(() => undefined);
  };

  const activeFilterCount = [
    appliedFilters.query,
    appliedFilters.category,
    appliedFilters.department,
  ].filter(Boolean).length;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0B0D10] pb-28 text-white">
      <header className="glass-header-obsidian sticky top-0 z-40 flex items-center justify-between px-4 pb-3 pt-safe-header">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#D4FF00]" />
          <h1 className="text-lg font-black uppercase tracking-wider">Comunidades</h1>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4FF00]">
          {isLoading && communities.length === 0 ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            `${meta.total} disponibles`
          )}
        </span>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-8">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#14171F] shadow-xl">
          <button
            type="button"
            onClick={() => setAreFiltersExpanded((current) => !current)}
            className="flex w-full items-center justify-between gap-4 p-4 text-left md:p-5"
            aria-expanded={areFiltersExpanded}
            aria-controls="community-filters"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4FF00]/10 text-[#D4FF00]">
                <Filter className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-black uppercase tracking-[0.18em] text-neutral-100">
                  Descubrí tu comunidad
                </span>
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filtros activos`
                    : "Filtrar por estilo y departamento"}
                </span>
              </span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-[#D4FF00] transition-transform duration-200 ${
                areFiltersExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {areFiltersExpanded && (
            <div
              id="community-filters"
              className="border-t border-white/5 px-4 pb-4 pt-4 md:px-5 md:pb-5"
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                value={draftFilters.query ?? ""}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    query: event.target.value,
                  }))
                }
                onKeyDown={(event) => event.key === "Enter" && applyFilters()}
                placeholder="Nombre o descripción"
                className={`${fieldClassName} pl-11`}
              />
            </label>

            <label className="relative block">
              <select
                value={draftFilters.category ?? ""}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className={selectClassName}
                aria-label="Categoría"
              >
                <option value="">Todos los estilos</option>
                <option value="electrónica">Electrónica</option>
                <option value="cachengue">Cachengue</option>
                <option value="reggaetón">Reggaetón</option>
                <option value="general">Otros</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </label>

            <label className="relative block">
              <select
                value={draftFilters.country ?? ""}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    country: event.target.value,
                    department:
                      event.target.value === "UY" ? current.department : "",
                  }))
                }
                className={selectClassName}
                aria-label="País"
              >
                <option value="">Todos los países</option>
                <option value="UY">Uruguay</option>
                <option value="AR">Argentina</option>
                <option value="BR">Brasil</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </label>

            {draftFilters.country === "UY" && (
              <label className="relative block">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <select
                  value={draftFilters.department ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      department: event.target.value,
                    }))
                  }
                  className={`${selectClassName} pl-11`}
                  aria-label="Departamento"
                >
                  <option value="">Todos los departamentos</option>
                  {URUGUAY_DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </label>
            )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={applyFilters} disabled={isLoading} className="flex-1 md:flex-none">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Aplicar
                </Button>
                <Button variant="outline" onClick={clearFilters} disabled={isLoading}>
                  <RotateCcw className="h-4 w-4" /> Limpiar
                </Button>
              </div>
            </div>
          )}
        </section>

        {error && communities.length === 0 ? (
          <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-sm font-bold text-red-300">
              No pudimos cargar las comunidades.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void load(appliedFilters).catch(() => undefined)}
            >
              Reintentar
            </Button>
          </section>
        ) : (
          <CommunityList communities={communities} isLoading={isLoading && communities.length === 0} />
        )}

        {meta.hasMore && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={loadMore} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Cargar más
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
