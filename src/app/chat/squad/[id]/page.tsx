"use client";

import { use } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginRequired } from "@/components/ui/LoginRequired";
import { ChatConversation } from "@/components/match/ChatConversation";
import { useSquadChat } from "@/hooks/useSquadChat";

export default function SquadChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const { chatId, error, retry } = useSquadChat(id);
  if (!authLoading && !user) return <LoginRequired />;
  if (chatId) return <ChatConversation key={chatId} chatId={chatId} />;
  if (error) {
    const status = error.response?.status;
    const message = status === 403 ? "No pertenecés a esta crew."
      : status === 404 || status === 400 ? "Esta crew no existe."
      : "No pudimos abrir el chat de la crew.";
    return (
      <div className="min-h-[100dvh] bg-[#0B0D10] text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-neutral-400">{message}</p>
        {status !== 403 && status !== 404 && status !== 400 && <button className="text-[#D4FF00] text-sm" onClick={() => void retry().catch(() => undefined)}>Reintentar</button>}
        <Link href="/match" className="text-xs text-[#D4FF00] uppercase font-bold">Volver al Matcher</Link>
      </div>
    );
  }
  return <div className="min-h-[100dvh] bg-[#0B0D10] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#D4FF00]" /></div>;
}
