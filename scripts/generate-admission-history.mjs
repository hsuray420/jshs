import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsvRows } from "../lib/school-catalog.mjs";
import { enabledRegions, regionalAdmissionHistoryPath } from "./school-csv-source.mjs";

const root = process.cwd();
const metadata = JSON.parse(await readFile(resolve(root, "public/it_hs/district-metadata.json"), "utf8"));
const districtCodes = enabledRegions.map((region) => region.code);
const centralScoresPath = resolve(root, "data/admission_scores.csv");

let centralScoresByDistrict = new Map();
if (existsSync(centralScoresPath)) {
  const centralCsv = await readFile(centralScoresPath, "utf8");
  const centralRows = parseCsvRows(centralCsv);
  const centralHeaders = (centralRows[0] || []).map((h) => h.replace(/^\uFEFF/, "").trim());
  const cIndexes = new Map(centralHeaders.map((h, i) => [h, i]));
  const cAt = (row, name) => row[cIndexes.get(name)]?.trim() || "";

  // District label to code mapping
  const labelToCode = Object.fromEntries(Object.entries(metadata.districts).map(([code, d]) => [d.label, code]));
  labelToCode["中投區"] = "ct";
  labelToCode["基北區"] = "tp";
  labelToCode["桃連區"] = "taoyuan-lienchiang";
  labelToCode["竹苗區"] = "hsinchu-miaoli";
  labelToCode["高雄區"] = "kaohsiung";
  labelToCode["彰化區"] = "changhua";
  labelToCode["臺南區"] = "tainan";

  for (const row of centralRows.slice(1)) {
    if (!row.some(Boolean)) continue;
    const districtLabel = cAt(row, "就學區");
    const dCode = labelToCode[districtLabel] || districtCodes.find((c) => metadata.districts[c]?.label === districtLabel) || districtLabel;
    if (!dCode) continue;
    const list = centralScoresByDistrict.get(dCode) || [];
    list.push({
      districtCode: dCode,
      districtLabel: metadata.districts[dCode]?.label || districtLabel,
      academicYear: metadata.districts[dCode]?.academicYear || "115",
      dataStatus: metadata.districts[dCode]?.dataStatus || "available",
      sourceName: cAt(row, "資料性質") || "非官方整理",
      sourceUrl: "",
      code: cAt(row, "學校代碼"),
      name: cAt(row, "學校名稱"),
      program: cAt(row, "學制分類"),
      city: cAt(row, "縣市"),
      area: cAt(row, "區"),
      departmentsRaw: cAt(row, "科系與名額"),
      referenceScore: cAt(row, "最低錄取分數"),
      scoreYear: cAt(row, "分數年度"),
      sourceNote: cAt(row, "分數來源備註"),
      sourceType: "community",
      sourceId: `history-community-${dCode}-115`,
    });
    centralScoresByDistrict.set(dCode, list);
  }
}

const districtEntries = await Promise.all(districtCodes.map(async (districtCode) => {
  // 1. Prefer central canonical CSV if it has records for this district
  const centralList = centralScoresByDistrict.get(districtCode);
  if (centralList && centralList.length > 0) {
    return centralList.filter((school) => school.code && school.name && school.referenceScore);
  }

  // 2. Fall back to regional CSV file
  const district = metadata.districts[districtCode];
  const csv = await readFile(regionalAdmissionHistoryPath(districtCode), "utf8");
  const rows = parseCsvRows(csv);
  const headers = (rows[0] || []).map((header) => header.replace(/^\uFEFF/, "").trim());
  const indexes = new Map(headers.map((header, index) => [header, index]));
  const at = (row, name) => row[indexes.get(name)]?.trim() || "";
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    districtCode,
    districtLabel: district.label,
    academicYear: district.academicYear,
    dataStatus: district.dataStatus,
    sourceName: "非官方整理",
    sourceUrl: "",
    code: at(row, "學校代碼"),
    name: at(row, "學校名稱"),
    program: at(row, "學制分類"),
    city: at(row, "縣市"),
    area: at(row, "區"),
    departmentsRaw: at(row, "科系與名額"),
    referenceScore: at(row, "最低錄取分數"),
    scoreYear: at(row, "分數年度"),
    sourceNote: at(row, "分數來源備註"),
    sourceType: "community",
    sourceId: `history-community-${districtCode}-115`,
  })).filter((school) => school.code && school.name && school.referenceScore);
}));

const schools = districtEntries.flat();
await writeFile(
  resolve(root, "public/it_hs/admission-history.json"),
  `${JSON.stringify({ version: metadata.version, updatedAt: metadata.updatedAt, sourceType: "community", schools })}\n`,
  "utf8",
);
const records = schools.map((school, index) => ({
  id: `${school.districtCode}-${school.code}-${school.scoreYear || school.academicYear}-${index + 1}`,
  district: school.districtCode,
  schoolCode: school.code,
  schoolName: school.name,
  programCode: school.program || "unclassified",
  programName: school.program || "未標示",
  schoolYear: school.scoreYear || school.academicYear,
  recordType: "admission_reference",
  metricType: "community_reference",
  scoreValue: school.referenceScore,
  scoreLabel: "社群整理的歷年參考分數",
  sourceType: "community",
  sourceId: school.sourceId,
  sourceTitle: school.sourceName,
  sourceUrl: school.sourceUrl,
  verifiedAt: "",
  retrievedAt: metadata.updatedAt,
  dataSchoolYear: school.scoreYear || school.academicYear,
  yearStatus: "current",
  status: "pending_verification",
  notes: school.sourceNote || "非官方社群參考，不能用作當年度錄取預測。",
}));
await writeFile(
  resolve(root, "public/it_hs/historical-records.json"),
  `${JSON.stringify({ version: metadata.version, updatedAt: metadata.updatedAt, records })}\n`,
  "utf8",
);
console.log(`Generated non-official admission history: ${schools.length} records.`);
