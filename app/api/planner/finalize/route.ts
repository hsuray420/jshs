import { confirmPlanner, getOrCreateMemberPlanner, getPlannerState, listPlannerItems } from "../../../../db/planner-store";
import { getMemberSession } from "../../../../lib/member-auth";
import { notifyMember } from "../../../../lib/notifications";

export const dynamic = "force-dynamic";

export async function POST() {
  const member = await getMemberSession();
  if (!member) return memberRequired();

  const plannerId = await getOrCreateMemberPlanner(member.lineUserId);
  const items = await listPlannerItems(plannerId);
  if (!items.length) {
    return Response.json({ ok: false, error: "planner_empty" }, { status: 400 });
  }

  const stateJson = (await getPlannerState(plannerId)) || JSON.stringify({ itemMeta: {}, tasks: {} });
  const confirmedAt = await confirmPlanner(plannerId, items.length, stateJson);
  const notification = await notifyMember({
    eventKey: "planner_finalized",
    lineUserId: member.lineUserId,
    referenceId: confirmedAt,
    values: { count: items.length },
  });

  return Response.json({
    ok: true,
    confirmedAt,
    itemCount: items.length,
    notification: { sent: notification.sent, skipped: notification.skipped },
  }, { headers: { "cache-control": "no-store" } });
}

function memberRequired() {
  return Response.json(
    { ok: false, error: "member_required", loginPath: "/api/line/login/start" },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
}
