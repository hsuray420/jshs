import { listMemberScoreSnapshots } from "../../../../db/score-store";
import { getMemberSession } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  const snapshots = await listMemberScoreSnapshots(member.lineUserId);
  return Response.json({ ok: true, snapshots }, { headers: { "cache-control": "no-store" } });
}
