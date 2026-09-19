import media from "../content/schools/school-media.json";
import imageCache from "../content/schools/generated/school-image-cache.json";
import { isDisplayableSchoolImage, type SchoolImageRecord } from "./school-image-resolver";

export type SchoolMediaEntry = Readonly<{
  coverImage: string;
  source: "jshs-owned" | "official-school-site" | "licensed-public" | "admin-provided";
  sourceUrl: string;
  alt: string;
  updatedAt: string;
}>;

const entries = media as Record<string, SchoolMediaEntry>;
const automaticEntries = imageCache as Record<string, SchoolImageRecord>;

export function getSchoolMedia(code: string): SchoolMediaEntry | undefined {
  const entry = entries[code];
  if (!entry || !/^\/(?:images|media)\//.test(entry.coverImage)) return undefined;
  return entry;
}

export function getResolvedSchoolMedia(code: string, identity?: { name: string; address: string; latitude?: number; longitude?: number }): SchoolMediaEntry | undefined {
  const manual = getSchoolMedia(code);
  if (manual) return manual;
  const automatic = automaticEntries[code];
  if (!identity || !isDisplayableSchoolImage(automatic, { code, ...identity }) || !automatic.image?.localPath || !/^\/(?:images|media)\//.test(automatic.image.localPath)) return undefined;
  return { coverImage: automatic.image.localPath, source: "licensed-public", sourceUrl: automatic.attribution?.sourceUrl || "", alt: `${automatic.schoolName}校園圖片`, updatedAt: automatic.resolvedAt };
}
