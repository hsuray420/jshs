import guideCatalog from "@/data/admission-guides.json";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { getSource } from "@/lib/source-registry";

export type OfficialInformationType = "guide" | "schedule" | "announcement" | "rule" | "platform" | "other";
export type OfficialInformationSourceType = "official_original" | "jshs_curated";
export type OfficialInformationRecord = Readonly<{ id: string; title: string; issuer: string; district: string; schoolYear: string; dataSchoolYear: string; yearStatus: "current" | "previous_year_reference" | "pending"; publishDate: string; updatedAt: string; type: OfficialInformationType; sourceId: string; sourceUrl: string; sourceType: OfficialInformationSourceType; summary: string }>;

const guides: readonly OfficialInformationRecord[] = guideCatalog.guides.map((guide) => {
  const district = districtMetadata.districts[guide.code as keyof typeof districtMetadata.districts];
  const sourceId = `guide-${guide.code}-115`;
  const source = getSource(sourceId);
  return { id: sourceId, title: `${guide.label}免試入學簡章`, issuer: district.sourceName, district: guide.code, schoolYear: "115", dataSchoolYear: "115", yearStatus: "current", publishDate: "", updatedAt: district.updatedAt, type: "guide", sourceId, sourceUrl: source?.sourceDocumentPath || guide.file, sourceType: "official_original", summary: "官方原始簡章 PDF；僅作 115 學年度來源參考。" };
});
const platforms: readonly OfficialInformationRecord[] = Object.entries(districtMetadata.districts).map(([code, district]) => ({ id: `platform-${code}`, title: `${district.label}官方招生資訊入口`, issuer: district.sourceName, district: code, schoolYear: district.academicYear, dataSchoolYear: district.academicYear, yearStatus: "current", publishDate: "", updatedAt: district.updatedAt, type: "platform", sourceId: "official-portals-115", sourceUrl: district.sourceUrl, sourceType: "official_original", summary: "官方入口網站，不是單一公告紀錄。" }));

export const officialInformationRecords: readonly OfficialInformationRecord[] = Object.freeze([...guides, ...platforms]);
export const officialInformationTypes: readonly OfficialInformationType[] = ["guide", "schedule", "announcement", "rule", "platform", "other"];
export function getOfficialInformationRecords() { return officialInformationRecords; }
