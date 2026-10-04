import districtMetadata from "../public/it_hs/district-metadata.json";

export const DISTRICT_CHANGED_EVENT = "jshs-district-changed";
let currentDistrict: DistrictCode | "" = "";

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
  return currentDistrict;
}

export function writeStoredDistrict(value: string): DistrictCode | "" {
  const district = normalizeDistrict(value);
  if (!district) return "";
  currentDistrict = district;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DISTRICT_CHANGED_EVENT));
  return district;
}

export function subscribeToDistrict(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DISTRICT_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener(DISTRICT_CHANGED_EVENT, callback);
  };
}

export function getDistrictOptions(): readonly { code: DistrictCode; label: string }[] {
  return Object.entries(districts).map(([code, district]) => ({ code: code as DistrictCode, label: district.label }));
}
