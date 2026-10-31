"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Plus, Search, ShieldCheck } from "lucide-react";
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

  const fieldClass =
    "w-full h-12 px-3.5 rounded-control bg-bg border border-line-strong text-[15px] text-ink placeholder:text-ink-3 outline-none focus:border-accent transition-colors";
  const formatDate = (raw?: string) => {
    if (!raw) return "Fecha a confirmar";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "Fecha a confirmar";
    return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Montevideo" })
      .format(date)
      .replace(/\./g, "");
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg text-ink pb-[calc(var(--root-mobile-nav-clearance)+1rem)] md:pb-16">
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Vender una entrada"
        footer={
          <Button onClick={handleCreateTransfer} disabled={isCreating} size="full">
            {isCreating ? <Loader2 className="size-4 animate-spin" aria-label="Publicando" /> : "Publicar oferta"}
          </Button>
        }
      >
        <form onSubmit={handleCreateTransfer} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="transfer-event" className="text-[13px] font-semibold">ID del evento</label>
            <input
              id="transfer-event"
              type="text"
              required
              value={newEventId}
              onChange={(e) => setNewEventId(e.target.value)}
              className={fieldClass}
              placeholder="ej. e1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="transfer-price" className="text-[13px] font-semibold">Precio</label>
            <input
              id="transfer-price"
              type="number"
              inputMode="numeric"
              required
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              aria-describedby="transfer-price-help"
              className={cn(fieldClass, "num-mono")}
              placeholder="ej. 650"
            />
            <span id="transfer-price-help" className="text-xs text-ink-2">
              Como máximo, el valor de taquilla original.
            </span>
          </div>
        </form>
      </Modal>

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
      />

      <ConfirmModal
        isOpen={selectedTransfer !== null}
        onClose={() => setSelectedTransfer(null)}
        title="Iniciar trato"
        message={selectedTransfer ? `¿Querés iniciar el trato con ${selectedTransfer.seller?.name || "este usuario"} por $ ${selectedTransfer.price || selectedTransfer.price_agreed}?` : ""}
        onConfirm={confirmStartDeal}
        isLoading={isStartingDeal}
      />

      <div className="w-full max-w-2xl mx-auto px-4 pt-[calc(0.75rem+var(--root-safe-top))] md:pt-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="size-11 shrink-0 rounded-control bg-surface border border-line flex items-center justify-center hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <h1 className="font-display text-[26px] m-0 flex-1">Transfers</h1>
          <Button onClick={() => setIsModalOpen(true)} className="h-11 pl-2.5 pr-3.5">
            <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" /> Vender
          </Button>
        </header>

        <div className="mt-4 p-3.5 flex gap-3 rounded-card bg-info/[0.08] border border-info/25">
          <ShieldCheck className="size-[22px] shrink-0 text-info" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold">Mercado P2P seguro</span>
            <span className="text-sm leading-snug text-ink-2">
              Precio tope: el valor de taquilla original. root retiene el dinero hasta que confirmes que entraste al evento.
            </span>
          </div>
        </div>

        <div role="tablist" aria-label="Transfers" className="mt-4 flex p-[3px] rounded-xl bg-surface border border-line">
          {([
            { id: "explorar", label: "Explorar" },
            { id: "mis-ofertas", label: "Mis ofertas" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 h-10 rounded-[9px] text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                activeTab === tab.id ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-3 h-12 px-3.5 flex items-center gap-2.5 rounded-control bg-surface border border-white/10 text-ink-3 focus-within:border-accent">
          <Search className="size-5 shrink-0" aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar evento"
            placeholder="Buscar evento"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15px] text-ink placeholder:text-ink-3"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 text-accent animate-spin" aria-label="Cargando transfers" />
            </div>
          ) : filteredTransfers.length > 0 ? (
            filteredTransfers.map((transfer) => {
              const isNegotiating = transfer.status === "NEGOTIATING";
              const isMine = transfer.seller_id === user?.id || transfer.buyer_id === user?.id;
              const isAvailable = transfer.status?.toUpperCase() === "AVAILABLE";
              const price = transfer.price_agreed ?? transfer.price;
              return (
                <button
                  key={transfer.id}
                  type="button"
                  onClick={() => handleTransferClick(transfer)}
                  disabled={!isMine && !isAvailable}
                  className={cn(
                    "flex gap-3 p-3 rounded-card bg-surface border border-line text-left transition-colors hover:bg-surface-2 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:hover:bg-surface",
                    isNegotiating && "opacity-75",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="size-[72px] shrink-0 rounded-xl bg-surface-2 bg-cover bg-center"
                    style={{ backgroundImage: `url(${transfer.event_image || FALLBACK_IMAGE})` }}
                  />
                  <span className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="text-base font-semibold truncate">{transfer.event_name || "Evento privado"}</span>
                    <span className="label-mono text-accent">{formatDate(transfer.event_date)}</span>
                    <span className="text-[13px] text-ink-2 truncate">
                      Vende {transfer.seller?.name || "usuario verificado"}
                    </span>
                  </span>
                  <span className="shrink-0 flex flex-col items-end justify-between">
                    <span className="num-mono text-[17px] font-semibold">
                      {price != null ? `$ ${Number(price).toLocaleString("es-AR")}` : "—"}
                    </span>
                    <span
                      className={cn(
                        "label-mono px-2 py-1 rounded-full",
                        isNegotiating ? "bg-surface-2 text-ink-2" : "bg-accent/12 text-accent",
                      )}
                    >
                      {isNegotiating ? "En trato" : isAvailable ? "Disponible" : transfer.status}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="py-12 text-center text-[15px] text-ink-2">
              {activeTab === "mis-ofertas" ? "Todavía no publicaste ofertas." : "No hay entradas disponibles."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop";
