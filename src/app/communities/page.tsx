"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UsersRound, X } from "lucide-react";
import { CommunityList } from "@/components/communities/CommunityList";
import { Button } from "@/components/ui/Button";
import { SearchButton } from "@/components/ui/SearchButton";
import { useAuth } from "@/context/AuthContext";
import { useCommunityDirectory, useCreateCommunity } from "@/hooks/useCommunities";
import type { CommunityFilters, CreateCommunityInput } from "@/types/communities";

const PAGE_SIZE = 12;
const emptyCommunity: CreateCommunityInput = {
  name: "",
  category: "electrónica",
  zone: "",
  countryId: "UY",
  description: "",
};

export default function CommunitiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [scope, setScope] = useState<"mine" | "explore">("explore");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateCommunityInput>(emptyCommunity);
  const { communities, meta, load, isLoading, error } = useCommunityDirectory();

  useEffect(() => {
    if (scope === "mine" && !user) return;
    void load({ scope, limit: PAGE_SIZE, offset: 0 }).catch(() => undefined);
  }, [load, scope, user]);

  const directoryFilters: CommunityFilters = { scope, limit: PAGE_SIZE, offset: 0 };

  const creator = useCreateCommunity((community) => {
    setShowCreate(false);
    setForm(emptyCommunity);
    router.push(`/communities/${community.slug || community.id}?origin=%2Fcommunities`);
  });

  const handleOpenCreate = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setShowCreate(true);
  };

  const loadMore = () => {
    void load({ ...directoryFilters, offset: communities.length }, true).catch(() => undefined);
  };

  const submitCommunity = (event: FormEvent) => {
    event.preventDefault();
    void creator.create(form).catch(() => undefined);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg pb-[calc(var(--root-mobile-nav-clearance)+1rem)] text-ink md:pb-16">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pb-4 pt-[calc(0.75rem+var(--root-safe-top))] md:px-8 md:pt-6">
          <div className="min-w-0">
            <h1 className="m-0 font-display text-[32px]">Comunidades</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SearchButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pt-5 md:px-8">
        {/* Banner para crear comunidad idéntico al de /match */}
        <div className="px-3.5 py-3 rounded-2xl bg-black text-white border-[1.5px] border-white grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5">
          <span className="font-display text-base whitespace-nowrap">Armá tu comunidad</span>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="col-start-2 row-span-2 row-start-1 self-center shrink-0 h-10 px-3 rounded-xl bg-white text-black text-[13px] font-semibold flex items-center gap-1 whitespace-nowrap hover:bg-ink active:scale-[0.97] transition-[background-color,transform] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 cursor-pointer"
          >
            <Plus className="size-4" strokeWidth={2.4} aria-hidden="true" /> Crear
          </button>
          <span className="col-start-1 text-sm font-medium leading-snug text-white">
            Tu espacio para conectar y compartir
          </span>
        </div>

        <div className="flex items-end justify-between gap-4 border-b border-line">
          <div role="tablist" aria-label="Comunidades" className="flex min-w-0 gap-5">
            {(["explore", "mine"] as const).map((tab) => (
              <button key={tab} type="button" role="tab" aria-selected={scope === tab} disabled={isLoading} onClick={() => setScope(tab)} className={`relative h-11 whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${scope === tab ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}>
                {tab === "mine" ? "Las tuyas" : "Descubrir"}
                {scope === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent" />}
              </button>
            ))}
          </div>
          {!isLoading && <span className="label-mono mb-3 shrink-0 text-ink-3">{meta.total} {meta.total === 1 ? "comunidad" : "comunidades"}</span>}
        </div>

        {scope === "mine" && !user ? (
          <section className="flex flex-col items-center gap-3 py-16 text-center">
            <UsersRound className="size-8 text-accent" aria-hidden="true" />
            <p className="m-0 text-base font-semibold">Tus comunidades viven acá</p>
            <Link href="/login" className="flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent">Iniciar sesión</Link>
          </section>
        ) : error && communities.length === 0 ? (
          <section className="py-16 text-center">
            <p className="m-0 text-base font-semibold">No pudimos cargar las comunidades.</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => void load(directoryFilters).catch(() => undefined)}>Reintentar</Button>
          </section>
        ) : (
          <CommunityList communities={communities} isLoading={isLoading && communities.length === 0} emptyMessage={scope === "mine" ? "Todavía no te sumaste a ninguna comunidad." : "Todavía no hay comunidades para descubrir."} />
        )}

        {meta.hasMore && (
          <div className="flex justify-center pt-2">
            <Button variant="secondary" onClick={loadMore} disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Ver más
            </Button>
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="create-community-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#111419] p-5 pb-[calc(1.25rem+var(--root-safe-bottom))] shadow-2xl sm:rounded-[28px] sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="label-mono text-accent">Nueva escena</span>
                <h2 id="create-community-title" className="mt-1 text-2xl font-bold tracking-tight">Crear comunidad</h2>
                <p className="mt-1 text-sm text-ink-2">Vas a quedar como RRPP y primer integrante.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-ink-2 hover:text-ink" aria-label="Cerrar"><X className="size-5" aria-hidden="true" /></button>
            </div>

            <form onSubmit={submitCommunity} className="space-y-4">
              <label className="block space-y-1.5 text-sm font-semibold">Nombre
                <input required minLength={3} maxLength={80} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Techno del Este" className="h-12 w-full rounded-xl border border-line-strong bg-bg px-4 text-ink outline-none placeholder:text-ink-3 focus:border-accent" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5 text-sm font-semibold">Estilo
                  <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="h-12 w-full rounded-xl border border-line-strong bg-bg px-3 text-ink outline-none focus:border-accent">
                    <option value="electrónica">Electrónica</option><option value="cachengue">Cachengue</option><option value="reggaetón">Reggaetón</option><option value="general">General</option>
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-semibold">Zona
                  <input maxLength={80} value={form.zone} onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value }))} placeholder="Montevideo" className="h-12 w-full rounded-xl border border-line-strong bg-bg px-4 text-ink outline-none placeholder:text-ink-3 focus:border-accent" />
                </label>
              </div>
              <label className="block space-y-1.5 text-sm font-semibold">Descripción
                <textarea required maxLength={500} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Contá de qué se trata y qué van a encontrar." className="min-h-28 w-full resize-none rounded-xl border border-line-strong bg-bg px-4 py-3 text-ink outline-none placeholder:text-ink-3 focus:border-accent" />
              </label>
              {creator.error && <p role="alert" className="text-sm text-danger">No pudimos crear la comunidad. Revisá los datos e intentá de nuevo.</p>}
              <Button type="submit" size="full" disabled={creator.isCreating}>{creator.isCreating && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}Crear comunidad</Button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
