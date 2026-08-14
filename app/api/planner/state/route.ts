import { getPlannerState, savePlannerState } from "../../../../db/planner-store";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "jshs_planner_id";
const MAX_AGE = 365 * 24 * 60 * 60;
const MAX_STATE_BYTES = 60_000;

export async function GET(request: Request) {
  const planner = plannerIdentity(request);
  const stateJson = await getPlannerState(planner.id);
  const state = parseState(stateJson);
  return plannerResponse({ ok: true, state }, planner.created ? planner.id : undefined);
}

export async function PUT(request: Request) {
  const planner = plannerIdentity(request);
  const body = await request.json().catch(() => null) as { state?: unknown } | null;
  if (!body || !isRecord(body.state)) {
    return Response.json({ ok: false, error: "invalid_state" }, { status: 400 });
  }

  const stateJson = JSON.stringify(body.state);
  if (new TextEncoder().encode(stateJson).byteLength > MAX_STATE_BYTES) {
    return Response.json({ ok: false, error: "state_too_large" }, { status: 413 });
  }

  await savePlannerState(planner.id, stateJson);
  return plannerResponse({ ok: true }, planner.created ? planner.id : undefined);
}

function parseState(stateJson: string | null) {
  if (!stateJson) return null;
  try {
    const parsed = JSON.parse(stateJson) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
