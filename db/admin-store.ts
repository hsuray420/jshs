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

export type SiteSetting = {
  key: string;
  value: string;
  updated_by: string;
  updated_at: string;
};

export function getD1() {
  if (!env.DB) throw new Error("D1 binding DB is not available.");
  return env.DB;
}

export function getR2() {
  if (!env.FILES) throw new Error("R2 binding FILES is not available.");
  return env.FILES;
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
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_admin_files_created_at
      ON admin_files(created_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_admin_files_visibility
      ON admin_files(visibility)`),
  ]);
}

export async function listAdminFiles() {
  await ensureAdminSchema();
  const result = await getD1()
    .prepare(`SELECT * FROM admin_files ORDER BY created_at DESC LIMIT 100`)
    .all<AdminFile>();
  return result.results ?? [];
}

export async function getAdminFile(id: string) {
  await ensureAdminSchema();
  return getD1()
    .prepare(`SELECT * FROM admin_files WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<AdminFile>();
}

export async function createAdminFile(input: AdminFile) {
  await ensureAdminSchema();
  await getD1()
    .prepare(`INSERT INTO admin_files (
      id, object_key, file_name, content_type, size, category, visibility,
      description, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
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
    )
    .run();
}

export async function deleteAdminFile(id: string) {
  await ensureAdminSchema();
  const file = await getAdminFile(id);
  if (!file) return false;
  await getR2().delete(file.object_key);
  await getD1().prepare(`DELETE FROM admin_files WHERE id = ?`).bind(id).run();
  return true;
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
