import { createPlannerVersion, getOrCreateMemberPlanner, getPlannerVersion, listPlannerItems, replacePlannerItems, savePlannerState, listPlannerVersions } from "../../../../db/planner-store";
import { getMemberSession } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  const plannerId = await getOrCreateMemberPlanner(member.lineUserId);
  const versions = await listPlannerVersions(plannerId);
  return Response.json({ ok: true, versions: versions.map((version) => ({ id: version.id, itemCount: version.item_count, createdAt: version.created_at, state: JSON.parse(version.state_json), items: parseItems(version.items_json) })) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  const plannerId = await getOrCreateMemberPlanner(member.lineUserId);
  const body = await request.json().catch(() => null) as { versionId?: unknown } | null;
  const versionId = typeof body?.versionId === "string" ? body.versionId.trim().slice(0, 80) : "";
  if (!versionId) return Response.json({ ok: false, error: "version_required" }, { status: 400 });
  const version = await getPlannerVersion(plannerId, versionId);
  if (!version) return Response.json({ ok: false, error: "version_not_found" }, { status: 404 });
  const items = parseItems(version.items_json);
  if (version.item_count > 0 && !items.length) return Response.json({ ok: false, error: "version_items_unavailable" }, { status: 409 });
  await replacePlannerItems(plannerId, items);
  await savePlannerState(plannerId, version.state_json);
  const restoredItems = await listPlannerItems(plannerId);
  await createPlannerVersion(plannerId, version.state_json, restoredItems);
  return Response.json({ ok: true, state: JSON.parse(version.state_json) }, { headers: { "cache-control": "no-store" } });
}

function parseItems(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
