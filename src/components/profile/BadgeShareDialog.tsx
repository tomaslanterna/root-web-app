"use client";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { useBadgeShare } from "@/hooks/useBadgeShare";

export function BadgeShareDialog({share}:{share:ReturnType<typeof useBadgeShare>}) {
  return <Modal isOpen={share.open} onClose={share.close} title="Compartir recuerdo">
    {share.isPreparing && <p role="status" className="py-8 text-center text-sm text-neutral-400">Preparando tu insignia...</p>}
    {share.error && !share.isPreparing && <div role="alert" className="text-sm text-neutral-400"><p>No pudimos cargar el flyer oficial o generar la tarjeta.</p><Button variant="outline" onClick={share.prepare} className="mt-3">Reintentar</Button></div>}
    {share.file && share.preview && <><Image src={share.preview} alt="Tarjeta de tu insignia lista para compartir" width={1080} height={1350} unoptimized className="mx-auto max-h-[45dvh] w-auto rounded-2xl" /><div className="mt-4 flex flex-col gap-2"><Button onClick={share.share} disabled={share.isSharing}>{share.isSharing ? "Abriendo..." : "Compartir imagen"}</Button><Button variant="outline" onClick={share.download}>Descargar imagen</Button></div></>}
    {share.message && <p role="status" className="mt-3 text-xs text-neutral-400">{share.message}</p>}
    <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">Las aplicaciones disponibles dependen de tu dispositivo. Se comparte solo esta tarjeta, no el texto de tu reseña ni tus valoraciones de DJs.</p>
  </Modal>;
}
