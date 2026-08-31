import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCsvRows } from "../lib/school-catalog.mjs";

const root = process.cwd();
const metadata = JSON.parse(await readFile(resolve(root, "public/it_hs/district-metadata.json"), "utf8"));
const districtCodes = Object.keys(metadata.districts);

const districtEntries = await Promise.all(districtCodes.map(async (districtCode) => {
  const district = metadata.districts[districtCode];
  const csv = await readFile(resolve(root, `public/it_hs/${districtCode}/admission-history.csv`), "utf8");
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
