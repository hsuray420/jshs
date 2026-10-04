import { getCommunityDatabase, getLegacyDatabase } from "./bindings";

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

export type AdminFileWithBlob = AdminFile & {
  file_blob?: ArrayBuffer | ArrayBufferView;
  file_blob_hex?: string;
};

export function fileBlobToBytes(blob: unknown) {
  if (!blob) return null;
  if (typeof blob === "string") {
    if (!/^(?:[0-9a-f]{2})*$/i.test(blob)) return null;
    const bytes = new Uint8Array(blob.length / 2);
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Number.parseInt(blob.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes.buffer;
  }
  const value = blob as { buffer?: ArrayBufferLike; byteOffset?: number; byteLength?: number };
  if (typeof value.byteLength !== "number" || value.byteLength <= 0) return null;
  if (value.buffer) {
    return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength).slice().buffer;
  }
  return new Uint8Array(blob as ArrayBuffer).slice().buffer;
}

export type SchoolMediaOverride = {
  school_code: string;
  file_id: string;
  storage_provider: "d1" | "imagekit";
  image_url: string;
  thumbnail_url: string;
  source: "jshs-owned" | "official-school-site" | "licensed-public" | "admin-provided";
  source_url: string;
  license: string;
  credit: string;
  alt: string;
  updated_by: string;
  updated_at: string;
};

export type DeploymentEvent = {
  id: string;
  file_id: string;
  action: "validate" | "test" | "deploy" | "rollback";
  status: "pending" | "requested" | "success" | "failed";
  note: string;
  created_by: string;
  created_at: string;
};

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

export type SchoolDataDraft = {
  id: string;
  school_code: string;
  school_name: string;
  region_code: string;
  source_file: string;
  base_sha: string;
  base_values_json: string;
  updates_json: string;
  status: "draft" | "published" | "conflict";
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export type SchoolDataAudit = {
  id: string;
  occurred_at: string;
  admin_id: string;
  admin_name: string;
  action: "draft" | "preview" | "publish" | "rollback";
  status: "success" | "failed" | "conflict";
  school_code: string;
  school_name: string;
  region_code: string;
  source_file: string;
  field: string;
  old_value: string;
  new_value: string;
  commit_sha: string;
  error_message: string;
};

export function getD1() {
  return getLegacyDatabase();
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
    db.prepare(`CREATE TABLE IF NOT EXISTS school_media_overrides (
      school_code TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      storage_provider TEXT NOT NULL DEFAULT 'd1',
      image_url TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      license TEXT NOT NULL DEFAULT '',
      credit TEXT NOT NULL DEFAULT '',
      alt TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_school_media_overrides_updated_at
      ON school_media_overrides(updated_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS deployment_events (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_deployment_events_created_at
      ON deployment_events(created_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS school_data_drafts (
      id TEXT PRIMARY KEY,
      school_code TEXT NOT NULL,
      school_name TEXT NOT NULL,
      region_code TEXT NOT NULL,
      source_file TEXT NOT NULL,
      base_sha TEXT NOT NULL DEFAULT '',
      base_values_json TEXT NOT NULL,
      updates_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_by TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(school_code, region_code, created_by)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_school_data_drafts_status
      ON school_data_drafts(status, updated_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS school_data_audit (
      id TEXT PRIMARY KEY,
      occurred_at TEXT NOT NULL,
      admin_id TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      school_code TEXT NOT NULL,
      school_name TEXT NOT NULL,
      region_code TEXT NOT NULL,
      source_file TEXT NOT NULL,
      field TEXT NOT NULL DEFAULT '',
      old_value TEXT NOT NULL DEFAULT '',
      new_value TEXT NOT NULL DEFAULT '',
      commit_sha TEXT NOT NULL DEFAULT '',
      error_message TEXT NOT NULL DEFAULT ''
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_school_data_audit_lookup
      ON school_data_audit(school_code, occurred_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_rate_limits (
      key TEXT PRIMARY KEY,
      window_started_at INTEGER NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS external_media_cleanup (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      file_id TEXT NOT NULL,
      last_error TEXT NOT NULL DEFAULT '',
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(provider, file_id)
    )`),
  ]);
  const columns = await db.prepare(`PRAGMA table_info(admin_files)`).all<{ name: string }>();
  if (!(columns.results ?? []).some((column) => column.name === "file_blob")) {
    await db.prepare(`ALTER TABLE admin_files ADD COLUMN file_blob BLOB`).run();
  }
  const mediaColumns = await db.prepare(`PRAGMA table_info(school_media_overrides)`).all<{ name: string }>();
  const mediaNames = new Set((mediaColumns.results ?? []).map((column) => column.name));
  if (!mediaNames.has("storage_provider")) await db.prepare(`ALTER TABLE school_media_overrides ADD COLUMN storage_provider TEXT NOT NULL DEFAULT 'd1'`).run();
  if (!mediaNames.has("image_url")) await db.prepare(`ALTER TABLE school_media_overrides ADD COLUMN image_url TEXT NOT NULL DEFAULT ''`).run();
  if (!mediaNames.has("thumbnail_url")) await db.prepare(`ALTER TABLE school_media_overrides ADD COLUMN thumbnail_url TEXT NOT NULL DEFAULT ''`).run();
}

