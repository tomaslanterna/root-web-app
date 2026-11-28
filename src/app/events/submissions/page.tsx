"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Plus } from "lucide-react";
import { SwipeBack } from "@/components/ui/SwipeBack";
import { EventSubmissionCard } from "@/components/events/EventSubmissionCard";
import { useAuth } from "@/context/AuthContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useRequireKyc } from "@/hooks/useRequireKyc";
import { useMySubmissions } from "@/hooks/useEventSubmissions";

const noSubscribe = () => () => {};
// Se lee de la URL sin useSearchParams para no tener que envolver la página en Suspense.
const justSent = () => new URLSearchParams(window.location.search).get("sent") === "1";

/** "Mis envíos": los eventos que mandó la persona, con su estado. */
export default function MySubmissionsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const requireKyc = useRequireKyc();
  const goBack = useBackNavigation("/events");
  const sent = useSyncExternalStore(noSubscribe, justSent, () => false);
  const [toastHidden, setToastHidden] = useState(false);
  const { submissions, status, reload } = useMySubmissions(Boolean(user));

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => setToastHidden(true), 4000);
    return () => clearTimeout(timer);
  }, [sent]);

  return (
    <div className="min-h-[100dvh] bg-bg text-ink pb-[calc(3rem+var(--root-safe-bottom))] lg:pb-16">
      <SwipeBack onBack={goBack} />
      <div className="w-full max-w-2xl mx-auto px-4 lg:px-0">
        <header className="sticky top-0 z-30 -mx-4 px-4 pt-[calc(0.75rem+var(--root-safe-top))] pb-3 md:pt-6 bg-bg/95 backdrop-blur-md flex items-center gap-3 lg:static lg:mx-0 lg:px-0 lg:pt-2 lg:pb-6 lg:bg-transparent">
          <button type="button" onClick={goBack} aria-label="Volver" className="size-11 shrink-0 rounded-full bg-surface-2 border border-line-strong flex items-center justify-center hover:bg-[#23272D] transition-colors focus-visible:outline-2 focus-visible:outline-accent">
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <h1 className="font-display text-[22px] m-0 flex-1 lg:text-[40px]">Mis envíos</h1>
        </header>

        <div className="pt-2.5 flex flex-col gap-4">
          {sent && !toastHidden && (
            <div role="status" className="flex items-center gap-2.5 px-4 py-3 rounded-card bg-ink text-bg text-sm font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-fade-in">
              <Check className="size-[18px] shrink-0" aria-hidden="true" /> Recibimos tu evento. Te avisamos cuando lo revisemos.
            </div>
          )}
          {status === "loading" && [0, 1, 2].map((i) => <div key={i} className="h-[108px] rounded-card bg-surface border border-line animate-pulse" aria-hidden="true" />)}
          {status === "unavailable" && (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <p className="m-0 text-[15px] text-ink-2">No pudimos cargar tus envíos.</p>
              <button type="button" onClick={() => void reload()} className="min-h-11 text-sm font-semibold text-accent">Reintentar</button>
            </div>
          )}
          {status === "ready" && submissions.length === 0 && (
            <p className="py-6 m-0 text-center text-[15px] text-ink-2">Todavía no mandaste ningún evento.</p>
          )}
          {submissions.length > 0 && (
            <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
              {submissions.map((submission) => <EventSubmissionCard key={submission.id} submission={submission} />)}
            </ul>
          )}
          <button
            type="button"
            onClick={() => requireKyc(() => router.push("/events/submit"))}
            className="h-12 rounded-control bg-surface-2 border border-line-strong text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#23272D] transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Plus className="size-[18px]" aria-hidden="true" /> {submissions.length > 0 ? "Mandar otro evento" : "Mandar un evento"}
          </button>
        </div>
      </div>
    </div>
  );
}
