import districtMetadata from "../public/it_hs/district-metadata.json";

export const DISTRICT_STORAGE_KEY = "jshs_district";
export const DISTRICT_CHANGED_EVENT = "jshs-district-changed";

export type DistrictCode = keyof typeof districtMetadata.districts;

const districts = districtMetadata.districts as Record<string, { label: string }>;

export function normalizeDistrict(value: string | null | undefined): DistrictCode | "" {
  const normalized = (value || "").trim();
  return normalized in districts ? normalized as DistrictCode : "";
}

export function getDistrictLabel(value: string | null | undefined): string {
  const district = normalizeDistrict(value);
  return district ? districts[district].label : "選擇就學區";
}

export function readStoredDistrict(): DistrictCode | "" {
  if (typeof window === "undefined") return "";
  return normalizeDistrict(window.localStorage.getItem(DISTRICT_STORAGE_KEY));
}

export function writeStoredDistrict(value: string): DistrictCode | "" {
  if (typeof window === "undefined") return "";
  const district = normalizeDistrict(value);
  if (!district) return "";
  window.localStorage.setItem(DISTRICT_STORAGE_KEY, district);
  window.dispatchEvent(new Event(DISTRICT_CHANGED_EVENT));
  return district;
}

export function subscribeToDistrict(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(DISTRICT_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DISTRICT_CHANGED_EVENT, callback);
  };
}

export function getDistrictOptions(): readonly { code: DistrictCode; label: string }[] {
  return Object.entries(districts).map(([code, district]) => ({ code: code as DistrictCode, label: district.label }));
}
