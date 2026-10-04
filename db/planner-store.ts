import { getLearningDatabase } from "./bindings";

export type PlannerItem = {
  id: string;
  planner_id: string;
  district: string;
  school_code: string;
  school_name: string;
  department: string;
  tier: string;
  notes: string;
  created_at: string;
};

export async function ensurePlannerSchema() {
  const { db, mode } = getLearningDatabase();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS planner_items (
      id TEXT PRIMARY KEY,
      planner_id TEXT NOT NULL,
      district TEXT NOT NULL,
      school_code TEXT NOT NULL,
      school_name TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT '',
      tier TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_planner_items_owner_created
      ON planner_items(planner_id, created_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS planner_states (
      planner_id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS member_planners (
      ${mode === "split" ? "user_id TEXT PRIMARY KEY," : "line_user_id TEXT PRIMARY KEY,"}
      planner_id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      last_used_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS planner_confirmations (
      planner_id TEXT PRIMARY KEY,
      item_count INTEGER NOT NULL,
      state_json TEXT NOT NULL,
      confirmed_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS planner_versions (
      id TEXT PRIMARY KEY,
      planner_id TEXT NOT NULL,
      state_json TEXT NOT NULL,
      items_json TEXT NOT NULL DEFAULT '[]',
      item_count INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_planner_versions_planner_created
      ON planner_versions(planner_id, created_at DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_member_planners_last_used_at
      ON member_planners(last_used_at)`),
  ]);

  const columns = await db.prepare("PRAGMA table_info(planner_items)").all<{ name: string }>();
  if (!(columns.results ?? []).some((column) => column.name === "tier")) {
    await db.prepare("ALTER TABLE planner_items ADD COLUMN tier TEXT NOT NULL DEFAULT ''").run();
  }
  const versionColumns = await db.prepare("PRAGMA table_info(planner_versions)").all<{ name: string }>();
  if (!(versionColumns.results ?? []).some((column) => column.name === "items_json")) {
    await db.prepare("ALTER TABLE planner_versions ADD COLUMN items_json TEXT NOT NULL DEFAULT '[]'").run();
  }
}

export async function getOrCreateMemberPlanner(userId: string, legacyLineUserId = userId) {
  await ensurePlannerSchema();
  const { db, mode } = getLearningDatabase();
  const ownerColumn = mode === "split" ? "user_id" : "line_user_id";
  const owner = mode === "split" ? userId : legacyLineUserId;
  const now = new Date().toISOString();
  const plannerId = crypto.randomUUID();
  await db.prepare(`INSERT OR IGNORE INTO member_planners (
    ${ownerColumn}, planner_id, created_at, last_used_at
  ) VALUES (?, ?, ?, ?)`).bind(owner, plannerId, now, now).run();
  await db.prepare(`UPDATE member_planners SET last_used_at = ? WHERE ${ownerColumn} = ?`)
    .bind(now, owner).run();
  const memberPlanner = await db.prepare(`SELECT planner_id FROM member_planners
    WHERE ${ownerColumn} = ? LIMIT 1`).bind(owner).first<{ planner_id: string }>();
  if (!memberPlanner?.planner_id) throw new Error("member_planner_unavailable");
  return memberPlanner.planner_id;
}

export async function listPlannerItems(plannerId: string) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  const result = await db.prepare(`SELECT * FROM planner_items
    WHERE planner_id = ? ORDER BY created_at ASC LIMIT 100`).bind(plannerId).all<PlannerItem>();
  return result.results ?? [];
}

export async function hasPlannerItem(plannerId: string, itemId: string) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  const result = await db.prepare(`SELECT 1 AS present FROM planner_items WHERE planner_id = ? AND id = ? LIMIT 1`)
    .bind(plannerId, itemId).first<{ present: number }>();
  return result?.present === 1;
}

export async function createPlannerItem(input: PlannerItem) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  const count = await db.prepare(`SELECT COUNT(*) AS count FROM planner_items
    WHERE planner_id = ?`).bind(input.planner_id).first<{ count: number }>();
  if ((count?.count ?? 0) >= 100) throw new Error("planner_limit_reached");
  await db.prepare(`INSERT INTO planner_items (
    id, planner_id, district, school_code, school_name, department, tier, notes, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    input.id, input.planner_id, input.district, input.school_code, input.school_name,
    input.department, input.tier, input.notes, input.created_at,
  ).run();
}

export async function deletePlannerItem(plannerId: string, itemId: string) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  await db.prepare(`DELETE FROM planner_items WHERE id = ? AND planner_id = ?`)
    .bind(itemId, plannerId).run();
}

export async function getPlannerState(plannerId: string) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  const result = await db.prepare(`SELECT state_json FROM planner_states
    WHERE planner_id = ? LIMIT 1`).bind(plannerId).first<{ state_json: string }>();
  return result?.state_json ?? null;
}

export async function savePlannerState(plannerId: string, stateJson: string) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  await db.prepare(`INSERT INTO planner_states (planner_id, state_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(planner_id) DO UPDATE SET
      state_json = excluded.state_json,
      updated_at = excluded.updated_at`).bind(
    plannerId,
    stateJson,
    new Date().toISOString(),
  ).run();
}

export async function createPlannerVersion(plannerId: string, stateJson: string, items: readonly PlannerItem[], id = crypto.randomUUID(), createdAt = new Date().toISOString()) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  await db.prepare(`INSERT INTO planner_versions (id, planner_id, state_json, items_json, item_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING`).bind(id, plannerId, stateJson, JSON.stringify(items), items.length, createdAt).run();
}
export async function hasPlannerVersion(plannerId: string, id: string) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  const result = await db.prepare("SELECT 1 AS present FROM planner_versions WHERE planner_id = ? AND id = ? LIMIT 1")
    .bind(plannerId, id).first<{ present: number }>();
  return result?.present === 1;
}

export async function listPlannerVersions(plannerId: string) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  const result = await db.prepare(`SELECT id, planner_id, state_json, items_json, item_count, created_at
    FROM planner_versions WHERE planner_id = ? ORDER BY created_at DESC LIMIT 30`).bind(plannerId).all<{ id: string; planner_id: string; state_json: string; items_json: string; item_count: number; created_at: string }>();
  return result.results ?? [];
}

export async function getPlannerVersion(plannerId: string, versionId: string) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  return db.prepare(`SELECT id, planner_id, state_json, items_json, item_count, created_at
    FROM planner_versions WHERE planner_id = ? AND id = ? LIMIT 1`).bind(plannerId, versionId)
    .first<{ id: string; planner_id: string; state_json: string; items_json: string; item_count: number; created_at: string }>();
}

export async function replacePlannerItems(plannerId: string, items: readonly PlannerItem[]) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  const statements = [db.prepare("DELETE FROM planner_items WHERE planner_id = ?").bind(plannerId), ...items.slice(0, 100).map((item) => db.prepare(`INSERT INTO planner_items (id, planner_id, district, school_code, school_name, department, tier, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(item.id, plannerId, item.district, item.school_code, item.school_name, item.department, item.tier, item.notes, item.created_at))];
  await db.batch(statements);
}

export async function confirmPlanner(plannerId: string, itemCount: number, stateJson: string) {
  await ensurePlannerSchema();
  const { db } = getLearningDatabase();
  const confirmedAt = new Date().toISOString();
  await db.prepare(`INSERT INTO planner_confirmations
    (planner_id, item_count, state_json, confirmed_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(planner_id) DO UPDATE SET
      item_count = excluded.item_count,
      state_json = excluded.state_json,
      confirmed_at = excluded.confirmed_at`)
    .bind(plannerId, itemCount, stateJson, confirmedAt).run();
  return confirmedAt;
}
