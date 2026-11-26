"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ReportSheet } from "@/components/ui/ReportSheet";

/** Botón "Reportar" de anuncios y comentarios de una comunidad: la denuncia va a su administración. */
export function ReportContentAction({ communityId, targetId, targetType }: { communityId: string; targetId: string; targetType: "post" | "comment" }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" aria-label={targetType === "post" ? "Reportar anuncio" : "Reportar comentario"} onClick={() => { if (!user) router.push("/login"); else setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold text-neutral-400 hover:bg-white/5 hover:text-white"><Flag className="h-3.5 w-3.5" /> Reportar</button>
    <ReportSheet
      isOpen={open}
      onClose={() => setOpen(false)}
      target={{ communityId, targetId, targetType }}
      title={targetType === "post" ? "Reportar anuncio" : "Reportar comentario"}
    />
  </>;
}
