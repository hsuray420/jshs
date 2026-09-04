import { getD1 } from "./admin-store";

export type DataReportStatus = "pending" | "accepted" | "fixed" | "rejected";
export type DataReport = Readonly<{
  id: string;
  page_url: string;
  category: string;
  dataset: string;
  academic_year: string;
  field: string;
  current_value: string;
  suggested_value: string;
  source_url: string;
  note: string;
  contact: string;
  status: DataReportStatus;
  review_note: string;
  created_at: string;
  updated_at: string;
}>;

export async function ensureDataReportSchema() {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS data_reports (
      id TEXT PRIMARY KEY,
      page_url TEXT NOT NULL,
      category TEXT NOT NULL,
      dataset TEXT NOT NULL DEFAULT '',
      academic_year TEXT NOT NULL DEFAULT '',
      field TEXT NOT NULL DEFAULT '',
      current_value TEXT NOT NULL DEFAULT '',
      suggested_value TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      contact TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      review_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_data_reports_status_created
      ON data_reports(status, created_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS data_report_rate_limits (
      fingerprint TEXT PRIMARY KEY,
      window_started_at INTEGER NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0
    )`),
  ]);
}

export async function consumeDataReportRateLimit(fingerprint: string, limit = 5, windowMs = 15 * 60 * 1000) {
  await ensureDataReportSchema();
  const now = Date.now();
  const db = getD1();
  const current = await db.prepare(`SELECT window_started_at, request_count
    FROM data_report_rate_limits WHERE fingerprint = ? LIMIT 1`).bind(fingerprint).first<{ window_started_at: number; request_count: number }>();
  if (current && now - current.window_started_at < windowMs && current.request_count >= limit) return false;
  const nextWindow = current && now - current.window_started_at < windowMs ? current.window_started_at : now;
  const nextCount = current && nextWindow === current.window_started_at ? current.request_count + 1 : 1;
  await db.prepare(`INSERT INTO data_report_rate_limits (fingerprint, window_started_at, request_count)
    VALUES (?, ?, ?)
    ON CONFLICT(fingerprint) DO UPDATE SET
      window_started_at = excluded.window_started_at,
      request_count = excluded.request_count`).bind(fingerprint, nextWindow, nextCount).run();
  return true;
}

export async function createDataReport(input: Omit<DataReport, "updated_at">) {
  await ensureDataReportSchema();
  await getD1().prepare(`INSERT INTO data_reports (
    id, page_url, category, dataset, academic_year, field, current_value,
    suggested_value, source_url, note, contact, status, review_note, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    input.id, input.page_url, input.category, input.dataset, input.academic_year, input.field,
    input.current_value, input.suggested_value, input.source_url, input.note, input.contact,
    input.status, input.review_note, input.created_at, input.created_at,
  ).run();
}

export async function listPendingDataReports(limit = 100) {
  await ensureDataReportSchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const result = await getD1().prepare(`SELECT id, page_url, category, dataset, academic_year, field,
    current_value, suggested_value, source_url, note, contact, status, review_note, created_at, updated_at
    FROM data_reports WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`).bind(safeLimit).all<DataReport>();
  return result.results ?? [];
}

export async function countPendingDataReports() {
  await ensureDataReportSchema();
  const result = await getD1().prepare("SELECT COUNT(*) AS count FROM data_reports WHERE status = 'pending'").first<{ count: number }>();
  return Number(result?.count || 0);
}

export async function moderateDataReport(id: string, status: Exclude<DataReportStatus, "pending">, reviewNote = "") {
  await ensureDataReportSchema();
  const result = await getD1().prepare(`UPDATE data_reports
    SET status = ?, review_note = ?, updated_at = ?
    WHERE id = ? AND status = 'pending'`).bind(status, reviewNote.slice(0, 500), new Date().toISOString(), id).run();
  return (result.meta.changes ?? 0) > 0;
}
