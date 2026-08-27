import { getD1 } from "./admin-store";

export type MemberScoreSnapshot = Readonly<{
  id: string;
  line_user_id: string;
  district: string;
  academic_year: string;
  total_score: number;
  result_json: string;
  created_at: string;
}>;

export async function ensureScoreSchema() {
  await getD1().prepare(`CREATE TABLE IF NOT EXISTS member_score_history (
    id TEXT PRIMARY KEY,
    line_user_id TEXT NOT NULL,
    district TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    total_score REAL NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`).run();
  await getD1().prepare(`CREATE INDEX IF NOT EXISTS idx_member_score_history_user_created
    ON member_score_history(line_user_id, created_at)`).run();
}

export async function createMemberScoreSnapshot(input: MemberScoreSnapshot) {
  await ensureScoreSchema();
  await getD1().prepare(`INSERT INTO member_score_history
    (id, line_user_id, district, academic_year, total_score, result_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
    input.id, input.line_user_id, input.district, input.academic_year,
    input.total_score, input.result_json, input.created_at,
  ).run();
}

export async function listMemberScoreSnapshots(lineUserId: string) {
  await ensureScoreSchema();
  const result = await getD1().prepare(`SELECT * FROM member_score_history
    WHERE line_user_id = ? ORDER BY created_at DESC LIMIT 20`).bind(lineUserId).all<MemberScoreSnapshot>();
  return result.results ?? [];
}
