import { Suspense } from "react";
import { NewAfterScreen } from "@/components/afters/NewAfterScreen";

export const metadata = { title: "Subir un after · root" };

/** `?eventId=` opcional: el formulario llega con la fiesta elegida. Suspense por useSearchParams. */
export default function NewAfterPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-bg" aria-busy="true" />}>
      <NewAfterScreen />
    </Suspense>
  );
}
