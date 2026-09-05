import { getAdmissionHistoryRecord } from '@/lib/admission-history';
import { getSchools, schoolMetadata } from '@/lib/school-repository';
import { districtCode } from '@/lib/school-districts';

export function getPlannerSchools() {
  return getSchools().flatMap((school) => school.admissionRecords.map((record) => {
    const district = districtCode(record.sourceDistrict);
    const history = getAdmissionHistoryRecord(district, school.code);
    return {
      district, code: school.code, name: school.name, department: record.departmentRaw,
      city: school.city, program: school.schoolType, ownership: school.ownership, groups: [] as string[], area: school.area,
      academicYear: school.academicYear, dataStatus: 'available',
      hasQuota: Boolean(record.admissionQuota || record.brochureQuota), hasHistoricalData: Boolean(history),
      sourceName: 'schools_master.csv / school_admission_records.csv', updatedAt: schoolMetadata.sourceUpdatedAt,
      referenceScore: history?.referenceScore || '',
    };
  }));
}
