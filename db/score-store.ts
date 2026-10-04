import { getLearningDatabase } from "./bindings";

export type MemberScoreSnapshot = Readonly<{
  id: string;
  line_user_id?: string;
  district: string;
  academic_year: string;
  total_score: number;
  result_json: string;
  created_at: string;
}>;

export async function ensureScoreSchema() {
  const { db, mode } = getLearningDatabase();
  await db.prepare(`CREATE TABLE IF NOT EXISTS member_score_history (
    id TEXT PRIMARY KEY,
    ${mode === "split" ? "user_id TEXT NOT NULL," : "line_user_id TEXT NOT NULL,"}
    district TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    total_score REAL NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_member_score_history_user_created
    ON member_score_history(${mode === "split" ? "user_id" : "line_user_id"}, created_at)`).run();
}

export async function createMemberScoreSnapshot(input: MemberScoreSnapshot & { user_id?: string }) {
  await ensureScoreSchema();
  const { db, mode } = getLearningDatabase();
  if (mode === "split") {
    if (!input.user_id) throw new Error("member_user_id_required");
    await db.prepare(`INSERT INTO member_score_history
      (id, user_id, district, academic_year, total_score, result_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET district = excluded.district,
        academic_year = excluded.academic_year, total_score = excluded.total_score,
        result_json = excluded.result_json, created_at = excluded.created_at
      WHERE member_score_history.user_id = excluded.user_id`).bind(
      input.id, input.user_id, input.district, input.academic_year, input.total_score, input.result_json, input.created_at,
    ).run();
    return;
  }
  if (!input.line_user_id) throw new Error("legacy_line_user_id_required");
  await db.prepare(`INSERT INTO member_score_history
    (id, line_user_id, district, academic_year, total_score, result_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
    input.id, input.line_user_id, input.district, input.academic_year,
    input.total_score, input.result_json, input.created_at,
  ).run();
}

export async function listMemberScoreSnapshots(userId: string, legacyLineUserId = userId) {
  await ensureScoreSchema();
  const { db, mode } = getLearningDatabase();
  const ownerColumn = mode === "split" ? "user_id" : "line_user_id";
  const owner = mode === "split" ? userId : legacyLineUserId;
  const result = await db.prepare(`SELECT * FROM member_score_history
    WHERE ${ownerColumn} = ? ORDER BY created_at DESC LIMIT 20`).bind(owner).all<MemberScoreSnapshot>();
  return result.results ?? [];
}

export async function hasMemberScoreSnapshot(userId: string, id: string, legacyLineUserId = userId) {
  await ensureScoreSchema();
  const { db, mode } = getLearningDatabase();
  const ownerColumn = mode === "split" ? "user_id" : "line_user_id";
  const owner = mode === "split" ? userId : legacyLineUserId;
  const result = await db.prepare(`SELECT 1 AS present FROM member_score_history
    WHERE ${ownerColumn} = ? AND id = ? LIMIT 1`).bind(owner, id).first<{ present: number }>();
  return result?.present === 1;
}
