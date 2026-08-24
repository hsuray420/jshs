import { getOrCreateMemberPlanner, getPlannerState, savePlannerState } from "../../../../db/planner-store";
import { getMemberSession } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "jshs_planner_id";
const MAX_AGE = 365 * 24 * 60 * 60;
const MAX_STATE_BYTES = 60_000;

export async function GET() {
  const plannerId = await memberPlanner();
  if (!plannerId) return memberRequired();
  const stateJson = await getPlannerState(plannerId);
  const state = parseState(stateJson);
  return plannerResponse({ ok: true, state }, plannerId);
}

export async function PUT(request: Request) {
  const plannerId = await memberPlanner();
  if (!plannerId) return memberRequired();
  const body = await request.json().catch(() => null) as { state?: unknown } | null;
  if (!body || !isRecord(body.state)) {
    return Response.json({ ok: false, error: "invalid_state" }, { status: 400 });
  }

  const stateJson = JSON.stringify(body.state);
  if (new TextEncoder().encode(stateJson).byteLength > MAX_STATE_BYTES) {
    return Response.json({ ok: false, error: "state_too_large" }, { status: 413 });
  }

  await savePlannerState(plannerId, stateJson);
  return plannerResponse({ ok: true }, plannerId);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
