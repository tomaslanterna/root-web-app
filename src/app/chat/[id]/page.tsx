"use client";

import { MOCK_CHATS, MOCK_USERS } from "@/lib/mocks";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Send } from "lucide-react";
import Link from "next/link";
import { useState, use } from "react";

export default function ChatConversationPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = typeof (params as any)?.then === "function" ? use(params as Promise<{ id: string }>) : (params as { id: string });
  const chat = MOCK_CHATS.find((c) => c.id === resolvedParams.id);

  const otherUser = chat?.participants[1];
  const [message, setMessage] = useState("");

  if (!chat || !otherUser) return <div className="p-6 text-center text-neutral-400 font-bold uppercase">Chat no encontrado</div>;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#0B0D10] text-white">
      <header className="px-4 py-3 border-b border-white/10 flex items-center gap-3 glass-header-obsidian sticky top-0 z-40">
        <Link href="/chat" className="p-1 rounded-full hover:bg-white/10 text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <Avatar src={otherUser.avatarUrl} fallback={otherUser.name} size="sm" className="ring-2 ring-[#D4FF00]/40" />
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-white">{otherUser.name}</p>
          <span className="text-[10px] text-[#D4FF00] font-bold uppercase">En línea</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0B0D10]">
        <div className="flex flex-col items-start max-w-[80%]">
          <div className="bg-[#14171F] border border-white/10 p-3.5 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl shadow-md text-neutral-200">
            <p className="text-xs sm:text-sm font-medium">¡Hola! ¿Todavía tenés el ticket para Afterlife?</p>
          </div>
          <span className="text-[9px] text-neutral-500 mt-1 uppercase font-bold pl-1">14:02</span>
        </div>

        <div className="flex flex-col items-end max-w-[80%] ml-auto">
          <div className="bg-[#D4FF00] text-neutral-950 p-3.5 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl shadow-md font-semibold">
            <p className="text-xs sm:text-sm">{chat.lastMessage}</p>
          </div>
          <span className="text-[9px] text-neutral-500 mt-1 uppercase font-bold pr-1">14:05</span>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 glass-header-obsidian flex items-center gap-2 pb-28">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-[#14171F] border border-white/10 rounded-full px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4FF00] transition-colors"
        />
        <Button variant="primary" size="icon" className="w-10 h-10 shrink-0">
          <Send className="w-4 h-4 text-neutral-950" />
        </Button>
      </div>
    </div>
  );
}

