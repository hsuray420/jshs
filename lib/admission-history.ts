import admissionHistoryData from "../public/it_hs/admission-history.json";

export type AdmissionHistoryRecord = Readonly<{
  districtCode: string;
  districtLabel: string;
  academicYear: string;
  dataStatus: string;
  sourceName: "非官方整理";
  sourceUrl: string;
  code: string;
  name: string;
  program: string;
  city: string;
  area: string;
  departmentsRaw: string;
  referenceScore: string;
  scoreYear: string;
  sourceNote: string;
  sourceType: "community";
}>;

export const admissionHistory: readonly AdmissionHistoryRecord[] = Object.freeze(
  admissionHistoryData.schools as readonly AdmissionHistoryRecord[],
);

export function getAdmissionHistoryRecord(districtCode: string, code: string) {
  return admissionHistory.find((school) => school.districtCode === districtCode && school.code === code);
}
