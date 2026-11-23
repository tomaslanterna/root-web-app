import { cn } from "@/lib/utils";

/** Filas de la lista de chats: mismas medidas que las conversaciones reales (avatar 52, dos líneas de texto). */
export function ChatListSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("animate-pulse select-none", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="size-[52px] shrink-0 rounded-full bg-surface-2" />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 rounded bg-white/10" style={{ width: `${48 + ((i * 17) % 30)}%` }} />
              <div className="h-3 w-9 shrink-0 rounded bg-white/5" />
            </div>
            <div className="h-3.5 rounded bg-white/5" style={{ width: `${62 + ((i * 11) % 28)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Burbujas de mensajes (alternando lados). Sirve para el chat de personas, de crews y de transfers. */
export function ChatMessagesSkeleton({ className }: { className?: string }) {
  const bubbles: { me: boolean; w: string; h: string }[] = [
    { me: false, w: "w-[58%]", h: "h-11" },
    { me: false, w: "w-[34%]", h: "h-9" },
    { me: true, w: "w-[46%]", h: "h-10" },
    { me: false, w: "w-[66%]", h: "h-[60px]" },
    { me: true, w: "w-[30%]", h: "h-9" },
    { me: true, w: "w-[52%]", h: "h-11" },
  ];
  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-2 animate-pulse select-none", className)}>
      {bubbles.map((b, i) => (
        <div
          key={i}
          className={cn("rounded-2xl", b.w, b.h, b.me ? "ml-auto bg-white/10 rounded-br-sm" : "mr-auto bg-surface-2 rounded-bl-sm")}
        />
      ))}
    </div>
  );
}

/** Pantalla completa de una conversación: header con avatar y nombre, mensajes y barra para escribir. */
export function ChatConversationSkeleton() {
  return (
    <div role="status" aria-label="Cargando chat" className="flex flex-col h-[100dvh] bg-[#0B0D10] text-white">
      <header className="px-4 pb-3 pt-safe-header border-b border-white/10 flex items-center gap-3 shrink-0 animate-pulse">
        <div className="size-7 shrink-0 rounded-full bg-white/10 md:hidden" />
        <div className="size-10 shrink-0 rounded-full bg-surface-2" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="h-3.5 w-32 rounded bg-white/10" />
        </div>
      </header>

      <div className="flex-1 overflow-hidden px-4 py-4">
        <ChatMessagesSkeleton />
      </div>

      <div className="shrink-0 p-4 bg-[#0B0D10] border-t border-white/10 animate-pulse">
        <div className="flex gap-2">
          <div className="h-12 flex-1 rounded-full bg-[#14171F] border border-white/10" />
          <div className="size-12 shrink-0 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
