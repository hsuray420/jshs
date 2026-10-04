import { getLearningDatabase } from "./bindings";

export type MemberScoreSnapshot = Readonly<{
  id: string;
  user_id: string;
  district: string;
  academic_year: string;
  total_score: number;
  result_json: string;
  created_at: string;
}>;

export async function ensureScoreSchema() {
  const db = getLearningDatabase();
  await db.prepare(`CREATE TABLE IF NOT EXISTS member_score_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    district TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    total_score REAL NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_member_score_history_user_created
    ON member_score_history(user_id, created_at)`).run();
}

export async function createMemberScoreSnapshot(input: MemberScoreSnapshot) {
  await ensureScoreSchema();
  const db = getLearningDatabase();
  await db.prepare(`INSERT INTO member_score_history
    (id, user_id, district, academic_year, total_score, result_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
    input.id, input.user_id, input.district, input.academic_year,
    input.total_score, input.result_json, input.created_at,
  ).run();
}

export async function listMemberScoreSnapshots(userId: string) {
  await ensureScoreSchema();
  const db = getLearningDatabase();
  const result = await db.prepare("SELECT * FROM member_score_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").bind(userId).all<MemberScoreSnapshot>();
  return result.results ?? [];
}

export async function hasMemberScoreSnapshot(userId: string, id: string) {
  await ensureScoreSchema();
  const db = getLearningDatabase();
  const result = await db.prepare("SELECT 1 AS present FROM member_score_history WHERE user_id = ? AND id = ? LIMIT 1").bind(userId, id).first<{ present: number }>();
  return result?.present === 1;
}
