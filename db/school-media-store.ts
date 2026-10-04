import { getCommunityDatabase } from "./bindings";

export type SchoolMediaMetadata = {
  school_code: string;
  file_id: string;
  storage_provider: "imagekit";
  image_url: string;
  thumbnail_url: string;
  source: "jshs-owned" | "official-school-site" | "licensed-public" | "admin-provided";
  source_url: string;
  license: string;
  credit: string;
  alt: string;
  updated_by: string;
  updated_at: string;
  sort_order: number;
  is_cover: boolean;
};

export type SchoolMediaDraft = Omit<SchoolMediaMetadata, "is_cover" | "sort_order"> & {
  id: string;
  created_by: string;
  created_at: string;
  status: "draft" | "published";
};

async function ensureSchema() {
  const db = getCommunityDatabase();
  await db.prepare(`CREATE TABLE IF NOT EXISTS school_media_metadata (
    school_code TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    storage_provider TEXT NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    alt TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL,
    source_url TEXT NOT NULL DEFAULT '',
    license TEXT NOT NULL,
    credit TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_cover INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
  const columns = await db.prepare("PRAGMA table_info(school_media_metadata)").all<{ name: string }>();
  const names = new Set((columns.results ?? []).map((column) => column.name));
  if (!names.has("sort_order")) await db.prepare("ALTER TABLE school_media_metadata ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0").run();
  if (!names.has("is_cover")) await db.prepare("ALTER TABLE school_media_metadata ADD COLUMN is_cover INTEGER NOT NULL DEFAULT 1").run();
  if (!names.has("source_url")) await db.prepare("ALTER TABLE school_media_metadata ADD COLUMN source_url TEXT NOT NULL DEFAULT ''").run();
  if (!names.has("credit")) await db.prepare("ALTER TABLE school_media_metadata ADD COLUMN credit TEXT NOT NULL DEFAULT ''").run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS school_media_drafts (
    id TEXT PRIMARY KEY,
    school_code TEXT NOT NULL,
    file_id TEXT NOT NULL,
    storage_provider TEXT NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL DEFAULT '',
    license TEXT NOT NULL,
    credit TEXT NOT NULL DEFAULT '',
    alt TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    UNIQUE(school_code, created_by)
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_school_media_drafts_status ON school_media_drafts(status, updated_at)").run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_school_media_drafts_one_pending_per_school ON school_media_drafts(school_code) WHERE status = 'draft'").run();
}

export async function listSchoolMediaMetadata(): Promise<SchoolMediaMetadata[]> {
  const db = getCommunityDatabase();
  await ensureSchema();
  const result = await db.prepare(`SELECT school_code, file_id, storage_provider, image_url, thumbnail_url,
    source, source_url, license, credit, alt, updated_by, updated_at, sort_order, is_cover
    FROM school_media_metadata ORDER BY sort_order, updated_at DESC`).all<Omit<SchoolMediaMetadata, "is_cover"> & { is_cover: number }>();
  return (result.results ?? []).map((row) => ({ ...row, is_cover: row.is_cover === 1 }));
}

export async function getSchoolMediaMetadata(schoolCode: string): Promise<SchoolMediaMetadata | null> {
  const db = getCommunityDatabase();
  await ensureSchema();
  const item = await db.prepare(`SELECT school_code, file_id, storage_provider, image_url, thumbnail_url,
    source, source_url, license, credit, alt, updated_by, updated_at, sort_order, is_cover
    FROM school_media_metadata WHERE school_code = ? LIMIT 1`).bind(schoolCode)
    .first<Omit<SchoolMediaMetadata, "is_cover"> & { is_cover: number }>();
  return item ? { ...item, is_cover: item.is_cover === 1 } : null;
}

export async function saveSchoolMediaMetadata(input: SchoolMediaMetadata) {
  if (input.storage_provider !== "imagekit" || !input.file_id || !/^https:\/\//.test(input.image_url)) {
    throw new Error("school_media_requires_imagekit_metadata");
  }
  await ensureSchema();
  const db = getCommunityDatabase();
  await db.prepare(`INSERT INTO school_media_metadata (
    school_code, file_id, storage_provider, image_url, thumbnail_url, alt, source, source_url, license, credit,
    sort_order, is_cover, updated_by, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(school_code) DO UPDATE SET
    file_id = excluded.file_id, storage_provider = excluded.storage_provider,
    image_url = excluded.image_url, thumbnail_url = excluded.thumbnail_url, alt = excluded.alt,
    source = excluded.source, source_url = excluded.source_url, license = excluded.license, credit = excluded.credit, sort_order = excluded.sort_order,
    is_cover = excluded.is_cover, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
    .bind(input.school_code, input.file_id, input.storage_provider, input.image_url, input.thumbnail_url,
      input.alt, input.source, input.source_url, input.license, input.credit, input.sort_order, input.is_cover ? 1 : 0,
      input.updated_by, input.updated_at).run();
}

export async function deleteSchoolMediaMetadata(schoolCode: string) {
  await ensureSchema();
  const db = getCommunityDatabase();
  const result = await db.prepare("DELETE FROM school_media_metadata WHERE school_code = ?").bind(schoolCode).run();
  return (result.meta.changes ?? 0) > 0;
}

export async function listSchoolMediaDrafts() {
  await ensureSchema();
  const result = await getCommunityDatabase().prepare(`SELECT id, school_code, file_id, storage_provider, image_url,
    thumbnail_url, source, source_url, license, credit, alt, updated_by, updated_at, created_by, created_at, status
    FROM school_media_drafts WHERE status = 'draft' ORDER BY updated_at DESC`).all<SchoolMediaDraft>();
  return result.results ?? [];
}

export async function getSchoolMediaDraft(id: string) {
  await ensureSchema();
  return getCommunityDatabase().prepare(`SELECT id, school_code, file_id, storage_provider, image_url,
    thumbnail_url, source, source_url, license, credit, alt, updated_by, updated_at, created_by, created_at, status
    FROM school_media_drafts WHERE id = ? LIMIT 1`).bind(id).first<SchoolMediaDraft>();
}

export async function getSchoolMediaDraftForUser(schoolCode: string, adminId: string) {
  await ensureSchema();
  return getCommunityDatabase().prepare(`SELECT id, school_code, file_id, storage_provider, image_url,
    thumbnail_url, source, source_url, license, credit, alt, updated_by, updated_at, created_by, created_at, status
    FROM school_media_drafts WHERE school_code = ? AND created_by = ? AND status = 'draft' LIMIT 1`)
    .bind(schoolCode, adminId).first<SchoolMediaDraft>();
}

export async function getPendingSchoolMediaDraft(schoolCode: string) {
  await ensureSchema();
  return getCommunityDatabase().prepare(`SELECT id, school_code, file_id, storage_provider, image_url,
    thumbnail_url, source, source_url, license, credit, alt, updated_by, updated_at, created_by, created_at, status
    FROM school_media_drafts WHERE school_code = ? AND status = 'draft' LIMIT 1`)
    .bind(schoolCode).first<SchoolMediaDraft>();
}

export async function saveSchoolMediaDraft(input: SchoolMediaMetadata & { created_by: string }) {
  await ensureSchema();
  const now = input.updated_at;
  const id = crypto.randomUUID();
  await getCommunityDatabase().prepare(`INSERT INTO school_media_drafts (
    id, school_code, file_id, storage_provider, image_url, thumbnail_url, source, source_url, license,
    credit, alt, created_by, updated_by, created_at, updated_at, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  ON CONFLICT(school_code, created_by) DO UPDATE SET
    file_id = excluded.file_id, storage_provider = excluded.storage_provider,
    image_url = excluded.image_url, thumbnail_url = excluded.thumbnail_url, source = excluded.source,
    source_url = excluded.source_url, license = excluded.license, credit = excluded.credit, alt = excluded.alt,
    updated_by = excluded.updated_by, updated_at = excluded.updated_at, status = 'draft'`)
    .bind(id, input.school_code, input.file_id, input.storage_provider, input.image_url, input.thumbnail_url,
      input.source, input.source_url, input.license, input.credit, input.alt, input.created_by,
      input.updated_by, now, now).run();
  return getSchoolMediaDraftForUser(input.school_code, input.created_by);
}

export async function markSchoolMediaDraftPublished(id: string, adminId: string) {
  await ensureSchema();
  const result = await getCommunityDatabase().prepare(`UPDATE school_media_drafts
    SET status = 'published', updated_by = ?, updated_at = ?
    WHERE id = ? AND status = 'draft'`)
    .bind(adminId, new Date().toISOString(), id).run();
  return (result.meta.changes ?? 0) > 0;
}

export async function deleteSchoolMediaDraft(id: string, adminId?: string) {
  await ensureSchema();
  const result = adminId
    ? await getCommunityDatabase().prepare("DELETE FROM school_media_drafts WHERE id = ? AND created_by = ? AND status = 'draft'").bind(id, adminId).run()
    : await getCommunityDatabase().prepare("DELETE FROM school_media_drafts WHERE id = ? AND status = 'draft'").bind(id).run();
  return (result.meta.changes ?? 0) > 0;
}
