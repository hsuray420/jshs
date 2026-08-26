import type { Metadata } from "next";
import { AiChatPage } from "@/components/ai-assistant";

export const metadata: Metadata = { title: "AI 小助手 Beta｜全國國中升學資訊網", description: "AI 小助手 Beta：可以回答一般問題，也能查找本站升學與學校資料。", alternates: { canonical: "/ai" } };

export default async function AiPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const params = await searchParams;
  return <AiChatPage initialConversationId={params.conversation || ""} />;
}
