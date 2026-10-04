import { listMemberScoreSnapshots } from "../../../../db/score-store";
import { getMemberSession, getMemberUserId } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  const userId = await getMemberUserId(member);
  const snapshots = await listMemberScoreSnapshots(userId);
  return Response.json({ ok: true, snapshots }, { headers: { "cache-control": "no-store" } });
}
