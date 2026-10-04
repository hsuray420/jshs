import { getLearningDatabase } from "./bindings";

export type WeaknessProfile = Readonly<{
  id: string;
  user_id: string;
  topic_id: string;
  mastery_score: number;
  wrong_count: number;
  attempt_count: number;
  confidence: number | null;
  updated_at: string;
}>;

async function ensureWeaknessSchema() {
  const db = getLearningDatabase();
  await db.prepare(`CREATE TABLE IF NOT EXISTS weakness_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    mastery_score REAL NOT NULL,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    confidence REAL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, topic_id)
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_weakness_profiles_user_updated ON weakness_profiles(user_id, updated_at)").run();
}

export async function listWeaknessProfiles(userId: string) {
  await ensureWeaknessSchema();
  const db = getLearningDatabase();
  const rows = await db.prepare(`SELECT id, user_id, topic_id, mastery_score, wrong_count,
    attempt_count, confidence, updated_at FROM weakness_profiles
    WHERE user_id = ? ORDER BY updated_at DESC LIMIT 500`).bind(userId).all<WeaknessProfile>();
  return rows.results ?? [];
}

export async function saveWeaknessProfile(input: Omit<WeaknessProfile, "id" | "updated_at">) {
  await ensureWeaknessSchema();
  const db = getLearningDatabase();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.prepare(`INSERT INTO weakness_profiles
    (id, user_id, topic_id, mastery_score, wrong_count, attempt_count, confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, topic_id) DO UPDATE SET mastery_score = excluded.mastery_score,
      wrong_count = excluded.wrong_count, attempt_count = excluded.attempt_count,
      confidence = excluded.confidence, updated_at = excluded.updated_at`)
    .bind(id, input.user_id, input.topic_id, input.mastery_score, input.wrong_count,
      input.attempt_count, input.confidence, now).run();
}
