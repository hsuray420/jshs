import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCsvRows } from "../lib/school-catalog.mjs";
import { validateAdmissionHistoryRecords, validateOfficialInformationRecords, validateSourceRegistry, validateVocationalGroupRecords } from "./data-foundation.mjs";

const root = process.cwd();
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const metadata = await readJson("public/it_hs/district-metadata.json");
const guides = await readJson("data/admission-guides.json");
const registry = await readJson("data/source-registry.json");
const history = await readJson("public/it_hs/historical-records.json");
const groups = await readJson("data/vocational-groups.json");
const districtCodes = Object.keys(metadata.districts);
const schoolKeys = new Set();
const knownPrograms = new Set();
for (const district of districtCodes) {
  const csv = await readFile(resolve(root, `public/it_hs/${district}/schools${district === "tp" ? "_tp" : district === "taoyuan-lienchiang" ? "_tl" : ""}.csv`), "utf8");
  const rows = parseCsvRows(csv); const headers = rows[0].map((item) => item.replace(/^\uFEFF/, "").trim());
  const codeIndex = headers.indexOf("學校代碼"); const departmentsIndex = headers.indexOf("科系與名額");
  for (const row of rows.slice(1)) { if (row[codeIndex]) schoolKeys.add(`${district}:${row[codeIndex].trim()}`); for (const department of (row[departmentsIndex] || "").split("；")) { const name = department.split(":")[0]?.trim(); if (name) knownPrograms.add(name); } }
}
const officialInformation = guides.guides.map((guide) => ({ id: `guide-${guide.code}-115`, title: `${guide.label}免試入學簡章`, issuer: metadata.districts[guide.code].sourceName, district: guide.code, schoolYear: "115", dataSchoolYear: "115", yearStatus: "current", publishDate: "", updatedAt: guides.updatedAt, type: "guide", sourceId: `guide-${guide.code}-115`, sourceUrl: guide.file, sourceType: "official_original", summary: "official guide" }));
const results = [
  validateSourceRegistry(registry.sources, [], districtCodes),
  validateOfficialInformationRecords(officialInformation, registry.sources, districtCodes),
  validateAdmissionHistoryRecords(history.records, registry.sources, schoolKeys),
  validateVocationalGroupRecords(groups.departments, registry.sources, knownPrograms),
];
const fatalIssues = results.flatMap((result) => result.fatalIssues);
const warnings = results.flatMap((result) => result.warnings);
if (warnings.length) console.warn(`Data foundation warnings:\n${warnings.join("\n")}`);
if (fatalIssues.length) { console.error(`Data foundation validation failed:\n${fatalIssues.join("\n")}`); process.exitCode = 1; } else console.log(`Data foundation validation passed: ${history.records.length} history records, ${groups.departments.length} vocational department mappings, ${registry.sources.length} sources.`);
