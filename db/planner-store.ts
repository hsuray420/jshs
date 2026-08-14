import { getD1 } from "./admin-store";

export type PlannerItem = {
  id: string;
  planner_id: string;
  district: string;
  school_code: string;
  school_name: string;
  department: string;
  notes: string;
  created_at: string;
};

export async function ensurePlannerSchema() {
  await getD1().batch([
    getD1().prepare(`CREATE TABLE IF NOT EXISTS planner_items (
      id TEXT PRIMARY KEY,
      planner_id TEXT NOT NULL,
      district TEXT NOT NULL,
      school_code TEXT NOT NULL,
      school_name TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`),
    getD1().prepare(`CREATE INDEX IF NOT EXISTS idx_planner_items_owner_created
      ON planner_items(planner_id, created_at)`),
  ]);
}

export async function listPlannerItems(plannerId: string) {
  await ensurePlannerSchema();
  const result = await getD1().prepare(`SELECT * FROM planner_items
    WHERE planner_id = ? ORDER BY created_at ASC LIMIT 100`).bind(plannerId).all<PlannerItem>();
  return result.results ?? [];
}

export async function createPlannerItem(input: PlannerItem) {
  await ensurePlannerSchema();
  const count = await getD1().prepare(`SELECT COUNT(*) AS count FROM planner_items
    WHERE planner_id = ?`).bind(input.planner_id).first<{ count: number }>();
  if ((count?.count ?? 0) >= 100) throw new Error("planner_limit_reached");
  await getD1().prepare(`INSERT INTO planner_items (
    id, planner_id, district, school_code, school_name, department, notes, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    input.id, input.planner_id, input.district, input.school_code, input.school_name,
    input.department, input.notes, input.created_at,
  ).run();
}

export async function deletePlannerItem(plannerId: string, itemId: string) {
  await ensurePlannerSchema();
  await getD1().prepare(`DELETE FROM planner_items WHERE id = ? AND planner_id = ?`)
    .bind(itemId, plannerId).run();
}