export async function consumeAdminRateLimit(input: { key: string; limit: number; windowSeconds: number }) {
  await ensureAdminSchema();
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - input.windowSeconds;
  const row = await getD1().prepare(`INSERT INTO admin_rate_limits (key, window_started_at, request_count)
    VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      window_started_at = CASE WHEN window_started_at <= ? THEN excluded.window_started_at ELSE window_started_at END,
      request_count = CASE WHEN window_started_at <= ? THEN 1 ELSE request_count + 1 END
    RETURNING window_started_at, request_count`)
    .bind(input.key, now, cutoff, cutoff).first<{ window_started_at: number; request_count: number }>();
  const count = Number(row?.request_count || 1);
  return { allowed: count <= input.limit, count, retryAfterSeconds: Math.max(1, Number(row?.window_started_at || now) + input.windowSeconds - now) };
}

export async function getSchoolDataDraft(schoolCode: string, regionCode: string, adminId: string) {
  const db = await getCommunityAdminDatabase();
  return db.prepare(`SELECT * FROM school_data_drafts
    WHERE school_code = ? AND region_code = ? AND created_by = ? AND status = 'draft' LIMIT 1`)
    .bind(schoolCode, regionCode, adminId).first<SchoolDataDraft>();
}

export async function upsertSchoolDataDraft(input: Omit<SchoolDataDraft, "id" | "status" | "created_at" | "updated_at">) {
  const db = await getCommunityAdminDatabase();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.prepare(`INSERT INTO school_data_drafts (
    id, school_code, school_name, region_code, source_file, base_sha, base_values_json,
    updates_json, status, created_by, updated_by, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)
  ON CONFLICT(school_code, region_code, created_by) DO UPDATE SET
    school_name = excluded.school_name,
    source_file = excluded.source_file,
    base_sha = excluded.base_sha,
    base_values_json = excluded.base_values_json,
    updates_json = excluded.updates_json,
    status = 'draft',
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at`)
    .bind(id, input.school_code, input.school_name, input.region_code, input.source_file,
      input.base_sha, input.base_values_json, input.updates_json, input.created_by,
      input.updated_by, now, now).run();
  return getSchoolDataDraft(input.school_code, input.region_code, input.created_by);
}

export async function markSchoolDataDraftPublished(schoolCode: string, regionCode: string, adminId: string) {
  const db = await getCommunityAdminDatabase();
  await db.prepare(`UPDATE school_data_drafts SET status = 'published', updated_at = ?
    WHERE school_code = ? AND region_code = ? AND created_by = ? AND status = 'draft'`)
    .bind(new Date().toISOString(), schoolCode, regionCode, adminId).run();
}

export async function countPendingSchoolDataDrafts() {
  const db = await getCommunityAdminDatabase();
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM school_data_drafts WHERE status = 'draft'`).first<{ count: number }>();
  return Number(row?.count || 0);
}

export async function createSchoolDataAuditEntries(entries: Array<Omit<SchoolDataAudit, "id" | "occurred_at">>) {
  if (!entries.length) return;
  const db = await getCommunityAdminDatabase();
  const occurredAt = new Date().toISOString();
  await db.batch(entries.map((entry) => db.prepare(`INSERT INTO school_data_audit (
    id, occurred_at, admin_id, admin_name, action, status, school_code, school_name,
    region_code, source_file, field, old_value, new_value, commit_sha, error_message
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), occurredAt, entry.admin_id, entry.admin_name, entry.action,
      entry.status, entry.school_code, entry.school_name, entry.region_code, entry.source_file,
      entry.field, entry.old_value, entry.new_value, entry.commit_sha, entry.error_message)));
}

export async function listSchoolDataAudit(filters: { query?: string; admin?: string; field?: string; date?: string } = {}) {
  const db = await getCommunityAdminDatabase();
  const query = `%${filters.query || ""}%`;
  const admin = `%${filters.admin || ""}%`;
  const field = `%${filters.field || ""}%`;
  const date = `${filters.date || ""}%`;
  const result = await db.prepare(`SELECT * FROM school_data_audit
    WHERE (school_name LIKE ? OR school_code LIKE ? OR commit_sha LIKE ?)
      AND (admin_name LIKE ? OR admin_id LIKE ?)
      AND field LIKE ? AND occurred_at LIKE ?
    ORDER BY occurred_at DESC LIMIT 300`)
    .bind(query, query, query, admin, admin, field, date).all<SchoolDataAudit>();
  return result.results ?? [];
}

