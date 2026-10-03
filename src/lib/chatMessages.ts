import type { ChatMessage } from "@/services/chat";

const statusOrder = { failed: -1, sending: 0, sent: 1, delivered: 2, read: 3 };
export function messageSortKey(message: ChatMessage): string {
  const fraction = message.timestamp.match(/\.(\d+)/)?.[1] ?? "";
  return `${new Date(message.timestamp).toISOString().slice(0, 19)}.${fraction.padEnd(9, "0")}|${message.id}`;
}
// Socket events, HTTP confirmations and history may arrive in either order.
export function mergeChatMessages(current: ChatMessage[], updates: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const update of updates) {
    const previous = byId.get(update.id);
    const status = (statusOrder[previous?.status ?? "sent"] > statusOrder[update.status ?? "sent"])
      ? previous?.status : update.status;
    byId.set(update.id, { ...previous, ...update, status });
  }
  return [...byId.values()].sort((a, b) => {
    return messageSortKey(a).localeCompare(messageSortKey(b));
  });
}
