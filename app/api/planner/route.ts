import { createPlannerItem, deletePlannerItem, getOrCreateMemberPlanner, listPlannerItems } from "../../../db/planner-store";
import { getMemberSession } from "../../../lib/member-auth";
import { getAdmissionChoiceLimit } from "../../../lib/admission-score";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "jshs_planner_id";
const MAX_AGE = 365 * 24 * 60 * 60;

export async function GET() {
  const plannerId = await memberPlanner();
  if (!plannerId) return memberRequired();
  const items = await listPlannerItems(plannerId);
  return plannerResponse({ ok: true, items }, plannerId);
}

export async function POST(request: Request) {
  const plannerId = await memberPlanner();
  if (!plannerId) return memberRequired();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });

  const schoolName = clean(body.schoolName, 120);
  const schoolCode = clean(body.schoolCode, 40);
  const district = clean(body.district, 40);
  const tier = clean(body.tier, 20);
  const notes = clean(body.notes, 1000);
  if (!schoolName || !district) return Response.json({ ok: false, error: "school_required" }, { status: 400 });
  if (tier && !["challenge", "balanced", "stable"].includes(tier)) return Response.json({ ok: false, error: "invalid_tier" }, { status: 400 });

  const existingItems = await listPlannerItems(plannerId);
  const existing = existingItems.find((item) => item.district === district && item.school_code === schoolCode && item.department === clean(body.department, 1200));
  if (existing) return plannerResponse({ ok: true, item: existing, duplicate: true }, plannerId);
  if (existingItems.filter((item) => item.district === district).length >= getAdmissionChoiceLimit(district)) return Response.json({ ok: false, error: "choice_limit_reached" }, { status: 409 });

  const item = {
    id: crypto.randomUUID(), planner_id: plannerId, district, school_code: schoolCode,
    school_name: schoolName, department: clean(body.department, 1200), tier, notes,
    created_at: new Date().toISOString(),
  };
  await createPlannerItem(item);
  return plannerResponse({ ok: true, item }, plannerId, 201);
}

export async function DELETE(request: Request) {
  const plannerId = await memberPlanner();
  if (!plannerId) return memberRequired();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const id = clean(body?.id, 80);
  if (!id) return Response.json({ ok: false, error: "id_required" }, { status: 400 });
  await deletePlannerItem(plannerId, id);
  return plannerResponse({ ok: true }, plannerId);
}

async function memberPlanner() {
  const member = await getMemberSession();
  return member ? getOrCreateMemberPlanner(member.lineUserId) : null;
}

function memberRequired() {
  return Response.json(
    { ok: false, error: "member_required", loginPath: "/api/line/login/start" },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
}

function plannerResponse(body: unknown, plannerId: string, status = 200) {
  const headers = new Headers({ "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  headers.append("set-cookie", `${COOKIE_NAME}=${plannerId}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
  return new Response(JSON.stringify(body), { status, headers });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
