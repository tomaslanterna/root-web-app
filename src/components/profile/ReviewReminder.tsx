"use client";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useReviewReminder } from "@/hooks/useReviewReminder";
import { EventBadgeArtwork } from "./EventBadgeArtwork";

export function ReviewReminder() {
  const {badge,dismiss}=useReviewReminder(),router=useRouter();
  return <Modal isOpen={!!badge} onClose={dismiss} title="¿Cómo estuvo esa noche? ✨">
    {badge && <div className="text-center"><div className="mx-auto mb-4 w-24"><EventBadgeArtwork badge={badge} compact /></div><p className="text-base font-semibold">{badge.title}</p><p className="mt-3 text-sm leading-relaxed text-neutral-400">Tu recuerdo todavía está incompleto. Contanos cómo estuvo el evento y completá tu insignia.</p><div className="mt-5 flex flex-col gap-2"><Button onClick={()=>{dismiss();router.push(`/events/${badge.eventId}/survey`);}}>Reseñar evento</Button><Button variant="outline" onClick={dismiss}>Ahora no</Button></div></div>}
  </Modal>;
}
