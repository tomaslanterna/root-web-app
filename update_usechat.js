const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/hooks/useChat.ts");
let content = fs.readFileSync(filePath, "utf8");

if (!content.includes("refreshMessages")) {
  content = content.replace(
    "return { messages, sendMessage, isLoadingChat: isLoading };",
    "return { messages, sendMessage, isLoadingChat: isLoading, refreshMessages: fetchMessages };",
  );
  fs.writeFileSync(filePath, content, "utf8");
}
