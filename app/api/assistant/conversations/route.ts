import { listMemberAiConversations, saveMemberAiConversation } from "../../../../db/ai-conversation-store";
import { getMemberSession } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  return Response.json({ ok: true, conversations: await listMemberAiConversations(member.lineUserId) }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(request: Request) {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  const body = await request.json().catch(() => null) as { conversation?: unknown } | null;
  if (!body?.conversation || typeof body.conversation !== "object" || Array.isArray(body.conversation)) {
    return Response.json({ ok: false, error: "invalid_conversation" }, { status: 400 });
  }
  try {
    await saveMemberAiConversation(member.lineUserId, body.conversation as Record<string, unknown>);
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "invalid_conversation" }, { status: 400 });
  }
}
