import type { Metadata } from "next";
import { AiChatPage } from "@/components/ai-assistant";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = { title: "AI 小助手｜全國國中升學資訊網", description: "只根據本站升學內容回答的本機 AI 對話助手。", alternates: { canonical: "/ai" } };

export default async function AiPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const member = await getMemberSession();
  const params = await searchParams;
  return <AiChatPage isMember={Boolean(member)} initialConversationId={params.conversation || ""} />;
}
