"use client";

import { useState } from "react";
import { MOCK_TICKETS, MOCK_EVENTS, ResaleTicket } from "@/lib/mocks";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResalePage() {
  const [tickets, setTickets] = useState<ResaleTicket[]>(MOCK_TICKETS);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE": return null;
      case "PENDING_CONFIRMATION": return <Clock className="w-4 h-4 text-orange-400" />;
      case "COMPLETED": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "DISPUTED": return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white pb-28">
      <header className="sticky top-0 z-40 glass-header-obsidian px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-black uppercase tracking-wider text-white">Marketplace Reventa</h1>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#D4FF00] px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
          Escrow Seguro
        </span>
      </header>

      <div className="p-4 space-y-4">
        {tickets.map((ticket) => {
          const event = MOCK_EVENTS.find((e) => e.id === ticket.eventId);
          return (
            <Card key={ticket.id} className="bg-[#14171F] border border-white/10 shadow-lg">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-black uppercase text-white">{event?.title}</h2>
                    <p className="text-[10px] text-neutral-400 uppercase font-semibold">{event?.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#D4FF00]">${ticket.price.toLocaleString()}</p>
                    <div className="flex items-center gap-1 justify-end">
                      {getStatusIcon(ticket.status)}
                      <span className="text-[8px] font-bold uppercase tracking-tighter text-neutral-300">
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-white/5 bg-neutral-950/40">
                {ticket.status === "AVAILABLE" && (
                  <Button size="sm" variant="primary" className="w-full">Comprar (Escrow Seguro)</Button>
                )}
                {ticket.status === "PENDING_CONFIRMATION" && (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" size="sm" onClick={() => setShowDisputeModal(true)}>Disputa</Button>
                    <Button variant="primary" size="sm">Confirmar Ingreso</Button>
                  </div>
                )}
                {ticket.status === "DISPUTED" && (
                  <p className="text-[10px] font-bold text-red-400 uppercase py-2">
                    En revisión por soporte técnico
                  </p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {showDisputeModal && (
        <div className="fixed inset-0 bg-neutral-950/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <Card className="max-w-xs w-full bg-[#14171F] border border-white/10 text-white shadow-2xl">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-center text-red-400">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black uppercase text-white">Abrir Disputa</h3>
                <p className="text-xs text-neutral-400">
                  ¿El ticket era falso o no te permitieron el ingreso? El pago quedará retenido hasta que el soporte resuelva el caso.
                </p>
              </div>
              <textarea
                className="w-full bg-[#0B0D10] border border-white/10 p-3 rounded-2xl text-xs h-24 focus:outline-none focus:border-[#D4FF00] text-white placeholder:text-neutral-500"
                placeholder="Describe el problema..."
              />
            </CardContent>
            <CardFooter className="flex-col gap-2 border-t border-white/10 bg-neutral-950/40">
              <Button variant="primary" className="w-full" onClick={() => setShowDisputeModal(false)}>
                Enviar Reporte
              </Button>
              <Button variant="ghost" className="w-full text-xs text-neutral-400" onClick={() => setShowDisputeModal(false)}>
                Cancelar
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

