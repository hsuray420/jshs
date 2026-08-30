import { getAdmissionHistoryRecord } from "@/lib/admission-history";
import { schoolDirectory } from "@/lib/school-directory";

export function getPlannerSchools() {
  return schoolDirectory.map((school) => ({
    district: school.districtCode,
    code: school.code,
    name: school.name,
    department: school.departmentsRaw,
    city: school.city, program: school.program, groups: school.groups, area: school.area,
    academicYear: school.academicYear, dataStatus: school.dataStatus, hasQuota: school.hasQuota,
    hasHistoricalData: school.hasHistoricalData, sourceName: school.sourceName, updatedAt: school.updatedAt,
    referenceScore: getAdmissionHistoryRecord(school.districtCode, school.code)?.referenceScore || "",
  }));
}
