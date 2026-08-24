import { writeStoredDistrict } from "@/lib/district-context";

export type ProgressKey = "schoolSearch" | "calculator" | "planner";

export type ProgressState = Readonly<{
  district: string;
  schoolSearch: boolean;
  calculator: boolean;
  planner: boolean;
}>;

export const PROGRESS_STORAGE_KEY = "jshs_progress";
export const defaultProgress: ProgressState = Object.freeze({
  district: "",
  schoolSearch: false,
  calculator: false,
  planner: false,
});

export function readProgress(value: string | null): ProgressState {
  if (!value) return defaultProgress;
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
  if (typeof window === "undefined") return;
  const current = readProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
  const next = Object.freeze({
    ...current,
    ...(key === "district" ? { district: value } : { [key]: true }),
  });
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
  if (key === "district" && value) writeStoredDistrict(value);
  window.dispatchEvent(new Event("jshs-progress"));
}
