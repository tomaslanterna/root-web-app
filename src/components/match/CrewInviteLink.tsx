"use client";

import { useState } from "react";
import { Check, Link2, Loader2, RefreshCw } from "lucide-react";
import { matchApi } from "@/services/match";
import { buildShareableDeepLink } from "@/lib/deepLinks";
import { copyTextToClipboard } from "@/lib/utils";

interface CrewInviteLinkProps {
  crewId: string;
  crewName: string;
  inviteCode: string;
  /** Se llama con el código nuevo después de regenerar el link. */
  onCodeChange: (inviteCode: string) => void;
}

/** Link de invitación de la crew: cualquier integrante lo comparte y puede regenerarlo (anula el anterior). */
export function CrewInviteLink({ crewId, crewName, inviteCode, onCodeChange }: CrewInviteLinkProps) {
  const [copied, setCopied] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareLink = async () => {
    const url = buildShareableDeepLink(`crews/join/${inviteCode}`);
    setError(null);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `Sumate a ${crewName} en root`, text: `Te invito a mi crew "${crewName}" en root`, url });
        return;
      } catch {
        // Si se cancela el menú de compartir, se copia el link.
      }
    }
    if (await copyTextToClipboard(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setError("No pudimos copiar el link. Probá de nuevo.");
    }
  };

  const regenerate = async () => {
    setResetting(true);
    setError(null);
    try {
      onCodeChange(await matchApi.regenerateCrewInviteCode(crewId));
      setConfirmingReset(false);
    } catch {
      setError("No pudimos generar un link nuevo. Probá de nuevo.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mt-3 rounded-card bg-surface border border-line p-3.5 flex flex-col gap-3">
      <button
        type="button"
        onClick={shareLink}
        className="w-full flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-accent rounded-control"
      >
        <span className="size-10 shrink-0 rounded-xl bg-accent/12 text-accent flex items-center justify-center">
          {copied ? <Check className="size-5" aria-hidden="true" /> : <Link2 className="size-5" aria-hidden="true" />}
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold">{copied ? "¡Link copiado!" : "Invitar con un link"}</span>
          <span className="text-[13px] text-ink-2">Cualquiera que lo abra puede unirse a la crew</span>
        </span>
      </button>

      {confirmingReset ? (
        <div className="rounded-control bg-surface-2 border border-line p-3 flex flex-col gap-2.5">
          <p className="text-[13px] text-ink-2 m-0">
            El link actual va a dejar de funcionar. Tenés que compartir el nuevo.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={regenerate}
              disabled={resetting}
              className="h-10 flex-1 rounded-control bg-accent text-on-accent text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {resetting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Generar link nuevo
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              disabled={resetting}
              className="h-10 px-4 rounded-control bg-surface border border-line text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingReset(true)}
          className="self-start text-[13px] text-ink-2 hover:text-ink flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-accent rounded"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" /> Generar un link nuevo
        </button>
      )}

      {error && <p className="text-xs text-danger m-0">{error}</p>}
    </div>
  );
}
