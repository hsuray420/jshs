import { writeStoredDistrict } from "@/lib/district-context";

export type ProgressKey = "schoolSearch" | "calculator" | "planner";

export type ProgressState = Readonly<{
  district: string;
  schoolSearch: boolean;
  calculator: boolean;
  planner: boolean;
}>;

export const PROGRESS_STORAGE_KEY = "member_progress";
export const defaultProgress: ProgressState = Object.freeze({
  district: "",
  schoolSearch: false,
  calculator: false,
  planner: false,
});
let progressState: ProgressState = defaultProgress;

export function readProgress(value: string | null): ProgressState {
  if (value === null) return progressState;
  try {
    const parsed = JSON.parse(value) as Partial<ProgressState>;
    return Object.freeze({
      district: typeof parsed.district === "string" ? parsed.district : "",
      schoolSearch: parsed.schoolSearch === true,
      calculator: parsed.calculator === true,
      planner: parsed.planner === true,
    });
  } catch {
    return defaultProgress;
  }
}

export function markProgress(key: ProgressKey | "district", value = "") {
  const current = progressState;
  const next = Object.freeze({
    ...current,
    ...(key === "district" ? { district: value } : { [key]: true }),
  });
  progressState = next;
  if (key === "district" && value) writeStoredDistrict(value);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("jshs-progress"));
}
