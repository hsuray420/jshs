import { getLearningDatabase } from "./bindings";

export type MemberInterestProfile = Readonly<{
  id: string;
  user_id: string;
  answers_json: string;
  result_code: string;
  created_at: string;
  updated_at: string;
}>;

async function ensureInterestSchema() {
  const db = getLearningDatabase();
  await db.prepare(`CREATE TABLE IF NOT EXISTS member_interest_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    answers_json TEXT NOT NULL,
    result_code TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
}

export async function saveMemberInterestProfile(input: MemberInterestProfile) {
  await ensureInterestSchema();
  const db = getLearningDatabase();
  await db.prepare(`INSERT INTO member_interest_profiles
    (id, user_id, answers_json, result_code, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET answers_json = excluded.answers_json,
      result_code = excluded.result_code, updated_at = excluded.updated_at`).bind(
    input.id, input.user_id, input.answers_json, input.result_code, input.created_at, input.updated_at,
  ).run();
}

export async function getMemberInterestProfile(userId: string) {
  await ensureInterestSchema();
  const db = getLearningDatabase();
  return await db.prepare(`SELECT id, user_id, answers_json, result_code, created_at, updated_at
    FROM member_interest_profiles WHERE user_id = ? LIMIT 1`).bind(userId).first<MemberInterestProfile>();
}
