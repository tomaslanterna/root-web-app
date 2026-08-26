const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/app/transfers/[id]/page.tsx");
let content = fs.readFileSync(filePath, "utf8");

// Use refreshMessages
content = content.replace(
  "const { messages, sendMessage, isLoadingChat } = useChat(transfer?.chat_id);",
  "const { messages, sendMessage, isLoadingChat, refreshMessages } = useChat(transfer?.chat_id);",
);

const oldUpdateStatus = `  const updateStatus = async (status: string) => {
    try {
      await api.patch(\`/v1/transfers/\${transferId}/status\`, { status });
      setTransfer((prev: any) => ({ ...prev, status }));
      setIsConfirming(false);
    } catch (err) {
      console.error(err);
    }
  };`;

const newUpdateStatus = `  const updateStatus = async (status: string) => {
    try {
      await api.patch(\`/v1/transfers/\${transferId}/status\`, { status });
      setTransfer((prev: any) => ({ ...prev, status }));
      setIsConfirming(false);
      // Force refresh messages to show the new system message immediately
      if (refreshMessages) refreshMessages();
    } catch (err) {
      console.error(err);
    }
  };`;

if (content.includes("const updateStatus = async")) {
  content = content.replace(oldUpdateStatus, newUpdateStatus);
  fs.writeFileSync(filePath, content, "utf8");
}
