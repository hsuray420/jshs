import { getAdmissionHistoryRecord } from "@/lib/admission-history";
import { schoolDirectory } from "@/lib/school-directory";

export function getPlannerSchools() {
  return schoolDirectory.map((school) => ({
    district: school.districtCode,
    code: school.code,
    name: school.name,
    department: school.departmentsRaw,
    referenceScore: getAdmissionHistoryRecord(school.districtCode, school.code)?.referenceScore || "",
  }));
}
