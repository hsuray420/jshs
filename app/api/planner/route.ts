import { createPlannerItem, deletePlannerItem, listPlannerItems } from "../../../db/planner-store";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "jshs_planner_id";
const MAX_AGE = 365 * 24 * 60 * 60;

export async function GET(request: Request) {
  const planner = plannerIdentity(request);
  const items = await listPlannerItems(planner.id);
  return plannerResponse({ ok: true, items }, planner.created ? planner.id : undefined);
}

export async function POST(request: Request) {
  const planner = plannerIdentity(request);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });

  const schoolName = clean(body.schoolName, 120);
  const schoolCode = clean(body.schoolCode, 40);
  const district = clean(body.district, 40);
  const tier = clean(body.tier, 20);
  const notes = clean(body.notes, 1000);
  if (!schoolName || !district) return Response.json({ ok: false, error: "school_required" }, { status: 400 });
  if (tier && !["challenge", "balanced", "stable"].includes(tier)) return Response.json({ ok: false, error: "invalid_tier" }, { status: 400 });

  const item = {
    id: crypto.randomUUID(), planner_id: planner.id, district, school_code: schoolCode,
    school_name: schoolName, department: clean(body.department, 1200), tier, notes,
    created_at: new Date().toISOString(),
  };
  await createPlannerItem(item);
  return plannerResponse({ ok: true, item }, planner.created ? planner.id : undefined, 201);
}

export async function DELETE(request: Request) {
  const planner = plannerIdentity(request);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const id = clean(body?.id, 80);
  if (!id) return Response.json({ ok: false, error: "id_required" }, { status: 400 });
  await deletePlannerItem(planner.id, id);
  return plannerResponse({ ok: true }, planner.created ? planner.id : undefined);
}

function plannerIdentity(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const value = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (value && /^[0-9a-f-]{36}$/i.test(value)) return { id: value, created: false };
  return { id: crypto.randomUUID(), created: true };
}

function plannerResponse(body: unknown, newPlannerId?: string, status = 200) {
  const headers = new Headers({ "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  if (newPlannerId) headers.append("set-cookie", `${COOKIE_NAME}=${newPlannerId}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
  return new Response(JSON.stringify(body), { status, headers });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
