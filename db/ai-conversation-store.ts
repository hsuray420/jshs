import { getD1 } from "./admin-store";

export async function ensureAiConversationSchema() {
  await getD1().prepare(`CREATE TABLE IF NOT EXISTS member_ai_conversations (
    line_user_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    conversation_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (line_user_id, conversation_id)
  )`).run();
  await getD1().prepare(`CREATE INDEX IF NOT EXISTS idx_member_ai_conversations_updated
    ON member_ai_conversations(line_user_id, updated_at)`).run();
}

export async function listMemberAiConversations(lineUserId: string) {
  await ensureAiConversationSchema();
  const result = await getD1().prepare(`SELECT conversation_json FROM member_ai_conversations
    WHERE line_user_id = ? ORDER BY updated_at DESC LIMIT 50`).bind(lineUserId).all<{ conversation_json: string }>();
  return (result.results ?? []).flatMap(({ conversation_json }) => {
    try { return [JSON.parse(conversation_json)]; } catch { return []; }
  });
}

export async function saveMemberAiConversation(lineUserId: string, conversation: Record<string, unknown>) {
  await ensureAiConversationSchema();
  const id = typeof conversation.id === "string" ? conversation.id : "";
  const title = typeof conversation.title === "string" ? conversation.title.slice(0, 120) : "新對話";
  const serialized = JSON.stringify(conversation);
  if (!id || serialized.length > 60_000) throw new Error("invalid_ai_conversation");
  await getD1().prepare(`INSERT INTO member_ai_conversations
    (line_user_id, conversation_id, title, conversation_json, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(line_user_id, conversation_id) DO UPDATE SET
      title = excluded.title,
      conversation_json = excluded.conversation_json,
      updated_at = excluded.updated_at`).bind(
    lineUserId, id, title, serialized, new Date().toISOString(),
  ).run();
}
