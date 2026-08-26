const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/app/transfers/page.tsx");
let content = fs.readFileSync(filePath, "utf8");

// The original inline modal is probably still there. Let's find it.
const modalStart = content.indexOf("{isModalOpen && (");
if (modalStart !== -1) {
  // Find where the modal ends. It ends with:
  // </form>
  //           </div>
  //         </div>
  //       )}

  const modalEndStr = "          </div>\n        </div>\n      )}";
  const modalEnd = content.indexOf(modalEndStr, modalStart);

  if (modalEnd !== -1) {
    const fullOldModal = content.substring(
      modalStart,
      modalEnd + modalEndStr.length,
    );

    const newModals = `      <Modal 
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

    content = content.replace(fullOldModal, newModals);
    fs.writeFileSync(filePath, content, "utf8");
  } else {
    console.log("Could not find modal end");
  }
} else {
  console.log("Could not find modal start");
}
