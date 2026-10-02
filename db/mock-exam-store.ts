import { getD1 } from "./admin-store";

export type MockExamRecord = { id: string; line_user_id: string; name: string; exam_date: string; subjects_json: string; essay: string; created_at: string; updated_at: string };

export async function ensureMockExamSchema() {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS member_mock_exams (id TEXT PRIMARY KEY, line_user_id TEXT NOT NULL, name TEXT NOT NULL, exam_date TEXT NOT NULL, subjects_json TEXT NOT NULL, essay TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_member_mock_exams_user_date ON member_mock_exams(line_user_id, exam_date DESC)`),
  ]);
}

export async function listMockExams(lineUserId: string) { await ensureMockExamSchema(); const result = await getD1().prepare("SELECT * FROM member_mock_exams WHERE line_user_id = ? ORDER BY exam_date DESC, created_at DESC LIMIT 100").bind(lineUserId).all<MockExamRecord>(); return result.results ?? []; }
export async function saveMockExam(record: MockExamRecord) { await ensureMockExamSchema(); await getD1().prepare("INSERT INTO member_mock_exams (id,line_user_id,name,exam_date,subjects_json,essay,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, exam_date=excluded.exam_date, subjects_json=excluded.subjects_json, essay=excluded.essay, updated_at=excluded.updated_at").bind(record.id, record.line_user_id, record.name, record.exam_date, record.subjects_json, record.essay, record.created_at, record.updated_at).run(); }
export async function deleteMockExam(lineUserId: string, id: string) { await ensureMockExamSchema(); await getD1().prepare("DELETE FROM member_mock_exams WHERE line_user_id = ? AND id = ?").bind(lineUserId, id).run(); }
