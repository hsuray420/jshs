import type { SchoolDirectoryRecord } from "@/lib/school-directory";

export type FieldProvenanceStatus = "verified" | "available" | "pending" | "unavailable";
export type SchoolFieldProvenance = Readonly<{ value: string; sourceType: "official" | "jshs_curated"; sourceUrl: string; sourceTitle: string; schoolYear: string; verifiedAt: string; status: FieldProvenanceStatus }>;

export function schoolFieldProvenance(school: SchoolDirectoryRecord, value: string | null | undefined): SchoolFieldProvenance {
  const exists = Boolean(value?.trim());
  return { value: value?.trim() || "待確認", sourceType: school.sourceUrl ? "official" : "jshs_curated", sourceUrl: school.sourceUrl || "", sourceTitle: school.sourceName || "JSHS 學校目錄", schoolYear: school.academicYear, verifiedAt: school.updatedAt, status: exists ? school.dataStatus === "ready" ? "verified" : "available" : "pending" };
}
