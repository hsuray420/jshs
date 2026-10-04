import { listWeaknessProfiles, saveWeaknessProfile } from "../../../../db/weakness-store";
import { getMemberSession, getMemberUserId } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required" }, { status: 401 });
  const profiles = await listWeaknessProfiles(await getMemberUserId(member));
  return Response.json({ ok: true, profiles }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.topicId !== "string" || !/^[\w:-]{1,160}$/.test(body.topicId)
    || typeof body.masteryScore !== "number" || !Number.isFinite(body.masteryScore) || body.masteryScore < 0 || body.masteryScore > 100
    || !Number.isSafeInteger(body.wrongCount) || Number(body.wrongCount) < 0
    || !Number.isSafeInteger(body.attemptCount) || Number(body.attemptCount) < 0
    || !(body.confidence === null || (typeof body.confidence === "number" && Number.isFinite(body.confidence) && body.confidence >= 0 && body.confidence <= 1))) {
    return Response.json({ ok: false, error: "invalid_weakness_profile" }, { status: 400 });
  }
  await saveWeaknessProfile({
    user_id: await getMemberUserId(member),
    topic_id: body.topicId,
    mastery_score: body.masteryScore,
    wrong_count: Number(body.wrongCount),
    attempt_count: Number(body.attemptCount),
    confidence: body.confidence,
  });
  const profiles = await listWeaknessProfiles(await getMemberUserId(member));
  const profile = profiles.find((item) => item.topic_id === body.topicId);
  if (!profile) return Response.json({ ok: false, error: "weakness_readback_failed" }, { status: 502 });
  return Response.json({ ok: true, profile }, { headers: { "cache-control": "no-store" } });
}
