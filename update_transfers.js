const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/app/transfers/page.tsx");
let content = fs.readFileSync(filePath, "utf8");

// Imports
content = content.replace(
  'import { api } from "@/lib/api";',
  'import { api } from "@/lib/api";\nimport { Modal, AlertModal, ConfirmModal } from "@/components/ui/Modal";\nimport { Button } from "@/components/ui/Button";',
);

// State
const stateToAdd = `
  // Modal States
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: "", message: "" });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", isLoading: false, onConfirm: () => {} });

  const showAlert = (title, message) => setAlertConfig({ isOpen: true, title, message });
`;

content = content.replace(
  "const [isCreating, setIsCreating] = useState(false);",
  "const [isCreating, setIsCreating] = useState(false);" + stateToAdd,
);

// handleCreateTransfer alert
content = content.replace(
  'alert("Hubo un error al crear el transfer");',
  'showAlert("Error", "Hubo un error al crear el transfer");',
);

// handleTransferClick
const handleTransferClickRegex =
  /const handleTransferClick = async \(transfer: any\) => \{[\s\S]*?\n  \};/m;
const newHandleTransferClick = `const handleTransferClick = async (transfer: any) => {
    if (transfer.seller_id === user?.id || transfer.buyer_id === user?.id) {
      router.push(\`/transfers/\${transfer.id}\`);
      return;
    }

    if (transfer.status === 'AVAILABLE') {
      setConfirmConfig({
        isOpen: true,
        title: "Iniciar Trato",
        message: \`¿Quieres iniciar trato con \${transfer.seller?.name || "este usuario"} por $\${transfer.price_agreed}?\`,
        isLoading: false,
        onConfirm: async () => {
          setConfirmConfig(prev => ({ ...prev, isLoading: true }));
          try {
            await api.post(\`/v1/transfers/\${transfer.id}/start-deal\`);
            router.push(\`/transfers/\${transfer.id}\`);
            setConfirmConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
          } catch (error: any) {
            setConfirmConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
            if (error.response?.status === 409) {
              showAlert("Aviso", "Lo siento, alguien más ya inició el trato por esta entrada.");
            } else {
              showAlert("Error", "Error al intentar iniciar trato.");
            }
            fetchTransfers();
          }
        }
      });
    }
  };`;

content = content.replace(handleTransferClickRegex, newHandleTransferClick);

// Replace Create Modal UI
const oldModalRegex =
  /\{isModalOpen && \([\s\S]*?w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"[\s\S]*?\{isCreating \? <Loader2 className="w-5 h-5 animate-spin mx-auto" \/> : "Crear Oferta"\}[\s\S]*?<\/button>[\s\S]*?<\/form>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)}/m;

const newModalUI = `<Modal 
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
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({...prev, isOpen: false}))}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        isLoading={confirmConfig.isLoading}
      />`;

content = content.replace(oldModalRegex, newModalUI);

fs.writeFileSync(filePath, content, "utf8");
