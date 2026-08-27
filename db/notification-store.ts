import { ensureAdminSchema, getD1, listLineUsers } from "./admin-store";

export const NOTIFICATION_EVENT_KEYS = [
  "planner_finalized",
  "score_calculated",
  "important_date",
] as const;

export type NotificationEventKey = (typeof NOTIFICATION_EVENT_KEYS)[number];
export type NotificationPreferenceKey = `${NotificationEventKey}_enabled` | "weekly_report_enabled";

export type NotificationSetting = {
  event_key: NotificationEventKey;
  enabled: number;
  title: string;
  body_template: string;
  updated_by: string;
  updated_at: string;
};

export type MemberNotificationPreferences = {
  line_user_id: string;
  planner_finalized_enabled: number;
  score_calculated_enabled: number;
  important_date_enabled: number;
  weekly_report_enabled: number;
  updated_at: string;
};

export type ImportantDate = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  send_at: string;
  enabled: number;
  sent_at: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_NOTIFICATION_SETTINGS: Readonly<Record<NotificationEventKey, Omit<NotificationSetting, "event_key" | "updated_by" | "updated_at">>> = {
  planner_finalized: {
    enabled: 1,
    title: "志願規劃已完成",
    body_template: "你已完成志願規劃，共 {count} 個校科。請回到 JSHS 檢查志願順序與官方簡章。",
  },
  score_calculated: {
    enabled: 1,
    title: "成績試算完成",
    body_template: "你的 {district} {academicYear} 學年度積分試算已完成，總分 {score}。請以官方簡章為準。",
  },
  important_date: {
    enabled: 1,
    title: "重要升學日期提醒",
    body_template: "{title}\n{description}\n日期：{eventDate}",
  },
};

export const MAX_TEMPLATE_LENGTH = 1000;

const DEFAULT_IMPORTANT_DATES = [
  { id: "system-exam-2027", title: "國中教育會考", description: "確認准考證、應試用品與交通安排；正式日期以當年度官方公告為準。", eventDate: "2027-05-15", sendAt: "2027-05-14T01:00:00.000Z" },
  { id: "system-admission-2027", title: "確認免試入學簡章", description: "核對志願選填、報名與放榜時程；請以各就學區公告為準。", eventDate: "2027-06-01", sendAt: "2027-05-31T01:00:00.000Z" },
] as const;

export async function ensureNotificationSchema() {
  await ensureAdminSchema();
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS notification_settings (
      event_key TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      body_template TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS member_notification_preferences (
      line_user_id TEXT PRIMARY KEY,
      planner_finalized_enabled INTEGER NOT NULL DEFAULT 0,
      score_calculated_enabled INTEGER NOT NULL DEFAULT 0,
      important_date_enabled INTEGER NOT NULL DEFAULT 0,
      weekly_report_enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS important_dates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      event_date TEXT NOT NULL,
      send_at TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      sent_at TEXT,
      created_by TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_important_dates_dispatch
      ON important_dates(enabled, send_at, sent_at)`),
  ]);
  const preferenceColumns = await db.prepare("PRAGMA table_info(member_notification_preferences)").all<{ name: string }>();
  if (!(preferenceColumns.results ?? []).some((column) => column.name === "weekly_report_enabled")) {
    await db.prepare("ALTER TABLE member_notification_preferences ADD COLUMN weekly_report_enabled INTEGER NOT NULL DEFAULT 0").run();
  }

  const now = new Date().toISOString();
  await db.batch(NOTIFICATION_EVENT_KEYS.map((eventKey) => {
    const setting = DEFAULT_NOTIFICATION_SETTINGS[eventKey];
    return db.prepare(`INSERT OR IGNORE INTO notification_settings
      (event_key, enabled, title, body_template, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(eventKey, setting.enabled, setting.title, setting.body_template, "system", now);
  }));
  await db.batch(DEFAULT_IMPORTANT_DATES.map((item) => db.prepare(`INSERT OR IGNORE INTO important_dates
    (id, title, description, event_date, send_at, enabled, sent_at, created_by, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, NULL, 'system', 'system', ?, ?)`)
    .bind(item.id, item.title, item.description, item.eventDate, item.sendAt, now, now)));
}

export async function listNotificationSettings() {
  await ensureNotificationSchema();
  const result = await getD1().prepare(`SELECT * FROM notification_settings ORDER BY event_key`).all<NotificationSetting>();
  return result.results ?? [];
}

export async function getNotificationSetting(eventKey: NotificationEventKey) {
  await ensureNotificationSchema();
  return getD1().prepare(`SELECT * FROM notification_settings WHERE event_key = ? LIMIT 1`)
    .bind(eventKey).first<NotificationSetting>();
}

export async function upsertNotificationSetting(input: {
  eventKey: NotificationEventKey;
  enabled: boolean;
  title: string;
  bodyTemplate: string;
  updatedBy: string;
}) {
  await ensureNotificationSchema();
  const now = new Date().toISOString();
  await getD1().prepare(`INSERT INTO notification_settings
    (event_key, enabled, title, body_template, updated_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(event_key) DO UPDATE SET
      enabled = excluded.enabled,
      title = excluded.title,
      body_template = excluded.body_template,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at`)
    .bind(input.eventKey, input.enabled ? 1 : 0, input.title, input.bodyTemplate, input.updatedBy, now)
    .run();
}

