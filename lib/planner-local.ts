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
const ITEMS_KEY = "jshs_local_planner_items";
const STATE_KEY = "jshs_local_planner_state";

export function readLocalPlanner() {
  if (typeof window === "undefined") return { items: [] as LocalPlannerItem[], state: { order: [] as string[] } };
  try {
    const items = JSON.parse(window.localStorage.getItem(ITEMS_KEY) || "[]") as LocalPlannerItem[];
    const state = JSON.parse(window.localStorage.getItem(STATE_KEY) || "{\"order\":[]}") as LocalPlannerState;
    return { items: Array.isArray(items) ? items : [], state: { ...state, order: [...(state.order || [])] } };
  } catch { return { items: [], state: { order: [] as string[] } }; }
}

export function writeLocalPlanner(items: readonly LocalPlannerItem[], state: LocalPlannerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  window.localStorage.setItem(STATE_KEY, JSON.stringify({ ...state, order: [...(state.order || [])] }));
}
