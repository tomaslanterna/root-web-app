"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCommunityReport } from "@/hooks/useCommunityModeration";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { CommunityReportInput } from "@/types/communities";

export function ReportContentAction({ communityId, targetId, targetType }: { communityId: string; targetId: string; targetType: "post" | "comment" }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState<CommunityReportInput["reason"]>("spam");
  const [details, setDetails] = useState("");
  const { mutate, isLoading, error } = useCommunityReport(communityId);
  return <>
    <button type="button" aria-label={targetType === "post" ? "Reportar anuncio" : "Reportar comentario"} onClick={() => { if (!user) router.push("/login"); else setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold text-neutral-400 hover:bg-white/5 hover:text-white"><Flag className="h-3.5 w-3.5" /> Reportar</button>
    <Modal isOpen={open} onClose={() => { if (!isLoading) setOpen(false); }} title="Reportar contenido">
      {sent ? <div role="status" className="space-y-4 text-sm text-neutral-300"><p>Reporte enviado. La administración de la comunidad podrá revisarlo.</p><Button onClick={() => setOpen(false)}>Entendido</Button></div> : <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (!isLoading) void mutate({ targetId, targetType, reason, details: details.trim() }).then(() => setSent(true)).catch(() => undefined); }}>
        <label className="block space-y-2 text-xs font-bold">Motivo<select value={reason} onChange={(event) => setReason(event.target.value as CommunityReportInput["reason"])} className="block w-full rounded-xl border border-white/10 bg-[#0B0D10] p-3"><option value="spam">Spam o publicidad engañosa</option><option value="abuse">Abuso o contenido inapropiado</option><option value="other">Otro motivo</option></select></label>
        <label className="block space-y-2 text-xs font-bold">Detalles (opcional)<textarea value={details} maxLength={1000} onChange={(event) => setDetails(event.target.value)} className="block min-h-28 w-full rounded-xl border border-white/10 bg-[#0B0D10] p-3" /></label>
        <p className="text-xs text-neutral-500">Tu reporte solo será visible para la administración, no para otros miembros.</p>
        {error && <p role="alert" className="text-xs text-red-400">No pudimos enviar el reporte. Intentá nuevamente.</p>}
        <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? "Enviando…" : "Enviar reporte"}</Button>
      </form>}
    </Modal>
  </>;
}
