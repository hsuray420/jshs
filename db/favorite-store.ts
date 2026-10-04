import { getCoreDatabase } from "./bindings";

export type Favorite = Readonly<{ user_id: string; school_code: string; created_at: string }>;

async function ensureFavoriteSchema() {
  const db = getCoreDatabase();
  await db.prepare(`CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL,
    school_code TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(user_id, school_code)
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at)").run();
}

export async function listFavorites(userId: string) {
  await ensureFavoriteSchema();
  const db = getCoreDatabase();
  const result = await db.prepare(`SELECT user_id, school_code, created_at FROM favorites
    WHERE user_id = ? ORDER BY created_at DESC`).bind(userId).all<Favorite>();
  return result.results ?? [];
}

export async function addFavorite(userId: string, schoolCode: string) {
  await ensureFavoriteSchema();
  const db = getCoreDatabase();
  await db.prepare(`INSERT OR IGNORE INTO favorites (user_id, school_code, created_at)
    VALUES (?, ?, ?)`).bind(userId, schoolCode, new Date().toISOString()).run();
}

export async function removeFavorite(userId: string, schoolCode: string) {
  await ensureFavoriteSchema();
  const db = getCoreDatabase();
  await db.prepare("DELETE FROM favorites WHERE user_id = ? AND school_code = ?")
    .bind(userId, schoolCode).run();
}
