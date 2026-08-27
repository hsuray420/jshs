import { getMemberNotificationPreferences, updateMemberNotificationPreferences, type NotificationPreferenceKey } from "../../../../db/notification-store";
import { getMemberSession } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

const preferenceKeys: readonly NotificationPreferenceKey[] = [
  "planner_finalized_enabled",
  "score_calculated_enabled",
  "important_date_enabled",
  "weekly_report_enabled",
];

export async function GET() {
  const member = await getMemberSession();
  if (!member) return memberRequired();
  const preferences = await getMemberNotificationPreferences(member.lineUserId);
  return Response.json({ ok: true, preferences }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const member = await getMemberSession();
  if (!member) return memberRequired();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });

  const patch: Partial<Record<NotificationPreferenceKey, boolean>> = {};
  for (const key of preferenceKeys) {
    if (key in body) {
      if (typeof body[key] !== "boolean") return Response.json({ ok: false, error: "invalid_preference" }, { status: 400 });
      patch[key] = body[key] as boolean;
    }
  }
  if (!Object.keys(patch).length) return Response.json({ ok: false, error: "preference_required" }, { status: 400 });

  const preferences = await updateMemberNotificationPreferences(member.lineUserId, patch);
  return Response.json({ ok: true, preferences }, { headers: { "cache-control": "no-store" } });
}

function memberRequired() {
  return Response.json(
    { ok: false, error: "member_required", loginPath: "/api/line/login/start" },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
}
