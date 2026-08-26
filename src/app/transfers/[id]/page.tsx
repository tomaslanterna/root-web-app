"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldCheck, Ticket, Send, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";

export default function TransferDealRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const resolvedParams = use(params);
  const transferId = resolvedParams.id;
  
  const [transfer, setTransfer] = useState<any>(null);
  const [isLoadingDeal, setIsLoadingDeal] = useState(true);
  
  const [message, setMessage] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  // 1. Obtener los detalles del Trato (Transfer)
  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        const res = await api.get(`/v1/transfers/${transferId}`);
        setTransfer(res.data);
      } catch (err) {
        console.error("Error fetching deal", err);
      } finally {
        setIsLoadingDeal(false);
      }
    };
    if (transferId) {
      fetchTransfer();
    }
  }, [transferId]);

  // 2. Conectar el chat (Short Polling)
  const { messages, isLoading: isLoadingChat, sendMessage } = useChat(transfer?.chat_id);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(dateStr));
  };

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    try {
      await sendMessage(message, "text", user.id);
      setMessage(""); // Limpiar input
    } catch (e) {
      console.error("Failed to send", e);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await api.patch(`/v1/transfers/${transferId}/status`, { status });
      setTransfer((prev: any) => ({ ...prev, status }));
      setIsConfirming(false);
      // Force refresh messages to show the new system message immediately
      if (refreshMessages) refreshMessages();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoadingDeal) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0B0D10]">
        <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
      </div>
    );
  }

  if (!transfer) {
    return <div className="p-8 text-center text-white">Transferencia no encontrada o no autorizada.</div>;
  }

  const isSeller = user?.id === transfer.seller_id;
  const counterpartyName = isSeller ? "Comprador" : (transfer.seller?.name || "Vendedor");
  const counterpartyAvatar = isSeller ? null : transfer.seller?.avatar_url;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0B0D10] text-white">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-40 bg-[#0B0D10]/95 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
              <h1 className="text-sm font-black uppercase tracking-widest">Sala de Trato Seguro</h1>
            </div>
          </div>
          
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Resumen del Evento */}
        <div className="px-4 pb-3 flex items-center justify-between bg-[#14171F] mx-4 rounded-xl border border-white/5 mb-3 p-3">
          <div>
            <h2 className="text-sm font-bold leading-tight">{transfer.event_name || "Evento Privado"}</h2>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">
              {formatDate(transfer.event_date)} • {formatTime(transfer.event_date)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-neutral-500">Acordado</p>
            <p className="font-black text-[#D4FF00]">${transfer.price_agreed?.toLocaleString('es-AR')}</p>
          </div>
        </div>
      </header>

      {/* Contraparte */}
      <div className="shrink-0 px-4 py-2 flex items-center justify-center gap-2">
        <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Tratando con:</span>
        <div className="flex items-center gap-1.5 bg-white/5 pr-3 pl-1 py-1 rounded-full border border-white/10">
          {counterpartyAvatar ? (
             <img src={counterpartyAvatar} className="w-5 h-5 rounded-full object-cover" alt="Avatar" />
          ) : (
             <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-bold">
               {counterpartyName.charAt(0)}
             </div>
          )}
          <span className="text-xs font-semibold">{counterpartyName}</span>
          <span className="text-[10px] text-indigo-400 flex items-center ml-1 font-bold">
             ★ 5.0
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="text-center mb-6">
          <span className="bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            La conversación está cifrada
          </span>
        </div>

        {isLoadingChat && messages.length === 0 ? (
           <div className="flex justify-center py-4">
             <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
           </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === "system") {
              let title = "";
              let description = "";
              let iconColor = "text-indigo-400";
              let bgColor = "bg-indigo-500/10";
              let borderColor = "border-indigo-500/30";
              
              switch (msg.content) {
                case "TICKET_SENT":
                  title = "Entrada Enviada";
                  description = "El vendedor ha adjuntado la entrada. Root la retendrá encriptada hasta el día del evento. Podrás revelar el código QR horas antes de la fiesta.";
                  break;
                case "COMPLETED":
                  title = "Trato Completado";
                  description = "El comprador ha confirmado el ingreso exitoso. El dinero será liberado al vendedor. ¡Que disfruten el evento!";
                  iconColor = "text-[#D4FF00]";
                  bgColor = "bg-[#D4FF00]/10";
                  borderColor = "border-[#D4FF00]/30";
                  break;
                case "DISPUTED":
                  title = "Problema Reportado";
                  description = "Se ha reportado un problema con la entrada. El equipo de Root revisará el caso a la brevedad. Tu dinero está seguro.";
                  iconColor = "text-red-400";
                  bgColor = "bg-red-500/10";
                  borderColor = "border-red-500/30";
                  break;
                case "CANCELLED":
                  title = "Trato Cancelado";
                  description = "Este trato ha sido cancelado y los fondos serán devueltos.";
                  iconColor = "text-neutral-400";
                  bgColor = "bg-neutral-500/10";
                  borderColor = "border-neutral-500/30";
                  break;
                default:
                  title = msg.content;
                  description = "Actualización del sistema.";
              }

              return (
                <div key={msg.id} className={`my-6 border ${borderColor} ${bgColor} rounded-xl p-4 text-center space-y-2 animate-fade-in`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${iconColor} bg-white/5`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className={`font-bold text-sm ${iconColor}`}>{title}</h3>
                  <p className="text-xs text-neutral-300 font-medium">
                    {description}
                  </p>
                </div>
              );
            }

            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 relative",
                  isMe 
                    ? "bg-[#D4FF00] text-black rounded-tr-sm" 
                    : "bg-[#14171F] border border-white/10 text-white rounded-tl-sm"
                )}>
                  <p className="text-sm font-medium leading-snug">{msg.content}</p>
                  <span className={cn(
                    "text-[9px] font-bold mt-1 block text-right",
                    isMe ? "text-neutral-800" : "text-neutral-500"
                  )}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Acción Crítica / Bottom Bar */}
      <div className="shrink-0 bg-[#0B0D10]/95 backdrop-blur-xl border-t border-white/10 p-4 pb-8 space-y-3">
        
        {/* Lógica dinámica de botones según el estado y si soy comprador o vendedor */}
        {transfer.status === "NEGOTIATING" && isSeller && (
          <button 
            onClick={() => updateStatus("TICKET_SENT")}
            className="w-full bg-indigo-500 text-white font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20"
          >
            <Ticket className="w-5 h-5" />
            Marcar Entrada Como Enviada
          </button>
        )}

        {transfer.status === "TICKET_SENT" && !isSeller && (
          <div className="space-y-3">
            <button 
              onClick={() => setIsConfirming(!isConfirming)}
              className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#bce400] active:scale-[0.98] transition-all shadow-lg shadow-[#D4FF00]/20"
            >
              <Ticket className="w-5 h-5" />
              {isConfirming ? "Confirmar Ingreso Exitoso" : "Mostrar Mi Entrada"}
            </button>
            
            {isConfirming && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <button 
                  onClick={() => updateStatus("COMPLETED")}
                  className="w-full bg-green-500 text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-400 active:scale-[0.98] transition-all mb-2"
                 >
                   Sí, Ya Ingresé Bien
                 </button>
                 <button 
                  onClick={() => updateStatus("DISPUTED")}
                  className="w-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 active:scale-[0.98] transition-all"
                 >
                  <AlertTriangle className="w-4 h-4" />
                  Reportar Problema de Ingreso
                </button>
              </div>
            )}
          </div>
        )}

        {transfer.status === "COMPLETED" && (
           <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl text-center">
             <span className="text-green-400 font-bold text-xs uppercase tracking-wider">Trato Completado Exitosamente</span>
           </div>
        )}

        {transfer.status === "DISPUTED" && (
           <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-center">
             <span className="text-red-400 font-bold text-xs uppercase tracking-wider">Trato en Disputa - Soporte contactando</span>
           </div>
        )}

        {/* Chat Input (Oculto si el trato ya cerró o hay disputa) */}
        {transfer.status !== "COMPLETED" && transfer.status !== "DISPUTED" && transfer.status !== "CANCELLED" && (
          <div className="flex gap-2">
            <div className="flex-1 bg-[#14171F] border border-white/10 rounded-full px-4 py-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-neutral-600"
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={!message.trim()}
              className="bg-white/10 disabled:opacity-50 text-white p-3 rounded-full hover:bg-white/20 active:scale-95 transition-all"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
