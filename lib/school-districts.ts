import metadata from '../public/it_hs/district-metadata.json';
import type { School } from './school-repository';

// Admission tools retain their district identifiers; school identity always comes from the master.
export const schoolDistrictOptions = Object.entries(metadata.districts).map(([code, district]) => ({ code, label: district.label }));
export function districtLabel(code: string): string {
  return schoolDistrictOptions.find(district => district.code === code)?.label || code;
}
export function districtCode(label: string): string {
  return schoolDistrictOptions.find(district => district.label === label || district.label.replace(/區$/, '') === label.replace(/區$/, ''))?.code || label;
}
export function schoolMatchesDistrict(school: School, district: string): boolean {
  return school.admissionDistricts.some(label => districtCode(label) === districtCode(district));
}
