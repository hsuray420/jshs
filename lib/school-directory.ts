import changhuaCsv from "../public/it_hs/changhua/schools.csv?raw";
import chiayiCsv from "../public/it_hs/chiayi/schools.csv?raw";
import ctCsv from "../public/it_hs/ct/schools.csv?raw";
import hsinchuMiaoliCsv from "../public/it_hs/hsinchu-miaoli/schools.csv?raw";
import hualienCsv from "../public/it_hs/hualien/schools.csv?raw";
import ilanCsv from "../public/it_hs/ilan/schools.csv?raw";
import kaohsiungCsv from "../public/it_hs/kaohsiung/schools.csv?raw";
import kinmenCsv from "../public/it_hs/kinmen/schools.csv?raw";
import penghuCsv from "../public/it_hs/penghu/schools.csv?raw";
import pingtungCsv from "../public/it_hs/pingtung/schools.csv?raw";
import tainanCsv from "../public/it_hs/tainan/schools.csv?raw";
import taitungCsv from "../public/it_hs/taitung/schools.csv?raw";
import taoyuanLienchiangCsv from "../public/it_hs/taoyuan-lienchiang/schools_tl.csv?raw";
import tpCsv from "../public/it_hs/tp/schools_tp.csv?raw";
import yunlinCsv from "../public/it_hs/yunlin/schools.csv?raw";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { toSchoolRecords, type SchoolDepartment } from "./school-catalog.mjs";

export type SchoolDirectoryRecord = Readonly<{
  districtCode: string;
  districtLabel: string;
  academicYear: string;
  dataStatus: string;
  updatedAt: string;
  sourceName: string;
  sourceUrl: string;
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
  groups: readonly string[];
  quota: string;
  referenceScore: string;
  scoreYear: string;
  sourceNote: string;
  specialPrograms: string;
  hasQuota: boolean;
  hasHistoricalData: boolean;
}>;

const csvByDistrict: Readonly<Record<string, string>> = {
  ct: ctCsv,
  tp: tpCsv,
  ilan: ilanCsv,
  "taoyuan-lienchiang": taoyuanLienchiangCsv,
  "hsinchu-miaoli": hsinchuMiaoliCsv,
  changhua: changhuaCsv,
  yunlin: yunlinCsv,
  chiayi: chiayiCsv,
  tainan: tainanCsv,
  kaohsiung: kaohsiungCsv,
  pingtung: pingtungCsv,
  hualien: hualienCsv,
  taitung: taitungCsv,
  penghu: penghuCsv,
  kinmen: kinmenCsv,
};

const groupRules: readonly [string, readonly string[]][] = [
  ["機械群", ["機械", "模具", "板金", "鑄造"]],
  ["動力機械群", ["汽車", "車輛", "動力機械"]],
  ["電機與電子群", ["電機", "電子", "資訊", "控制", "冷凍空調"]],
  ["化工群", ["化工", "製藥"]],
  ["土木與建築群", ["土木", "建築", "營造", "測量"]],
  ["設計群", ["設計", "美工", "室內空間"]],
  ["工程與管理群", ["工程管理"]],
  ["商業與管理群", ["商業", "會計", "資料處理", "電子商務", "國際貿易"]],
  ["外語群", ["應用英語", "應用日語", "外語"]],
  ["餐旅群", ["餐飲", "觀光", "旅館"]],
  ["農業群", ["農業", "園藝", "森林", "畜產", "農場"]],
  ["食品群", ["食品"]],
  ["家事群", ["家政", "幼兒保育", "美容", "服裝"]],
  ["海事群", ["水產", "海事", "漁"]],
  ["藝術群", ["藝術", "表演", "音樂"]],
];

const districtRecords = Object.entries(csvByDistrict).flatMap(([districtCode, csv]) => {
  const district = districtMetadata.districts[districtCode as keyof typeof districtMetadata.districts];
  return (toSchoolRecords(csv) as readonly Omit<SchoolDirectoryRecord, "districtCode" | "districtLabel" | "academicYear" | "dataStatus" | "updatedAt" | "sourceName" | "sourceUrl" | "groups" | "hasQuota" | "hasHistoricalData">[]).map((school) => {
    const groups = groupRules
      .filter(([, keywords]) => keywords.some((keyword) => school.departmentsRaw.includes(keyword)))
      .map(([group]) => group);
    return Object.freeze({
      ...school,
      districtCode,
      districtLabel: district.label,
      academicYear: district.academicYear,
      dataStatus: district.dataStatus,
      updatedAt: district.updatedAt,
      sourceName: district.sourceName,
      sourceUrl: district.sourceUrl,
      groups,
      hasQuota: Boolean(school.quota || school.departments.some((department) => department.quota !== null)),
      hasHistoricalData: Boolean(school.referenceScore),
    });
  });
});

export const schoolDirectory: readonly SchoolDirectoryRecord[] = Object.freeze(districtRecords);

export const schoolDistrictOptions = Object.freeze(
  Object.entries(districtMetadata.districts).map(([code, district]) => ({ code, label: district.label })),
);

export function getSchoolDirectoryRecord(districtCode: string, code: string): SchoolDirectoryRecord | undefined {
  return schoolDirectory.find((school) => school.districtCode === districtCode && school.code === code);
}

export function getRelatedSchools(school: SchoolDirectoryRecord, limit = 4): readonly SchoolDirectoryRecord[] {
  return schoolDirectory
    .filter((candidate) => candidate.code !== school.code || candidate.districtCode !== school.districtCode)
    .map((candidate) => ({
      candidate,
      relevance:
        Number(candidate.districtCode === school.districtCode) * 5
        + Number(candidate.city === school.city) * 4
        + Number(candidate.area === school.area) * 3
        + Number(candidate.program === school.program) * 2
        + Number(candidate.ownership === school.ownership),
    }))
    .sort((left, right) => right.relevance - left.relevance || left.candidate.name.localeCompare(right.candidate.name, "zh-TW"))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
