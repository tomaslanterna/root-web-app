"use client";

import { useSearchParams } from "next/navigation";
import { KycGateScreen } from "@/components/kyc/KycGateScreen";
import { AfterForm } from "@/components/afters/AfterForm";

/** Sin identidad verificada (por ejemplo, entrando directo por la URL) se ve la hoja de verificación, no el formulario. */
export function NewAfterScreen() {
  const eventId = useSearchParams().get("eventId");
  return (
    <KycGateScreen fallback={eventId ? `/events/${eventId}` : "/events"}>
      <AfterForm initialEventId={eventId} />
    </KycGateScreen>
  );
}
