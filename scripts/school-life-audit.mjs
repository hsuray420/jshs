#!/usr/bin/env node

/**
 * Generates the master list and audit gate for school-life research.
 * It deliberately never infers transport, lodging, sources, or addresses.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { regionalCsvPath } from "./school-csv-source.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkedAt = new Date().toISOString().slice(0, 10);
const districts = [
  ["tp", "基北區", "tp/schools_tp.csv"],
  ["taoyuan-lienchiang", "桃連區", "taoyuan-lienchiang/schools_tl.csv"],
  ["hsinchu-miaoli", "竹苗區", "hsinchu-miaoli/schools.csv"],
  ["ct", "中投區", "ct/schools.csv"],
  ["changhua", "彰化區", "changhua/schools.csv"],
  ["yunlin", "雲林區", "yunlin/schools.csv"],
  ["chiayi", "嘉義區", "chiayi/schools.csv"],
  ["tainan", "臺南區", "tainan/schools.csv"],
  ["kaohsiung", "高雄區", "kaohsiung/schools.csv"],
  ["pingtung", "屏東區", "pingtung/schools.csv"],
  ["ilan", "宜蘭區", "ilan/schools.csv"],
  ["hualien", "花蓮區", "hualien/schools.csv"],
  ["taitung", "臺東區", "taitung/schools.csv"],
  ["penghu", "澎湖區", "penghu/schools.csv"],
  ["kinmen", "金門區", "kinmen/schools.csv"],
];
const requiredFields = ["transport", "commute_info", "public_transport", "school_bus", "lodging", "life_info"];
const forbidden = ["依學校公告", "請洽學校", "請參閱官網", "詳細資訊請洽", "依最新公告", "交通便利", "生活機能良好"];

function parseCsv(source) {
  const rows = []; let row = []; let value = ""; let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"') { if (quoted && source[i + 1] === '"') { value += char; i += 1; } else quoted = !quoted; }
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && source[i + 1] === "\n") i += 1; if (value || row.length) rows.push([...row, value]); row = []; value = ""; }
    else value += char;
  }
  if (value || row.length) rows.push([...row, value]);
  const [header, ...data] = rows;
  const names = header.map((name) => name.replace(/^\uFEFF/, "").trim());
  return data.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(names.map((name, index) => [name, row[index]?.trim() || ""])));
}
function csv(value) { const text = String(value ?? ""); return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function key(row) { return `${row.district}\u0000${row.school_code}`; }
function sourceOk(record, type) { return record?.sources?.some((source) => source.type === type && source.url && source.checked_at); }
function isComplete(record) {
  return record?.status === "COMPLETE" && requiredFields.every((field) => String(record[field] || "").trim())
    && sourceOk(record, "official") && sourceOk(record, "google_maps") && /^\d{4}-\d{2}-\d{2}$/.test(record.checked_at || "");
}
function invalidText(record) { return requiredFields.filter((field) => forbidden.some((term) => String(record[field] || "").includes(term))); }
// A checked record may use NOT_PUBLICLY_FOUND only when it records the pages
// examined and still satisfies the dated official + Google Maps evidence rule.
const allowedStatuses = new Set(["COMPLETE", "NOT_PUBLICLY_FOUND", "PREVIOUS_ACADEMIC_YEAR_REFERENCE"]);

const ledger = JSON.parse(await readFile(resolve(root, "data/school-life/records.json"), "utf8"));
if (ledger.schemaVersion !== "1.0" || !Array.isArray(ledger.records)) throw new Error("Invalid school-life ledger schema");
if (ledger.records.some((record) => !allowedStatuses.has(record.status))) throw new Error("Invalid school-life record status");
const records = new Map(ledger.records.map((record) => [key(record), record]));
const master = [];
for (const [district, label, file] of districts) {
  const rows = parseCsv(await readFile(regionalCsvPath(district), "utf8"));
  for (const row of rows) master.push({
    district, district_label: label, school_code: row["學校代碼"], school_name: row["學校名稱"],
    admission_track: row["招生區"], program: row["學制分類"], address: row["地址"], website: row["官網"],
  });
}
const masterKeys = new Set(master.map(key));
const orphanRecords = ledger.records.filter((record) => !masterKeys.has(key(record)));
const duplicateValues = new Map();
for (const record of ledger.records) for (const field of ["transport", "lodging", "life_info"]) {
  const value = String(record[field] || "").trim(); if (!value) continue;
  const entries = duplicateValues.get(`${field}\u0000${value}`) || []; entries.push(record); duplicateValues.set(`${field}\u0000${value}`, entries);
}
const duplicateWarnings = [...duplicateValues.entries()].filter(([, entries]) => entries.length > 1);
const coverage = districts.map(([district, label]) => {
  const schools = master.filter((row) => row.district === district);
  const complete = schools.filter((school) => isComplete(records.get(key(school)))).length;
  return { district, label, expected: schools.length, complete, missing: schools.length - complete };
});
const completed = coverage.reduce((total, row) => total + row.complete, 0);
const missing = master.filter((school) => !isComplete(records.get(key(school))));
const sourceStats = ledger.records.reduce((stats, record) => ({ official: stats.official + Number(sourceOk(record, "official")), maps: stats.maps + Number(sourceOk(record, "google_maps")) }), { official: 0, maps: 0 });
const qa = { empty: requiredFields.reduce((count, field) => count + master.filter((school) => !String(records.get(key(school))?.[field] || "").trim()).length, 0), vague: ledger.records.flatMap((record) => invalidText(record).map((field) => `${record.district}:${record.school_code}:${field}`)), orphanRecords };
await mkdir(resolve(root, "data/school-life"), { recursive: true });
const masterHeader = ["district", "district_label", "school_code", "school_name", "admission_track", "program", "address", "website"];
await writeFile(resolve(root, "data/school-life/MASTER_LIST.csv"), `\ufeff${masterHeader.join(",")}\n${master.map((row) => masterHeader.map((field) => csv(row[field])).join(",")).join("\n")}\n`);
const lines = [
  "# SCHOOL LIFE DATA AUDIT", "", "## Summary", "", `- Audit date: ${checkedAt}`, `- Total schools: ${master.length}`, `- Completed: ${completed}`, `- Uncompleted: ${master.length - completed}`, `- Coverage: ${((completed / master.length) * 100).toFixed(2)}%`, "", "## District Coverage", "",
  "| District | expected_schools | completed_schools | missing_schools | coverage_percent |", "| --- | ---: | ---: | ---: | ---: |",
  ...coverage.map((row) => `| ${row.label} (${row.district}) | ${row.expected} | ${row.complete} | ${row.missing} | ${((row.complete / row.expected) * 100).toFixed(2)}% |`),
  "", "## Missing", "", ...(missing.length ? missing.map((school) => `- ${school.district_label}｜${school.school_code}｜${school.school_name}`) : ["- None"]),
  "", "## Source QA", "", `- Official sources: ${sourceStats.official}`, `- Google Maps sources: ${sourceStats.maps}`, `- Missing official sources: ${master.length - sourceStats.official}`, `- Missing Google Maps sources: ${master.length - sourceStats.maps}`, `- Orphaned research records: ${orphanRecords.length}`,
  "", "## Data QA", "", `- Required life fields missing: ${qa.empty}`, `- Vague placeholder violations: ${qa.vague.length}`, `- Duplicate warnings: ${duplicateWarnings.length}`, `- Master-list addresses currently blank: ${master.filter((row) => !row.address).length}`, "",
  "## Completion Gate", "", `- 15/15 districts complete: ${coverage.every((row) => row.complete === row.expected) ? "PASS" : "FAIL"}`, `- 100% schools checked: ${completed === master.length ? "PASS" : "FAIL"}`, `- 100% Google Maps checked: ${sourceStats.maps === master.length ? "PASS" : "FAIL"}`, `- 100% official source checked: ${sourceStats.official === master.length ? "PASS" : "FAIL"}`, `- 0 empty required life fields: ${qa.empty === 0 ? "PASS" : "FAIL"}`, `- 0 vague placeholders: ${qa.vague.length === 0 ? "PASS" : "FAIL"}`,
];
await writeFile(resolve(root, "SCHOOL_LIFE_DATA_AUDIT.md"), `${lines.join("\n")}\n`);
console.log(`School-life audit: ${completed}/${master.length} complete; ${coverage.filter((row) => row.complete === row.expected).length}/15 districts complete.`);
if (completed !== master.length || qa.empty || qa.vague.length || orphanRecords.length) process.exitCode = 1;
