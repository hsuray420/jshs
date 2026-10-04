import { getCommunityDatabase } from "./bindings";
import {
  deleteSchoolMediaOverride as deleteLegacySchoolMediaOverride,
  getSchoolMediaOverride as getLegacySchoolMediaOverride,
  listSchoolMediaOverrides as listLegacySchoolMediaOverrides,
  upsertSchoolMediaOverride as upsertLegacySchoolMediaOverride,
  type SchoolMediaOverride,
} from "./admin-store";

export type SchoolMediaMetadata = SchoolMediaOverride & { sort_order: number; is_cover: boolean };

async function ensureSchema() {
  const { db } = getCommunityDatabase();
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
}

export async function listSchoolMediaMetadata(): Promise<SchoolMediaMetadata[]> {
  const { db, mode } = getCommunityDatabase();
  if (mode === "legacy") return (await listLegacySchoolMediaOverrides()).map((item) => ({ ...item, sort_order: 0, is_cover: true }));
  await ensureSchema();
  const result = await db.prepare(`SELECT school_code, file_id, storage_provider, image_url, thumbnail_url,
    source, source_url, license, credit, alt, updated_by, updated_at, sort_order, is_cover
    FROM school_media_metadata ORDER BY sort_order, updated_at DESC`).all<Omit<SchoolMediaMetadata, "is_cover"> & { is_cover: number }>();
  return (result.results ?? []).map((row) => ({ ...row, is_cover: row.is_cover === 1 }));
}

export async function getSchoolMediaMetadata(schoolCode: string): Promise<SchoolMediaMetadata | null> {
  const { db, mode } = getCommunityDatabase();
  if (mode === "legacy") {
    const item = await getLegacySchoolMediaOverride(schoolCode);
    return item ? { ...item, sort_order: 0, is_cover: true } : null;
  }
  await ensureSchema();
  const item = await db.prepare(`SELECT school_code, file_id, storage_provider, image_url, thumbnail_url,
    source, source_url, license, credit, alt, updated_by, updated_at, sort_order, is_cover
    FROM school_media_metadata WHERE school_code = ? LIMIT 1`).bind(schoolCode)
    .first<Omit<SchoolMediaMetadata, "is_cover"> & { is_cover: number }>();
  return item ? { ...item, is_cover: item.is_cover === 1 } : null;
}

export async function saveSchoolMediaMetadata(input: SchoolMediaMetadata) {
  const { db, mode } = getCommunityDatabase();
  if (mode === "legacy") {
    await upsertLegacySchoolMediaOverride(input);
    return;
  }
  await ensureSchema();
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
  const { db, mode } = getCommunityDatabase();
  if (mode === "legacy") return deleteLegacySchoolMediaOverride(schoolCode);
  await ensureSchema();
  const result = await db.prepare("DELETE FROM school_media_metadata WHERE school_code = ?").bind(schoolCode).run();
  return (result.meta.changes ?? 0) > 0;
}