async function getCommunityAdminDatabase() {
  const connection = getCommunityDatabase();
  if (connection.mode === "legacy") await ensureAdminSchema();
  return connection.db;
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

export async function listDeploymentFiles() {
  await ensureAdminSchema();
  const result = await getD1()
    .prepare(`SELECT id, object_key, file_name, content_type, size, category,
      visibility, description, uploaded_by, created_at
      FROM admin_files WHERE category = 'code-deploy' ORDER BY created_at DESC LIMIT 50`)
    .all<AdminFile>();
  return result.results ?? [];
}

export async function listDeploymentEvents() {
  await ensureAdminSchema();
  const result = await getD1()
    .prepare(`SELECT id, file_id, action, status, note, created_by, created_at
      FROM deployment_events ORDER BY created_at DESC LIMIT 100`)
    .all<DeploymentEvent>();
  return result.results ?? [];
}

export async function createDeploymentEvent(input: Omit<DeploymentEvent, "created_at">) {
  await ensureAdminSchema();
  await getD1().prepare(`INSERT INTO deployment_events
    (id, file_id, action, status, note, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(input.id, input.file_id, input.action, input.status, input.note, input.created_by, new Date().toISOString())
    .run();
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
    category, visibility, description, uploaded_by, created_at, hex(file_blob) AS file_blob_hex
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

export async function listSchoolMediaOverrides() {
  await ensureAdminSchema();
  const result = await getD1()
    .prepare(`SELECT school_code, file_id, storage_provider, image_url, thumbnail_url, source, source_url, license, credit, alt,
      updated_by, updated_at FROM school_media_overrides ORDER BY updated_at DESC`)
    .all<SchoolMediaOverride>();
  return result.results ?? [];
}

export async function getSchoolMediaOverride(schoolCode: string) {
  await ensureAdminSchema();
  return getD1()
    .prepare(`SELECT school_code, file_id, storage_provider, image_url, thumbnail_url, source, source_url, license, credit, alt,
      updated_by, updated_at FROM school_media_overrides WHERE school_code = ? LIMIT 1`)
    .bind(schoolCode)
    .first<SchoolMediaOverride>();
}

export async function upsertSchoolMediaOverride(input: SchoolMediaOverride) {
  await ensureAdminSchema();
  await getD1().prepare(`INSERT INTO school_media_overrides (
    school_code, file_id, storage_provider, image_url, thumbnail_url, source, source_url, license, credit, alt, updated_by, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(school_code) DO UPDATE SET
    file_id = excluded.file_id,
    storage_provider = excluded.storage_provider,
    image_url = excluded.image_url,
    thumbnail_url = excluded.thumbnail_url,
    source = excluded.source,
    source_url = excluded.source_url,
    license = excluded.license,
    credit = excluded.credit,
    alt = excluded.alt,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at`)
    .bind(
      input.school_code, input.file_id, input.storage_provider, input.image_url, input.thumbnail_url,
      input.source, input.source_url, input.license, input.credit, input.alt, input.updated_by, input.updated_at,
    )
    .run();
}

export async function deleteSchoolMediaOverride(schoolCode: string) {
  await ensureAdminSchema();
  const result = await getD1()
    .prepare(`DELETE FROM school_media_overrides WHERE school_code = ?`)
    .bind(schoolCode)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function enqueueExternalMediaCleanup(input: { provider: "imagekit"; fileId: string; error: string }) {
  await ensureAdminSchema();
  const now = new Date().toISOString();
  await getD1().prepare(`INSERT INTO external_media_cleanup (id, provider, file_id, last_error, attempts, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(provider, file_id) DO UPDATE SET last_error = excluded.last_error, attempts = attempts + 1, updated_at = excluded.updated_at`)
    .bind(crypto.randomUUID(), input.provider, input.fileId, input.error.slice(0, 200), now, now).run();
}

export async function listExternalMediaCleanup(limit = 20) {
  await ensureAdminSchema();
  const result = await getD1().prepare(`SELECT id, provider, file_id, last_error, attempts, created_at, updated_at
    FROM external_media_cleanup ORDER BY updated_at ASC LIMIT ?`).bind(Math.max(1, Math.min(limit, 100))).all<{
      id: string; provider: "imagekit"; file_id: string; last_error: string; attempts: number; created_at: string; updated_at: string;
    }>();
  return result.results ?? [];
}

export async function resolveExternalMediaCleanup(id: string) {
  await ensureAdminSchema();
  await getD1().prepare(`DELETE FROM external_media_cleanup WHERE id = ?`).bind(id).run();
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
  "donation_url",
]);

export async function listPublicSiteSettings() {
  const settings = await listSiteSettings();
  return settings.filter((item) => PUBLIC_SETTING_KEYS.has(item.key));
}
