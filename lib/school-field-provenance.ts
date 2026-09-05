import { schoolMetadata, type School } from "@/lib/school-repository";

export type FieldProvenanceStatus = "verified" | "available" | "pending" | "unavailable";
export type SchoolFieldProvenance = Readonly<{ value: string; sourceType: "official" | "jshs_curated"; sourceUrl: string; sourceTitle: string; schoolYear: string; verifiedAt: string; status: FieldProvenanceStatus }>;

export function schoolFieldProvenance(school: School, value: string | null | undefined): SchoolFieldProvenance {
  const exists = Boolean(value?.trim());
  return { value: value?.trim() || "待確認", sourceType: school.website ? "official" : "jshs_curated", sourceUrl: school.website || "", sourceTitle: "schools_master.csv", schoolYear: school.academicYear, verifiedAt: schoolMetadata.sourceUpdatedAt, status: exists ? "available" : "pending" };
}
