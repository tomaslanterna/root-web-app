"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Search, Plus, Filter, ShieldCheck, ChevronRight, Loader2, X } from "lucide-react";
import { transfersApi } from "@/services/transfers";
import { Modal, AlertModal, ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTransfers } from "@/hooks/useTransfers";

export default function TransfersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"explorar" | "mis-ofertas">("explorar");
  
  const { transfers, isLoading, createTransfer, isCreating, startDeal, isStartingDeal } = useTransfers(activeTab);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventId, setNewEventId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  // Modal States
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: "", message: "" });


  const showAlert = (title: string, message: string) => setAlertConfig({ isOpen: true, title, message });

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventId || !newPrice) return;
    try {
      await createTransfer({
        event_id: newEventId,
        price: parseFloat(newPrice),
      });
      setIsModalOpen(false);
      setNewEventId("");
      setNewPrice("");
    } catch (error) {
      console.error("Error creating transfer", error);
      showAlert("Error", "Hubo un error al crear el transfer");
    }
  };

  const filteredTransfers = transfers.filter(t => 
    (t.event_name || t.event_id || "").toLowerCase().includes(search.toLowerCase())
  );

  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  const handleTransferClick = (transfer: any) => {
    if (transfer.seller_id === user?.id || transfer.buyer_id === user?.id) {
      router.push(`/transfers/${transfer.id}`);
      return;
    }

    if (transfer.status?.toUpperCase() === 'AVAILABLE') {
      setSelectedTransfer(transfer);
    }
  };

  const confirmStartDeal = async () => {
    if (!selectedTransfer) return;
    try {
      await startDeal(selectedTransfer.id);
      router.push(`/transfers/${selectedTransfer.id}`);
      setSelectedTransfer(null);
    } catch (error: any) {
      if (error.response?.status === 409) {
        showAlert("Aviso", "Lo siento, alguien más ya inició el trato por esta entrada.");
      } else {
        showAlert("Error", "Error al intentar iniciar trato.");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D10] text-white pb-24">
      {/* Create Modal */}
            <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Crear Transfer"
        footer={
          <Button 
            onClick={handleCreateTransfer} 
            disabled={isCreating} 
            className="w-full text-xs font-black uppercase bg-[#D4FF00] text-black hover:bg-[#b3d600]"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Crear Oferta"}
          </Button>
        }
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">ID del Evento</label>
            <input 
              type="text" 
              required
              value={newEventId}
              onChange={(e) => setNewEventId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4FF00]/50 transition-colors" 
              placeholder="ej. e1"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">Precio Acordado</label>
            <input 
              type="number" 
              required
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4FF00]/50 transition-colors" 
              placeholder="ej. 45000"
            />
          </div>
        </form>
      </Modal>

      <AlertModal 
        isOpen={alertConfig.isOpen} 
        onClose={() => setAlertConfig(prev => ({...prev, isOpen: false}))}
        title={alertConfig.title}
        message={alertConfig.message}
      />

      <ConfirmModal 
        isOpen={selectedTransfer !== null}
        onClose={() => setSelectedTransfer(null)}
        title="Iniciar Trato"
        message={selectedTransfer ? `¿Quieres iniciar trato con ${selectedTransfer.seller?.name || "este usuario"} por $${selectedTransfer.price || selectedTransfer.price_agreed}?` : ""}
        onConfirm={confirmStartDeal}
        isLoading={isStartingDeal}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 glass-header-obsidian">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
              <Ticket className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-white">transfer</h1>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#D4FF00] text-neutral-950 p-2 rounded-full hover:bg-[#bce400] active:scale-95 transition-all shadow-md shadow-[#D4FF00]/10 flex items-center justify-center gap-1.5 px-3.5 text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Crear Transfer</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 pb-2">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2.5 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-indigo-200/70 font-semibold leading-tight">
              Mercado P2P seguro. Los precios están limitados al valor de taquilla original. Root retiene tu dinero hasta que confirmes el ingreso al evento.
            </p>
          </div>
        </div>
      </header>

      {/* Tabs & Search */}
      <div className="px-4 pt-2 pb-4 space-y-3 sticky top-[110px] z-30 bg-[#0B0D10]/95 backdrop-blur-xl">
        <div className="flex space-x-1 p-1 bg-[#14171F] rounded-full border border-white/5">
          <button
            onClick={() => setActiveTab("explorar")}
            className={cn(
              "flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all rounded-full",
              activeTab === "explorar" 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            Explorar
          </button>
          <button
            onClick={() => setActiveTab("mis-ofertas")}
            className={cn(
              "flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all rounded-full",
              activeTab === "mis-ofertas" 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            Mis Ofertas
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-[#14171F] border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2 focus-within:border-indigo-500/50 transition-colors">
            <Search className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar evento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-neutral-600"
            />
          </div>
          <button className="bg-[#14171F] border border-white/10 rounded-xl p-2.5 text-neutral-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#D4FF00] animate-spin" />
          </div>
        ) : filteredTransfers.length > 0 ? (
          filteredTransfers.map(transfer => (
            <div 
              key={transfer.id}
              onClick={() => handleTransferClick(transfer)}
              className="group relative bg-[#14171F] border border-white/5 rounded-2xl overflow-hidden active:scale-[0.98] transition-all cursor-pointer hover:border-white/10"
            >
              {/* Si está pendiente, overlay de opacidad */}
              {transfer.status === 'NEGOTIATING' && (
                <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center backdrop-blur-[1px]">
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    En Trato
                  </span>
                </div>
              )}

              <div className="flex items-stretch h-28">
                {/* Image Side */}
                <div className="w-24 shrink-0 relative">
                  <img src={transfer.event_image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop"} className="w-full h-full object-cover" alt="Event" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#14171F]" />
                </div>

                {/* Content Side */}
                <div className="flex-1 p-3 flex flex-col justify-between relative z-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm leading-tight text-white line-clamp-1">{transfer.event_name || "Evento Privado"}</h3>
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">
                        {transfer.event_date ? new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(transfer.event_date)) : "Fecha a confirmar"}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-black text-[#D4FF00] text-sm">${transfer.price_agreed ? transfer.price_agreed.toLocaleString('es-AR') : transfer.price?.toLocaleString('es-AR')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-2">
                      {transfer.seller?.avatar_url ? (
                        <img src={transfer.seller.avatar_url} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-bold">
                          {transfer.seller?.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-neutral-300 leading-none">{transfer.seller?.name || "Usuario Vendedor"}</span>
                        <span className="text-[9px] text-neutral-500 flex items-center gap-0.5 mt-0.5">
                          <ShieldCheck className="w-2.5 h-2.5 text-indigo-400" />
                          Usuario Verificado
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-neutral-500">
            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No hay entradas disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}
