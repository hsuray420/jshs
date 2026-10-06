import { getSiteSetting, upsertSiteSetting } from "../db/admin-store";
import { DEFAULT_POPULAR_SCHOOLS, resolvePopularSchoolsForRegion } from "./popular-schools-data";

export { DEFAULT_POPULAR_SCHOOLS, resolvePopularSchoolsForRegion };

export async function getPopularSchoolsMap(): Promise<Record<string, string[]>> {
  try {
    const setting = await getSiteSetting("popular_schools");
    if (!setting?.value) return { ...DEFAULT_POPULAR_SCHOOLS };
    const parsed = JSON.parse(setting.value) as Record<string, unknown>;
    const result: Record<string, string[]> = { ...DEFAULT_POPULAR_SCHOOLS };
    for (const [district, codes] of Object.entries(parsed)) {
      if (Array.isArray(codes)) {
        result[district] = codes.map((code) => String(code).trim()).filter(Boolean);
      }
    }
    return result;
  } catch {
    return { ...DEFAULT_POPULAR_SCHOOLS };
  }
}

export async function savePopularSchoolsMap(
  map: Record<string, string[]>,
  updatedBy: string,
): Promise<void> {
  const cleaned: Record<string, string[]> = {};
  for (const [district, codes] of Object.entries(map)) {
    if (Array.isArray(codes)) {
      const valid = [...new Set(codes.map((code) => String(code).trim()).filter(Boolean))];
      if (valid.length) cleaned[district] = valid;
    }
  }
  await upsertSiteSetting("popular_schools", JSON.stringify(cleaned), updatedBy);
}
