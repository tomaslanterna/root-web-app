"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { matchApi, type CrewInvitePreview } from "@/services/match";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CrewMonogram } from "@/components/match/CrewMonogram";

/** Invitación a una crew: muestra a qué crew te invitaron y te deja unirte (o iniciar sesión primero). */
export default function CrewInvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [invite, setInvite] = useState<CrewInvitePreview | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "invalid" | "error">("loading");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !code) return;
    let active = true;
    matchApi
      .getCrewInvite(String(code))
      .then((data) => {
        if (!active) return;
        setInvite(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setStatus(err?.response?.status === 404 ? "invalid" : "error");
      });
    return () => {
      active = false;
    };
  }, [code, authLoading, token]);

  const join = async () => {
    if (!token) {
      router.push(`/login?next=${encodeURIComponent(`/crews/join/${code}`)}`);
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const crew = await matchApi.joinPermanentCrew(String(code));
      router.replace(`/crews/${crew?.id ?? invite?.crewId}`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setJoinError(
        status === 404
          ? "Este link ya no es válido. Pedile uno nuevo a quien te invitó."
          : "No pudimos unirte a la crew. Probá de nuevo.",
      );
      setJoining(false);
    }
  };

  if (status === "loading" || authLoading) {
    return (
      <div className="min-h-[100dvh] bg-bg flex items-center justify-center" role="status" aria-label="Cargando invitación">
        <Loader2 className="size-6 animate-spin text-ink-2" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg text-ink flex flex-col items-center justify-center px-4 pt-[var(--root-safe-top)] pb-[var(--root-mobile-nav-clearance)]">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-5">
        {status !== "ready" || !invite ? (
          <>
            <span className="size-16 rounded-2xl bg-surface border border-line flex items-center justify-center">
              <Users className="size-7 text-ink-2" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-[26px] m-0">
                {status === "invalid" ? "Link no válido" : "No pudimos abrir la invitación"}
              </h1>
              <p className="text-sm text-ink-2 m-0">
                {status === "invalid"
                  ? "Este link no existe o ya fue reemplazado. Pedile uno nuevo a quien te invitó."
                  : "Revisá tu conexión y probá de nuevo."}
              </p>
            </div>
            <Link href="/match" className="text-sm font-semibold text-accent">
              Ir a mis crews
            </Link>
          </>
        ) : (
          <>
            <CrewMonogram name={invite.name} className="size-[88px] rounded-[22px] text-3xl" />
            <div className="flex flex-col gap-1.5">
              <p className="label-mono text-ink-3 m-0">Te invitaron a una crew</p>
              <h1 className="font-display text-[28px] m-0">{invite.name}</h1>
              <p className="text-sm text-ink-2 m-0">
                {invite.memberCount} {invite.memberCount === 1 ? "integrante" : "integrantes"}
              </p>
            </div>

            {invite.members.length > 0 && (
              <ul className="flex items-center justify-center -space-x-2 list-none p-0 m-0" aria-label="Integrantes">
                {invite.members.map((member) => (
                  <li key={member.username}>
                    <Avatar
                      src={member.avatarUrl ?? undefined}
                      fallback={member.name || member.username}
                      username={member.username}
                      size="md"
                      className="border-2 border-bg"
                    />
                  </li>
                ))}
              </ul>
            )}

            {invite.alreadyMember ? (
              <>
                <p className="text-sm text-ink-2 m-0">Ya sos parte de esta crew.</p>
                <Button variant="primary" size="full" onClick={() => router.replace(`/crews/${invite.crewId}`)}>
                  Ir a la crew
                </Button>
              </>
            ) : (
              <Button variant="primary" size="full" onClick={join} disabled={joining}>
                {joining ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {token ? "Unirme a la crew" : "Iniciar sesión para unirme"}
              </Button>
            )}
            {joinError && <p className="text-xs text-danger m-0">{joinError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
