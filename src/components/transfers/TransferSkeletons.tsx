import { cn } from "@/lib/utils";
import { ChatMessagesSkeleton } from "@/components/chat/ChatSkeletons";

/** Lista de transfers: misma tarjeta que la real (imagen 72, título/fecha/vendedor y precio con estado). */
export function TransferListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Cargando transfers" className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex gap-3 p-3 rounded-card bg-surface border border-line animate-pulse select-none"
        >
          <div className="size-[72px] shrink-0 rounded-xl bg-surface-2" />
          <div className="flex-1 min-w-0 flex flex-col gap-2 py-0.5">
            <div className="h-4 rounded bg-white/10" style={{ width: `${55 + ((i * 15) % 30)}%` }} />
            <div className="h-3 w-1/3 rounded bg-white/10" />
            <div className="h-3 w-2/5 rounded bg-white/5" />
          </div>
          <div className="shrink-0 flex flex-col items-end justify-between">
            <div className="h-4 w-16 rounded bg-white/10" />
            <div className="h-6 w-20 rounded-full bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Sala de trato: header con el resumen del evento, la contraparte, mensajes y la barra de acción. */
export function TransferDealSkeleton() {
  return (
    <div role="status" aria-label="Cargando transfer" className="flex flex-col h-[100dvh] bg-[#0B0D10] text-white">
      <header className="shrink-0 border-b border-white/10 pt-safe-header pb-3 animate-pulse">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="size-10 rounded-full bg-white/10" />
          <div className="h-4 w-40 rounded bg-indigo-400/20" />
          <div className="w-10" />
        </div>
        <div className="mx-4 mb-3 p-3 flex items-center justify-between rounded-xl bg-[#14171F] border border-white/5">
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-36 rounded bg-white/10" />
            <div className="h-2.5 w-24 rounded bg-white/5" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-2.5 w-14 rounded bg-white/5" />
            <div className="h-4 w-16 rounded bg-white/10" />
          </div>
        </div>
      </header>

      <div className="shrink-0 px-4 py-2 flex items-center justify-center gap-2 animate-pulse">
        <div className="h-2.5 w-20 rounded bg-white/5" />
        <div className="h-7 w-32 rounded-full bg-white/5 border border-white/10" />
      </div>

      <div className="flex-1 overflow-hidden px-4 py-4">
        <ChatMessagesSkeleton />
      </div>

      <div className="shrink-0 border-t border-white/10 p-4 pb-8 animate-pulse">
        <div className="h-14 w-full rounded-xl bg-white/10" />
      </div>
    </div>
  );
}
