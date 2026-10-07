"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCommunityModeration } from "@/hooks/useCommunityModeration";

export function CommunityModeration({ communityId }: { communityId: string }) {
  const [open, setOpen] = useState(false);
  const { reports, meta, load, review, isLoading, isReviewing, error } = useCommunityModeration(communityId);
  return <section className="rounded-3xl border border-white/10 bg-[#14171F] p-4">
    <button type="button" aria-expanded={open} onClick={() => { setOpen(!open); if (!open) void load(0).catch(() => undefined); }} className="flex w-full items-center gap-2 text-xs font-black uppercase text-[#D4FF00]"><ShieldAlert className="h-4 w-4" /> Revisar reportes {open && `(${meta.total})`}</button>
    {open && <div className="mt-4 space-y-4">
      <p className="text-xs text-neutral-500">Marcar como revisado o descartar no elimina el contenido.</p>
      {error && <div role="alert" className="text-xs text-red-400">No pudimos actualizar los reportes. <button onClick={() => void load(0).catch(() => undefined)} className="underline">Reintentar</button></div>}
      {isLoading && <p className="text-xs text-neutral-400">Cargando…</p>}
      {!isLoading && !error && reports.length === 0 && <p className="text-sm text-neutral-400">No hay reportes pendientes.</p>}
      {reports.map((report) => <article key={report.id} className="space-y-2 rounded-2xl border border-white/10 p-4">
        <p className="text-xs font-bold">{report.reporterName} · {report.reason === "spam" ? "Spam" : report.reason === "abuse" ? "Abuso" : "Otro motivo"} · {report.targetType === "post" ? "Anuncio" : "Comentario"}</p>
        <p className="text-[10px] text-neutral-500">{new Date(report.createdAt).toLocaleString("es-UY")}</p>
        <p className="break-words whitespace-pre-wrap text-sm text-neutral-300">{report.content}</p>
        {report.details && <p className="break-words text-xs text-neutral-400">Detalles: {report.details}</p>}
        {report.targetType === "post" && <Link href={`/posts/${report.targetId}`} className="block text-xs text-[#D4FF00]">Ver publicación</Link>}
        <div className="flex flex-wrap gap-2"><Button size="sm" disabled={isReviewing} onClick={() => void review({ id: report.id, status: "reviewed" }).catch(() => undefined)}>Revisado</Button><Button size="sm" variant="outline" disabled={isReviewing} onClick={() => void review({ id: report.id, status: "dismissed" }).catch(() => undefined)}>Descartar</Button></div>
      </article>)}
      {meta.hasMore && <Button variant="outline" disabled={isLoading} onClick={() => void load(reports.length).catch(() => undefined)}>Cargar más reportes</Button>}
    </div>}
  </section>;
}
