"use client";

import { ChatList } from "./ChatList";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <>
      <ChatList className="md:hidden pb-28 min-h-[100dvh]" />
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center h-screen bg-[#0B0D10]/50">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
          <MessageSquare className="w-8 h-8 text-neutral-600" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">Tus Mensajes</h2>
        <p className="text-neutral-500 font-medium text-sm max-w-sm">
          Seleccioná un chat del menú lateral para empezar a mensajear con tus amigos o con tu crew.
        </p>
      </div>
    </>
  );
}
