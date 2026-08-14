import centralSchoolsCsv from "../public/it_hs/ct/schools.csv?raw";
import { toSchoolRecords } from "./school-catalog.mjs";

export type SchoolDepartment = Readonly<{
  name: string;
  quota: number | null;
  audience: string;
}>;

export type CentralSchool = Readonly<{
  rank: string;
  code: string;
  name: string;
  ownership: string;
  admissionTrack: string;
  program: string;
  gender: string;
  city: string;
  area: string;
  address: string;
  website: string;
  phone: string;
  departmentsRaw: string;
  departments: readonly SchoolDepartment[];
  quota: string;
  referenceScore: string;
  scoreYear: string;
  sourceNote: string;
  specialPrograms: string;
}>;

export const centralSchools = toSchoolRecords(centralSchoolsCsv) as readonly CentralSchool[];

export function getCentralSchool(code: string): CentralSchool | undefined {
  return centralSchools.find((school) => school.code === code);
}

export function getRelatedCentralSchools(school: CentralSchool, limit = 4): readonly CentralSchool[] {
  return centralSchools
    .filter((candidate) => candidate.code !== school.code)
    .map((candidate) => ({
      candidate,
      relevance:
        Number(candidate.city === school.city) * 4
        + Number(candidate.area === school.area) * 3
        + Number(candidate.program === school.program) * 2
        + Number(candidate.ownership === school.ownership),
    }))
    .sort((left, right) => right.relevance - left.relevance || left.candidate.name.localeCompare(right.candidate.name, "zh-TW"))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
