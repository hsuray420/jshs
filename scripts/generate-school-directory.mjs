import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { toSchoolRecords } from "../lib/school-catalog.mjs";
import { classifyHistoricalSource } from "../lib/school-history.mjs";

const root = process.cwd();
const metadata = JSON.parse(await readFile(resolve(root, "public/it_hs/district-metadata.json"), "utf8"));

const csvFiles = {
  ct: "ct/schools.csv",
  tp: "tp/schools_tp.csv",
  ilan: "ilan/schools.csv",
  "taoyuan-lienchiang": "taoyuan-lienchiang/schools_tl.csv",
  "hsinchu-miaoli": "hsinchu-miaoli/schools.csv",
  changhua: "changhua/schools.csv",
  yunlin: "yunlin/schools.csv",
  chiayi: "chiayi/schools.csv",
  tainan: "tainan/schools.csv",
  kaohsiung: "kaohsiung/schools.csv",
  pingtung: "pingtung/schools.csv",
  hualien: "hualien/schools.csv",
  taitung: "taitung/schools.csv",
  penghu: "penghu/schools.csv",
  kinmen: "kinmen/schools.csv",
};

const groupRules = [
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

const groupsFor = (departmentsRaw) => groupRules
  .filter(([, keywords]) => keywords.some((keyword) => departmentsRaw.includes(keyword)))
  .map(([group]) => group);

const districtEntries = await Promise.all(Object.entries(csvFiles).map(async ([districtCode, relativePath]) => {
  const district = metadata.districts[districtCode];
  const csv = await readFile(resolve(root, `public/it_hs/${relativePath}`), "utf8");
  return toSchoolRecords(csv).map((school) => ({
    districtCode,
    districtLabel: district.label,
    academicYear: district.academicYear,
    dataStatus: district.dataStatus,
    sourceName: district.sourceName,
    sourceUrl: district.sourceUrl,
    code: school.code,
    name: school.name,
    ownership: school.ownership,
    program: school.program,
    city: school.city,
    area: school.area,
    address: school.address,
    website: school.website,
    departmentsRaw: school.departmentsRaw,
    referenceScore: school.referenceScore,
    scoreYear: school.scoreYear,
    sourceNote: school.sourceNote,
    historicalSourceType: classifyHistoricalSource(district.sourceName, school.sourceNote),
    groups: groupsFor(school.departmentsRaw),
    hasQuota: Boolean(school.quota || school.departments.some((department) => department.quota !== null)),
    hasHistoricalData: Boolean(school.referenceScore),
  }));
}));

const schools = districtEntries.flat();
const output = {
  version: metadata.version,
  updatedAt: metadata.updatedAt,
  schools,
};

await writeFile(
  resolve(root, "public/it_hs/school-directory.json"),
  `${JSON.stringify(output)}\n`,
  "utf8",
);

console.log(`Generated compact school directory: ${schools.length} records.`);
