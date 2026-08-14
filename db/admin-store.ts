import { env } from "cloudflare:workers";

export type AdminFile = {
  id: string;
  object_key: string;
  file_name: string;
  content_type: string;
  size: number;
  category: string;
  visibility: "public" | "private";
  description: string;
  uploaded_by: string;
  created_at: string;
};

export type AdminFileWithBlob = AdminFile & { file_blob: ArrayBuffer };

export type SiteSetting = {
  key: string;
  value: string;
  updated_by: string;
  updated_at: string;
};

export type LineUser = {
  line_user_id: string;
  display_name: string;
  picture_url: string;
  status: "friend" | "blocked" | "seen";
  first_seen_at: string;
  last_seen_at: string;
};

export function getD1() {
  if (!env.DB) throw new Error("D1 binding DB is not available.");
  return env.DB;
}

export async function ensureAdminSchema() {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_files (
      id TEXT PRIMARY KEY,
      object_key TEXT NOT NULL UNIQUE,
      file_name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      visibility TEXT NOT NULL DEFAULT 'public',
      description TEXT NOT NULL DEFAULT '',
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      file_blob BLOB
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS line_users (
      line_user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      picture_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'seen',
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_admin_files_created_at
      ON admin_files(created_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_admin_files_visibility
      ON admin_files(visibility)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_line_users_last_seen_at
      ON line_users(last_seen_at)`),
  ]);
  const columns = await db.prepare(`PRAGMA table_info(admin_files)`).all<{ name: string }>();
  if (!(columns.results ?? []).some((column) => column.name === "file_blob")) {
    await db.prepare(`ALTER TABLE admin_files ADD COLUMN file_blob BLOB`).run();
  }
}

export async function listAdminFiles() {
  await ensureAdminSchema();
  const result = await getD1()
    .prepare(`SELECT id, object_key, file_name, content_type, size, category,
      visibility, description, uploaded_by, created_at
      FROM admin_files ORDER BY created_at DESC LIMIT 100`)
    .all<AdminFile>();
  return result.results ?? [];
}

export async function getAdminFile(id: string) {
  await ensureAdminSchema();
  return getD1()
    .prepare(`SELECT id, object_key, file_name, content_type, size, category,
      visibility, description, uploaded_by, created_at
      FROM admin_files WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<AdminFile>();
}

export async function getAdminFileBlob(id: string) {
  await ensureAdminSchema();
  return getD1().prepare(`SELECT id, object_key, file_name, content_type, size,
    category, visibility, description, uploaded_by, created_at, file_blob
    FROM admin_files WHERE id = ? LIMIT 1`).bind(id).first<AdminFileWithBlob>();
}

export async function createAdminFile(input: AdminFileWithBlob) {
  await ensureAdminSchema();
  await getD1()
    .prepare(`INSERT INTO admin_files (
      id, object_key, file_name, content_type, size, category, visibility,
      description, uploaded_by, created_at, file_blob
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      input.id,
      input.object_key,
      input.file_name,
      input.content_type,
      input.size,
      input.category,
      input.visibility,
      input.description,
      input.uploaded_by,
      input.created_at,
      input.file_blob,
    )
    .run();
}

export async function deleteAdminFile(id: string) {
  await ensureAdminSchema();
  const result = await getD1().prepare(`DELETE FROM admin_files WHERE id = ?`).bind(id).run();
  return (result.meta.changes ?? 0) > 0;
}

export async function listSiteSettings() {
  await ensureAdminSchema();
  const result = await getD1()
    .prepare(`SELECT * FROM site_settings ORDER BY key ASC`)
    .all<SiteSetting>();
  return result.results ?? [];
}

export async function getSiteSetting(key: string) {
  await ensureAdminSchema();
  return getD1()
    .prepare(`SELECT * FROM site_settings WHERE key = ? LIMIT 1`)
    .bind(key)
    .first<SiteSetting>();
}

export async function upsertSiteSetting(
  key: string,
  value: string,
  updatedBy: string,
) {
  await ensureAdminSchema();
  await getD1()
    .prepare(`INSERT INTO site_settings (key, value, updated_by, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at`)
    .bind(key, value, updatedBy, new Date().toISOString())
    .run();
}

export async function listLineUsers() {
  await ensureAdminSchema();
  const result = await getD1()
    .prepare(`SELECT * FROM line_users ORDER BY last_seen_at DESC LIMIT 200`)
    .all<LineUser>();
  return result.results ?? [];
}

export async function upsertLineUser(input: {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  status?: LineUser["status"];
}) {
  await ensureAdminSchema();
  const now = new Date().toISOString();
  await getD1()
    .prepare(`INSERT INTO line_users (
      line_user_id, display_name, picture_url, status, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(line_user_id) DO UPDATE SET
        display_name = CASE
          WHEN excluded.display_name != '' THEN excluded.display_name
          ELSE line_users.display_name
        END,
        picture_url = CASE
          WHEN excluded.picture_url != '' THEN excluded.picture_url
          ELSE line_users.picture_url
        END,
        status = excluded.status,
        last_seen_at = excluded.last_seen_at`)
    .bind(
      input.lineUserId,
      input.displayName || "",
      input.pictureUrl || "",
      input.status || "seen",
      now,
      now,
    )
    .run();
}

export function parseCsvIds(value?: string | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeCsvIds(ids: string[]) {
  return Array.from(new Set(ids.map((item) => item.trim()).filter(Boolean))).join(",");
}

export async function listExtraAdminLineUserIds() {
  const setting = await getSiteSetting("admin_line_user_ids_extra");
  return parseCsvIds(setting?.value);
}

export async function addExtraAdminLineUserId(lineUserId: string, updatedBy: string) {
  const current = await listExtraAdminLineUserIds();
  if (!current.includes(lineUserId)) current.push(lineUserId);
  await upsertSiteSetting("admin_line_user_ids_extra", serializeCsvIds(current), updatedBy);
}

export async function removeExtraAdminLineUserId(lineUserId: string, updatedBy: string) {
  const next = (await listExtraAdminLineUserIds()).filter((id) => id !== lineUserId);
  await upsertSiteSetting("admin_line_user_ids_extra", serializeCsvIds(next), updatedBy);
}

export const PUBLIC_SETTING_KEYS = new Set([
  "official_line_url",
]);

export async function listPublicSiteSettings() {
  const settings = await listSiteSettings();
  return settings.filter((item) => PUBLIC_SETTING_KEYS.has(item.key));
}