export async function getMemberNotificationPreferences(lineUserId: string): Promise<MemberNotificationPreferences> {
  await ensureNotificationSchema();
  const preferences = await getD1().prepare(`SELECT * FROM member_notification_preferences
    WHERE line_user_id = ? LIMIT 1`).bind(lineUserId).first<MemberNotificationPreferences>();
  return preferences ?? {
    line_user_id: lineUserId,
    planner_finalized_enabled: 0,
    score_calculated_enabled: 0,
    important_date_enabled: 0,
    weekly_report_enabled: 0,
    updated_at: "",
  };
}

export async function updateMemberNotificationPreferences(
  lineUserId: string,
  patch: Partial<Record<NotificationPreferenceKey, boolean>>,
) {
  const current = await getMemberNotificationPreferences(lineUserId);
  const next = {
    planner_finalized_enabled: patch.planner_finalized_enabled ?? Boolean(current.planner_finalized_enabled),
    score_calculated_enabled: patch.score_calculated_enabled ?? Boolean(current.score_calculated_enabled),
    important_date_enabled: patch.important_date_enabled ?? Boolean(current.important_date_enabled),
    weekly_report_enabled: patch.weekly_report_enabled ?? Boolean(current.weekly_report_enabled),
  };
  await getD1().prepare(`INSERT INTO member_notification_preferences
    (line_user_id, planner_finalized_enabled, score_calculated_enabled, important_date_enabled, weekly_report_enabled, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(line_user_id) DO UPDATE SET
      planner_finalized_enabled = excluded.planner_finalized_enabled,
      score_calculated_enabled = excluded.score_calculated_enabled,
      important_date_enabled = excluded.important_date_enabled,
      weekly_report_enabled = excluded.weekly_report_enabled,
      updated_at = excluded.updated_at`)
    .bind(lineUserId, next.planner_finalized_enabled ? 1 : 0, next.score_calculated_enabled ? 1 : 0,
      next.important_date_enabled ? 1 : 0, next.weekly_report_enabled ? 1 : 0, new Date().toISOString()).run();
  return getMemberNotificationPreferences(lineUserId);
}

export async function isMemberNotificationEnabled(lineUserId: string, eventKey: NotificationEventKey) {
  const preferences = await getMemberNotificationPreferences(lineUserId);
  return Boolean(preferences[`${eventKey}_enabled`]);
}

export async function listOptedInLineUserIds(eventKey: NotificationEventKey) {
  await ensureNotificationSchema();
  const preferenceColumn = `${eventKey}_enabled`;
  const users = await listLineUsers();
  const optedIn = await getD1().prepare(`SELECT line_user_id FROM member_notification_preferences
    WHERE ${preferenceColumn} = 1`).all<{ line_user_id: string }>();
  const optedInIds = new Set((optedIn.results ?? []).map((item) => item.line_user_id));
  return users.filter((user) => user.status !== "blocked" && optedInIds.has(user.line_user_id)).map((user) => user.line_user_id);
}

export async function listWeeklyReportLineUserIds() {
  await ensureNotificationSchema();
  const result = await getD1().prepare(`SELECT line_user_id FROM member_notification_preferences WHERE weekly_report_enabled = 1`).all<{ line_user_id: string }>();
  return (result.results ?? []).map((item) => item.line_user_id);
}

export async function listImportantDates(includeDisabled = false) {
  await ensureNotificationSchema();
  const query = includeDisabled
    ? `SELECT * FROM important_dates ORDER BY event_date ASC, send_at ASC`
    : `SELECT * FROM important_dates WHERE enabled = 1 ORDER BY event_date ASC, send_at ASC`;
  const result = await getD1().prepare(query).all<ImportantDate>();
  return result.results ?? [];
}

export async function createImportantDate(input: {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  sendAt: string;
  enabled: boolean;
  updatedBy: string;
}) {
  await ensureNotificationSchema();
  const now = new Date().toISOString();
  await getD1().prepare(`INSERT INTO important_dates
    (id, title, description, event_date, send_at, enabled, sent_at, created_by, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`)
    .bind(input.id, input.title, input.description, input.eventDate, input.sendAt, input.enabled ? 1 : 0,
      input.updatedBy, input.updatedBy, now, now).run();
}

export async function updateImportantDate(input: {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  sendAt: string;
  enabled: boolean;
  updatedBy: string;
}) {
  await ensureNotificationSchema();
  await getD1().prepare(`UPDATE important_dates SET
    title = ?, description = ?, event_date = ?, send_at = ?, enabled = ?,
    sent_at = NULL, updated_by = ?, updated_at = ? WHERE id = ?`)
    .bind(input.title, input.description, input.eventDate, input.sendAt, input.enabled ? 1 : 0,
      input.updatedBy, new Date().toISOString(), input.id).run();
}

export async function deleteImportantDate(id: string) {
  await ensureNotificationSchema();
  await getD1().prepare(`DELETE FROM important_dates WHERE id = ?`).bind(id).run();
}

export async function listDueImportantDates(now = new Date().toISOString()) {
  await ensureNotificationSchema();
  const result = await getD1().prepare(`SELECT * FROM important_dates
    WHERE enabled = 1 AND sent_at IS NULL AND send_at <= ? ORDER BY send_at ASC LIMIT 50`)
    .bind(now).all<ImportantDate>();
  return result.results ?? [];
}

export async function markImportantDateSent(id: string, sentAt = new Date().toISOString()) {
  await ensureNotificationSchema();
  await getD1().prepare(`UPDATE important_dates SET sent_at = ?, updated_at = ?
    WHERE id = ? AND sent_at IS NULL`).bind(sentAt, sentAt, id).run();
}
