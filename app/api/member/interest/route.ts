import { getMemberSession } from "../../../../lib/member-auth";
import { saveMemberInterestProfile } from "../../../../db/interest-store";

export async function POST(request: Request) {
  const member = await getMemberSession();
  if (!member) return Response.json({ error: "member_required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { answers?: unknown; resultCode?: unknown } | null;
  if (!body || !Array.isArray(body.answers) || body.answers.length !== 6 || body.answers.some((answer) => typeof answer !== "string") || typeof body.resultCode !== "string" || !/^[RIASEC]{1,6}$/.test(body.resultCode)) {
    return Response.json({ error: "invalid_interest_profile" }, { status: 400 });
  }
  const now = new Date().toISOString();
  await saveMemberInterestProfile({
    id: crypto.randomUUID(),
    user_id: member.lineUserId,
    answers_json: JSON.stringify(body.answers),
    result_code: body.resultCode,
    created_at: now,
    updated_at: now,
  });
  return Response.json({ saved: true });
}
