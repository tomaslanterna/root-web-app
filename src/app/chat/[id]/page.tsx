"use client";

import { use } from "react";
import { ChatConversation } from "@/components/match/ChatConversation";

export default function ChatConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ChatConversation key={id} chatId={id} />;
}
