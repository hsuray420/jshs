import { getOrCreateMemberPlanner, listPlannerVersions } from "../../../../db/planner-store";
import { getMemberSession } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  const plannerId = await getOrCreateMemberPlanner(member.lineUserId);
  const versions = await listPlannerVersions(plannerId);
  return Response.json({ ok: true, versions: versions.map((version) => ({ id: version.id, itemCount: version.item_count, createdAt: version.created_at, state: JSON.parse(version.state_json) })) }, { headers: { "cache-control": "no-store" } });
}
