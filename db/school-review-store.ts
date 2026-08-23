import { getD1 } from "./admin-store";

export type SchoolReview = Readonly<{
  id: string;
  district: string;
  school_code: string;
  school_name: string;
  nickname: string;
  graduation_year: string;
  admission_score: string;
  content: string;
  status: "published" | "hidden";
  created_at: string;
}>;

export async function ensureSchoolReviewSchema() {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS school_reviews (
      id TEXT PRIMARY KEY,
      district TEXT NOT NULL,
      school_code TEXT NOT NULL,
      school_name TEXT NOT NULL,
      nickname TEXT NOT NULL DEFAULT '匿名學長姐',
      graduation_year TEXT NOT NULL DEFAULT '',
      admission_score TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_school_reviews_school_created
      ON school_reviews(district, school_code, status, created_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS school_review_rate_limits (
      fingerprint TEXT PRIMARY KEY,
      window_started_at INTEGER NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0
    )`),
  ]);
  const columns = await db.prepare("PRAGMA table_info(school_reviews)").all<{ name: string }>();
  if (!(columns.results ?? []).some((column) => column.name === "admission_score")) {
    await db.prepare("ALTER TABLE school_reviews ADD COLUMN admission_score TEXT NOT NULL DEFAULT ''").run();
  }
}

export async function consumeSchoolReviewRateLimit(fingerprint: string, limit = 5, windowMs = 15 * 60 * 1000) {
  await ensureSchoolReviewSchema();
  const now = Date.now();
  const current = await getD1().prepare(`SELECT window_started_at, request_count
    FROM school_review_rate_limits WHERE fingerprint = ? LIMIT 1`).bind(fingerprint).first<{ window_started_at: number; request_count: number }>();
  if (current && now - current.window_started_at < windowMs && current.request_count >= limit) return false;
  const nextWindow = current && now - current.window_started_at < windowMs ? current.window_started_at : now;
  const nextCount = current && nextWindow === current.window_started_at ? current.request_count + 1 : 1;
  await getD1().prepare(`INSERT INTO school_review_rate_limits (fingerprint, window_started_at, request_count)
    VALUES (?, ?, ?)
    ON CONFLICT(fingerprint) DO UPDATE SET
      window_started_at = excluded.window_started_at,
      request_count = excluded.request_count`).bind(fingerprint, nextWindow, nextCount).run();
  return true;
}

export async function listSchoolReviews(district: string, schoolCode: string) {
  await ensureSchoolReviewSchema();
  const result = await getD1().prepare(`SELECT id, district, school_code, school_name,
    nickname, graduation_year, admission_score, content, status, created_at
    FROM school_reviews
    WHERE district = ? AND school_code = ? AND status = 'published'
    ORDER BY created_at DESC LIMIT 50`).bind(district, schoolCode).all<SchoolReview>();
  return result.results ?? [];
}

export async function listRecentSchoolReviews(limit = 100) {
  await ensureSchoolReviewSchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const result = await getD1().prepare(`SELECT id, district, school_code, school_name,
    nickname, graduation_year, admission_score, content, status, created_at
    FROM school_reviews
    WHERE status = 'published'
    ORDER BY created_at DESC LIMIT ?`).bind(safeLimit).all<SchoolReview>();
  return result.results ?? [];
}

export async function createSchoolReview(input: SchoolReview) {
  await ensureSchoolReviewSchema();
  await getD1().prepare(`INSERT INTO school_reviews (
    id, district, school_code, school_name, nickname, graduation_year,
    admission_score, content, status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    input.id,
    input.district,
    input.school_code,
    input.school_name,
    input.nickname,
    input.graduation_year,
    input.admission_score,
    input.content,
    input.status,
    input.created_at,
  ).run();
}
