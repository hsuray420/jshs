import { getLearningDatabase } from "./bindings";

export type MockExamRecord = { id: string; line_user_id?: string; name: string; exam_date: string; subjects_json: string; essay: string; created_at: string; updated_at: string };

export async function ensureMockExamSchema() {
  const db = getLearningDatabase();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS member_mock_exams (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, exam_date TEXT NOT NULL, subjects_json TEXT NOT NULL, essay TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_member_mock_exams_user_date ON member_mock_exams(user_id, exam_date DESC)"),
  ]);
}

export async function listMockExams(userId: string) {
  await ensureMockExamSchema();
  const db = getLearningDatabase();
  const result = await db.prepare("SELECT * FROM member_mock_exams WHERE user_id = ? ORDER BY exam_date DESC, created_at DESC LIMIT 100").bind(userId).all<MockExamRecord>();
  return result.results ?? [];
}
export async function saveMockExam(record: MockExamRecord & { user_id?: string }) {
  await ensureMockExamSchema();
  if (!record.user_id) throw new Error("member_user_id_required");
  const db = getLearningDatabase();
  await db.prepare(`INSERT INTO member_mock_exams (id,user_id,name,exam_date,subjects_json,essay,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, exam_date=excluded.exam_date,
      subjects_json=excluded.subjects_json, essay=excluded.essay, updated_at=excluded.updated_at
    WHERE member_mock_exams.user_id = excluded.user_id`).bind(record.id, record.user_id, record.name, record.exam_date, record.subjects_json, record.essay, record.created_at, record.updated_at).run();
}
export async function deleteMockExam(userId: string, id: string) {
  await ensureMockExamSchema();
  const db = getLearningDatabase();
  await db.prepare("DELETE FROM member_mock_exams WHERE user_id = ? AND id = ?").bind(userId, id).run();
}
export async function hasMockExam(userId: string, id: string) {
  await ensureMockExamSchema();
  const db = getLearningDatabase();
  const result = await db.prepare("SELECT 1 AS present FROM member_mock_exams WHERE user_id = ? AND id = ? LIMIT 1").bind(userId, id).first<{ present: number }>();
  return result?.present === 1;
}
