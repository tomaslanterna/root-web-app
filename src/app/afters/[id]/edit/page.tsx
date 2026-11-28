"use client";

import { use } from "react";
import Link from "next/link";
import { KycGateScreen } from "@/components/kyc/KycGateScreen";
import { AfterForm } from "@/components/afters/AfterForm";
import { useEditableAfter } from "@/hooks/useAfters";

/** Editar un after (solo quien lo organiza, con la identidad verificada). */
export default function EditAfterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <KycGateScreen fallback={`/afters/${id}`}>
      <EditAfter id={id} />
    </KycGateScreen>
  );
}

function EditAfter({ id }: { id: string }) {
  const { after, status } = useEditableAfter(id);
  if (status === "loading") return <div className="min-h-[100dvh] bg-bg" aria-busy="true" />;
  if (!after || !after.canEdit) {
    return (
      <div className="min-h-[100dvh] bg-bg text-ink flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="m-0 text-lg font-semibold">{after ? "Solo quien organiza el after lo puede editar" : "Este after ya no está"}</p>
        <Link href={after ? `/afters/${id}` : "/events"} className="min-h-11 inline-flex items-center text-sm font-semibold text-accent">Volver</Link>
      </div>
    );
  }
  return <AfterForm editing={after} />;
}
