import { createMemberScoreSnapshot, listMemberScoreSnapshots } from "../../../../db/score-store";
import { getMemberSession, getMemberUserId } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  const userId = await getMemberUserId(member);
  const snapshots = await listMemberScoreSnapshots(userId);
  return Response.json({ ok: true, snapshots }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  const body = await request.json().catch(() => null) as { district?: string; academicYear?: string; result?: { totalScore?: number | null } } | null;
  if (!body?.district || !body.academicYear || !body.result || typeof body.result.totalScore !== "number") return Response.json({ ok: false, error: "invalid_score_snapshot" }, { status: 400 });
  const userId = await getMemberUserId(member);
  await createMemberScoreSnapshot({ id: crypto.randomUUID(), user_id: userId, district: body.district, academic_year: body.academicYear, total_score: body.result.totalScore, result_json: JSON.stringify(body.result), created_at: new Date().toISOString() });
  return Response.json({ ok: true });
}
