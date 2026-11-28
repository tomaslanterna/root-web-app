"use client";

import { KycGateScreen } from "@/components/kyc/KycGateScreen";
import { EventSubmissionForm } from "@/components/events/EventSubmissionForm";

/** "Mandanos tu evento". Sin identidad verificada se ve la hoja de verificación en lugar del formulario. */
export default function SubmitEventPage() {
  return (
    <KycGateScreen fallback="/events">
      <EventSubmissionForm />
    </KycGateScreen>
  );
}
