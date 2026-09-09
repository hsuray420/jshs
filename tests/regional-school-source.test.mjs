import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseCsv } from "../lib/school-data/pipeline.mjs";
import {
  loadEnabledRegionalSchools,
  validateRegionalSchools,
  ENABLED_SCHOOL_REGIONS,
  SCHOOL_FIELD_CLASSIFICATION,
} from "../lib/school-data/regional-loader.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("enabled school regions are the seven public CSV sources", async () => {
  assert.deepEqual(ENABLED_SCHOOL_REGIONS.map((region) => region.code), [
    "ct",
    "hsinchu-miaoli",
    "taoyuan-lienchiang",
    "kaohsiung",
    "tp",
    "changhua",
    "tainan",
  ]);
  const loaded = loadEnabledRegionalSchools();
  assert.equal(loaded.regions.length, 7);
  assert.equal(loaded.rows.length, 495);
  assert.equal(loaded.schools.length, 448);
  assert.equal(new Set(loaded.schools.map((school) => school.code)).size, 448);
  assert.equal(loaded.audit.errors.length, 0);
});

test("field classification separates school identity, regional records, and source metadata", () => {
  assert.deepEqual(SCHOOL_FIELD_CLASSIFICATION.schoolLevel, ["學校代碼", "公私立", "縣市", "區"]);
  assert.ok(SCHOOL_FIELD_CLASSIFICATION.regionSpecific.includes("招生區"));
  assert.ok(SCHOOL_FIELD_CLASSIFICATION.regionSpecific.includes("科系與名額"));
  assert.ok(SCHOOL_FIELD_CLASSIFICATION.regionSpecific.includes("學校名稱"));
  assert.ok(SCHOOL_FIELD_CLASSIFICATION.sourceMetadata.includes("資料更新日期"));
});

test("regional school loader keeps every CSV value exact through generated runtime data", async () => {
  const generated = JSON.parse(await read("content/schools/generated/schools.json"));
  const byCode = new Map(generated.map((school) => [school.code, school]));
  let runtimeAdmissionRecords = 0;
  for (const school of loadEnabledRegionalSchools().schools) {
    const runtime = byCode.get(school.code);
    assert.ok(runtime, `missing generated school ${school.code}`);
    assert.equal(runtime.admissionRecords.length, school.admissionRecords.length);
    runtimeAdmissionRecords += runtime.admissionRecords.length;
    for (const [index, record] of school.admissionRecords.entries()) {
      const generatedRecord = runtime.admissionRecords[index];
      for (const [key, value] of Object.entries(record.raw)) {
        assert.equal(generatedRecord.raw[key], value, `${school.code} ${index} ${key}`);
      }
    }
  }
  assert.equal(runtimeAdmissionRecords, 495, "ROW_CONSERVATION");
});

test("high school CSV duplicate lodging header is normalized without dropping source text", () => {
  const csv = "學校代碼,學校名稱,住宿資訊,通勤資訊,住宿資訊\n001,A,宿舍文字,通勤文字,宿舍文字\n";
  const parsed = parseCsv(csv);
  assert.deepEqual(parsed.headers, ["學校代碼", "學校名稱", "住宿資訊", "通勤資訊"]);
  assert.equal(parsed.rows[0]["住宿資訊"], "宿舍文字");
});

test("school generation and public CSV route no longer depend on manual master CSV", async () => {
  const [pkg, generator, sourceConfig, csvRoute] = await Promise.all([
    read("package.json"),
    read("scripts/generate-schools.mjs"),
    read("scripts/school-csv-source.mjs"),
    read("app/api/schools.csv/route.ts"),
  ]);
  const scripts = JSON.parse(pkg).scripts;
  assert.match(scripts.build, /schools:prepare/);
  assert.match(scripts["schools:prepare"], /schools:generate/);
  assert.match(scripts["schools:prepare"], /schools:validate/);
  assert.doesNotMatch(generator, /schools_master\.csv/);
  assert.doesNotMatch(sourceConfig, /schools_master\.csv/);
  assert.doesNotMatch(csvRoute, /schools_master\.csv/);
  assert.match(generator, /loadEnabledRegionalSchools/);
  assert.match(generator, /getAllSchoolsCsv\(rows\)/);
  assert.match(csvRoute, /schools\.csv\?raw/);
});

test("duplicate school audit explains the 495 to 448 aggregation and has no school-level conflicts", async () => {
  const validation = JSON.parse(await read("content/schools/generated/validation.json"));
  assert.equal(validation.duplicateSchoolAudit.affectedSchools, 47);
  assert.equal(validation.duplicateSchoolAudit.extraRows, 47);
  assert.equal(validation.duplicateSchoolAudit.duplicateSchoolCodes.length, 47);
  assert.equal(validation.duplicateSchoolAudit.conflictFields.length, 0);
  assert.equal(validation.rowConservation.sourceCsvRows, 495);
  assert.equal(validation.rowConservation.runtimeAdmissionRecords, 495);
  assert.equal(validation.rowConservation.status, "PASS");
});

test("school-level field conflicts fail validation instead of silently selecting a row", () => {
  const rows = [
    { 學校代碼: "001", 學校名稱: "甲校", 公私立: "公立", 招生區: "甲區", 縣市: "臺北市", 區: "中正區" },
    { 學校代碼: "001", 學校名稱: "甲校", 公私立: "私立", 招生區: "乙區", 縣市: "臺北市", 區: "中正區" },
  ];
  const audit = validateRegionalSchools([
    { label: "甲區", code: "a", headers: Object.keys(rows[0]), rawHeaders: Object.keys(rows[0]), rows: [rows[0]] },
    { label: "乙區", code: "b", headers: Object.keys(rows[1]), rawHeaders: Object.keys(rows[1]), rows: [rows[1]] },
  ]);
  assert.ok(audit.errors.some((error) => error.includes("school-level conflict") && error.includes("公私立")));
});

test("generated public CSV is an exact 495-row aggregate of enabled regional CSV rows", async () => {
  const publicCsv = parseCsv(await read("public/data/schools.csv"));
  const loaded = loadEnabledRegionalSchools();
  assert.equal(publicCsv.rows.length, loaded.rows.length);
  for (const [index, row] of loaded.rows.entries()) {
    for (const column of publicCsv.headers) {
      assert.equal(publicCsv.rows[index][column], row[column], `${index + 2} ${column}`);
    }
  }
});
