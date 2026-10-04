export type LocalPlannerItem = Readonly<{
  id: string;
  district: string;
  school_code: string;
  school_name: string;
  department: string;
  tier: string;
  notes: string;
  created_at: string;
}>;

export type LocalPlannerState = Readonly<{ order?: readonly string[]; itemMeta?: Record<string, unknown>; tasks?: Record<string, boolean> }>;
export type LocalPlannerSnapshot = Readonly<{ id: string; created_at: string; items: readonly LocalPlannerItem[]; state: LocalPlannerState }>;
const ITEMS_KEY = "jshs_local_planner_items";
const STATE_KEY = "jshs_local_planner_state";
const SNAPSHOTS_KEY = "jshs_local_planner_snapshots";

export function readLocalPlanner() {
  if (typeof window === "undefined") return { items: [] as LocalPlannerItem[], state: { order: [] as string[] }, snapshots: [] as LocalPlannerSnapshot[] };
  try {
    const items = JSON.parse(window.localStorage.getItem(ITEMS_KEY) || "[]") as LocalPlannerItem[];
    const state = JSON.parse(window.localStorage.getItem(STATE_KEY) || "{\"order\":[]}") as LocalPlannerState;
    const snapshots = JSON.parse(window.localStorage.getItem(SNAPSHOTS_KEY) || "[]") as LocalPlannerSnapshot[];
    return { items: Array.isArray(items) ? items : [], state: { ...state, order: [...(state.order || [])] }, snapshots: Array.isArray(snapshots) ? snapshots : [] };
  } catch { return { items: [], state: { order: [] as string[] }, snapshots: [] as LocalPlannerSnapshot[] }; }
}

export function writeLocalPlanner(items: readonly LocalPlannerItem[], state: LocalPlannerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  window.localStorage.setItem(STATE_KEY, JSON.stringify({ ...state, order: [...(state.order || [])] }));
}

export function saveLocalPlannerSnapshot(items: readonly LocalPlannerItem[], state: LocalPlannerState) {
  if (typeof window === "undefined") return;
  const current = readLocalPlanner().snapshots;
  const snapshot: LocalPlannerSnapshot = { id: crypto.randomUUID(), created_at: new Date().toISOString(), items: [...items], state: { ...state, order: [...(state.order || [])] } };
  window.localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify([snapshot, ...current].slice(0, 30)));
}

export function readLocalPlannerSnapshots() {
  return readLocalPlanner().snapshots;
}
