import data from '../content/schools/generated/schools.json';
import metadata from '../content/schools/generated/metadata.json';
import { searchSchoolRecords } from './school-data/pipeline.mjs';
export type InformationStatus = 'confirmed' | 'not_offered' | 'not_published' | 'not_applicable' | 'unclear';
export type SourceLink = {url:string;label:string};
export type SchoolDepartment = {name:string;quota:number|null;gender:string;raw:string};
export type AdmissionRecord = {id:string;sourceDistrict:string;admissionDistrict:string;admissionOfferingType:string;departmentRaw:string;departments:SchoolDepartment[];brochureQuota:string;admissionQuota:string;raw:Record<string,string>};
export type SchoolSourceKey = 'address'|'transport'|'commute'|'lodging'|'course'|'project'|'life';
export type School = {code:string;name:string;ownership:string;admissionDistrict:string;admissionDistricts:string[];schoolType:string;gender:string;city:string;area:string;address:string;website:string;phone:string;departmentRaw:string;departments:SchoolDepartment[];brochureQuota:string;admissionQuota:string;features:string;courseDirection:string;project:string;transport:string;commute:string;lodging:string;mapUrl:string;sources:Record<SchoolSourceKey,SourceLink[]>;sourceMetadata:Record<string,string>;lodgingStatus:InformationStatus;transportStatus:InformationStatus;hasSchoolBus:boolean;hasPublicTransport:boolean;academicYear:string;raw:Record<string,string>;admissionRecords:AdmissionRecord[]; /** legacy admission-tool compatibility only; entity identity remains code */ districtCode?:string};
/** The discovery view deliberately excludes raw rows and source ledgers. */
export type SchoolSummary = Pick<School, 'code'|'name'|'ownership'|'admissionDistricts'|'schoolType'|'gender'|'city'|'area'|'departmentRaw'|'departments'|'admissionQuota'|'features'|'courseDirection'|'project'|'lodgingStatus'|'transportStatus'|'hasSchoolBus'|'hasPublicTransport'> & {schoolTypes?:string[];genders?:string[]};
export type SchoolEntity = School;
export type SchoolSearchFilters = {city?:string;area?:string;ownership?:string;schoolType?:string;gender?:string;admissionDistrict?:string;department?:string;lodging?:boolean;schoolBus?:boolean;publicTransport?:boolean};
const schools = data as School[];
const byCode = new Map(schools.map(s=>[s.code,s]));
export const getSchools = (): School[] => schools;
export const getAllSchools = getSchools;
export const getRegions = () => schoolMetadata.enabledRegions || [];
export const getSchoolsByRegion = (regionCode:string): School[] => {
  const region = getRegions().find((item: {code:string;label:string}) => item.code === regionCode || item.label === regionCode);
  const label = region?.label || regionCode;
  return schools.filter(s=>s.admissionRecords.some(record=>record.sourceDistrict === label) || s.admissionDistricts.some(district=>district.startsWith(label)));
};
export const getSchoolSummaries = (): SchoolSummary[] => schools.map(toSummary);
export const getSchoolByCode = (code:string):School|undefined => byCode.get(code);
export const searchSchools = (query='',filters:SchoolSearchFilters={}):School[] => searchSchoolRecords(schools,query,filters);
export const schoolMetadata = metadata;
export const schoolFilters = {cities:[...new Set(schools.map(s=>s.city))].sort(),districts:[...new Set(schools.flatMap(s=>s.admissionDistricts))].sort(),departments:[...new Set(schools.flatMap(s=>s.departments.map(d=>d.name)))].sort(),schoolTypes:[...new Set(schools.flatMap(s=>s.admissionRecords.map(record=>record.raw['學制分類']).filter(Boolean)))].sort(),genders:[...new Set(schools.flatMap(s=>s.admissionRecords.map(record=>record.raw['男女校']).filter(Boolean)))].sort(),ownerships:['公立','私立']};
export const schoolRepository = {getRegions,getSchools,getAllSchools,getSchoolsByRegion,getSchoolSummaries,getSchoolByCode,searchSchools};
export { renderField } from './school-data/pipeline.mjs';

function toSummary(school: School): SchoolSummary {
  return {
    code: school.code,
    name: school.name,
    ownership: school.ownership,
    admissionDistricts: school.admissionDistricts,
    schoolType: school.schoolType,
    gender: school.gender,
    city: school.city,
    area: school.area,
    departmentRaw: school.departmentRaw,
    departments: school.departments,
    admissionQuota: school.admissionQuota,
    schoolTypes: [...new Set(school.admissionRecords.map(record=>record.raw['學制分類']).filter(Boolean))],
    genders: [...new Set(school.admissionRecords.map(record=>record.raw['男女校']).filter(Boolean))],
    features: school.features,
    courseDirection: school.courseDirection,
    project: school.project,
    lodgingStatus: school.lodgingStatus,
    transportStatus: school.transportStatus,
    hasSchoolBus: school.hasSchoolBus,
    hasPublicTransport: school.hasPublicTransport,
  };
}
