export const SERVICE_YEAR = "116" as const;
export const SOURCE_ACADEMIC_YEAR = "115" as const;
export const VERIFICATION_STATUS = "awaiting_116_official_release" as const;

export type SourceType =
  | "official"
  | "official_based_calculation"
  | "jshs_curated"
  | "jshs_estimated"
  | "community";

export const SOURCE_TYPE_LABELS: Readonly<Record<SourceType, string>> = {
  official: "官方",
  official_based_calculation: "依官方資料計算",
  jshs_curated: "JSHS 整理",
  jshs_estimated: "JSHS 推估",
  community: "社群資料",
};

export type TrustMetadata = Readonly<{
  sourceType: SourceType;
  sourceName?: string;
  sourceUrl?: string;
  serviceYear?: string;
  sourceAcademicYear?: string;
  verificationStatus?: string;
  verifiedAt?: string;
}>;

export const CURRENT_YEAR_CONTEXT = Object.freeze({
  serviceYear: SERVICE_YEAR,
  sourceAcademicYear: SOURCE_ACADEMIC_YEAR,
  verificationStatus: VERIFICATION_STATUS,
});

export function sourceTypeLabel(sourceType: SourceType): string {
  return SOURCE_TYPE_LABELS[sourceType];
}

export function serviceYearNotice(sourceAcademicYear = SOURCE_ACADEMIC_YEAR): string {
  return `${SERVICE_YEAR} 學年度試算，目前暫依 ${sourceAcademicYear} 學年度官方規則。`;
}

