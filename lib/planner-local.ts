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
let memoryPlanner = { items: [] as LocalPlannerItem[], state: { order: [] as string[] } as LocalPlannerState, snapshots: [] as LocalPlannerSnapshot[] };

export function readLocalPlanner() {
  return { items: [...memoryPlanner.items], state: { ...memoryPlanner.state, order: [...(memoryPlanner.state.order || [])] }, snapshots: [...memoryPlanner.snapshots] };
}

export function writeLocalPlanner(items: readonly LocalPlannerItem[], state: LocalPlannerState) {
  memoryPlanner = { ...memoryPlanner, items: [...items], state: { ...state, order: [...(state.order || [])] } };
}

export function saveLocalPlannerSnapshot(items: readonly LocalPlannerItem[], state: LocalPlannerState) {
  const current = readLocalPlanner().snapshots;
  const snapshot: LocalPlannerSnapshot = { id: crypto.randomUUID(), created_at: new Date().toISOString(), items: [...items], state: { ...state, order: [...(state.order || [])] } };
  memoryPlanner = { ...memoryPlanner, snapshots: [snapshot, ...current].slice(0, 30) };
}

export function readLocalPlannerSnapshots() {
  return readLocalPlanner().snapshots;
}
