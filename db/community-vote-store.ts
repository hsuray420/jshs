import { getCommunityDatabase } from "./bindings";

const getCommunityDb = () => getCommunityDatabase().db;

export type VoteTopic = { id: string; title: string; description: string; options_json: string; status: "open" | "closed"; ends_at: string | null; created_at: string };
export type VoteOption = { id: string; label: string };

export async function ensureVoteSchema() {
  const { db, mode } = getCommunityDatabase();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS community_vote_topics (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', options_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', ends_at TEXT, created_at TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_votes (topic_id TEXT NOT NULL, ${mode === "split" ? "user_id" : "line_user_id"} TEXT NOT NULL, option_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(topic_id, ${mode === "split" ? "user_id" : "line_user_id"}))`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_community_votes_topic ON community_votes(topic_id)`),
  ]);
}

export async function listVoteTopics() {
  await ensureVoteSchema();
  const result = await getCommunityDb().prepare(`SELECT * FROM community_vote_topics WHERE status = 'open' ORDER BY created_at DESC LIMIT 50`).all<VoteTopic>();
  return result.results ?? [];
}

export async function getVoteResults(topicId: string) {
  await ensureVoteSchema();
  const result = await getCommunityDb().prepare(`SELECT option_id, COUNT(*) AS count FROM community_votes WHERE topic_id = ? GROUP BY option_id`).bind(topicId).all<{ option_id: string; count: number }>();
  return result.results ?? [];
}

export async function castVote(topicId: string, userId: string, legacyLineUserId: string, optionId: string) {
  await ensureVoteSchema();
  const { db, mode } = getCommunityDatabase();
  const topic = await getCommunityDb().prepare(`SELECT * FROM community_vote_topics WHERE id = ? AND status = 'open' LIMIT 1`).bind(topicId).first<VoteTopic>();
  if (!topic) throw new Error("vote_topic_unavailable");
  const options = JSON.parse(topic.options_json) as VoteOption[];
  if (!options.some((option) => option.id === optionId)) throw new Error("vote_option_invalid");
  const ownerColumn = mode === "split" ? "user_id" : "line_user_id";
  const owner = mode === "split" ? userId : legacyLineUserId;
  await db.prepare(`INSERT INTO community_votes (topic_id, ${ownerColumn}, option_id, created_at) VALUES (?, ?, ?, ?)`).bind(topicId, owner, optionId, new Date().toISOString()).run();
}
