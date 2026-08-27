import { castVote, getVoteResults, listVoteTopics } from "../../../../db/community-vote-store";
import { getMemberSession } from "../../../../lib/member-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const topics = await listVoteTopics();
  const results = await Promise.all(topics.map(async (topic) => ({ topic, results: await getVoteResults(topic.id) })));
  return Response.json({ ok: true, topics: results.map(({ topic, results: counts }) => ({ id: topic.id, title: topic.title, description: topic.description, options: JSON.parse(topic.options_json), counts })) });
}

export async function POST(request: Request) {
  const member = await getMemberSession();
  if (!member) return Response.json({ ok: false, error: "member_required", loginPath: "/api/line/login/start" }, { status: 401 });
  const body = await request.json().catch(() => null) as { topicId?: unknown; optionId?: unknown } | null;
  if (typeof body?.topicId !== "string" || typeof body.optionId !== "string") return Response.json({ ok: false, error: "vote_required" }, { status: 400 });
  try {
    await castVote(body.topicId.slice(0, 100), member.lineUserId, body.optionId.slice(0, 100));
    return Response.json({ ok: true, results: await getVoteResults(body.topicId) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "vote_failed";
    return Response.json({ ok: false, error: message === "vote_topic_unavailable" ? message : message === "vote_option_invalid" ? message : "already_voted_or_unavailable" }, { status: 409 });
  }
}
