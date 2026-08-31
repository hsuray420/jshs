import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveDistrictCapability,
  hashSourceContent,
  validateAdmissionHistoryRecords,
  validateOfficialInformationRecords,
  validateSourceRegistry,
  validateVocationalGroupRecords,
} from "../scripts/data-foundation.mjs";

const source = Object.freeze({
  id: "official-tp-115-guide",
  dataset: "admission_rules",
  district: "tp",
  schoolYear: "115",
  issuer: "基北區免試入學委員會",
  sourceUrl: "https://example.edu.tw/115-guide.pdf",
  sourceType: "official_original",
  ingestionMode: "MANUAL_VERIFIED",
  status: "VERIFIED",
  retrievedAt: "2026-08-20",
  lastCheckedAt: "2026-08-20",
  verifiedAt: "2026-08-20",
  snapshot: { contentHash: "sha256:known", contentType: "application/pdf", byteSize: 1 },
});

test("115 reference may be shown for 116 only as previous_year_reference", () => {
  const records = [{
    id: "guide-tp-116",
    title: "116 學年度基北區免試入學參考",
    issuer: "基北區免試入學委員會",
    district: "tp",
    schoolYear: "116",
    dataSchoolYear: "115",
    yearStatus: "previous_year_reference",
    publishDate: "",
    updatedAt: "2026-08-20",
    type: "guide",
    sourceId: source.id,
    sourceUrl: source.sourceUrl,
    sourceType: "official_original",
    summary: "115 學年度參考資料，不是 116 正式公告。",
  }];
  assert.deepEqual(validateOfficialInformationRecords(records, [source], ["tp"]).fatalIssues, []);
});

test("a 115 record cannot masquerade as official 116 data", () => {
  const result = validateOfficialInformationRecords([{
    id: "guide-tp-116",
    title: "116 學年度基北區免試入學簡章",
    issuer: "基北區免試入學委員會",
    district: "tp",
    schoolYear: "116",
    dataSchoolYear: "115",
    yearStatus: "current",
    publishDate: "",
    updatedAt: "2026-08-20",
    type: "guide",
    sourceId: source.id,
    sourceUrl: source.sourceUrl,
    sourceType: "official_original",
    summary: "incorrect",
  }], [source], ["tp"]);
  assert.match(result.fatalIssues.join("\n"), /YEAR_MASQUERADE/);
});

test("official information without a registered source is rejected", () => {
  const result = validateOfficialInformationRecords([{
    id: "announcement-tp-115-1", title: "公告", issuer: "委員會", district: "tp", schoolYear: "115", dataSchoolYear: "115", yearStatus: "current", publishDate: "2026-01-01", updatedAt: "2026-01-01", type: "announcement", sourceId: "missing", sourceUrl: "", sourceType: "official_original", summary: "",
  }], [source], ["tp"]);
  assert.match(result.fatalIssues.join("\n"), /MISSING_SOURCE/);
});

test("community history stays outside official history and unknown schools are rejected", () => {
  const validCommunity = [{
    id: "community-tp-1", district: "tp", schoolCode: "100", schoolName: "測試高中", programCode: "100-資訊科", programName: "資訊科", schoolYear: "115", dataSchoolYear: "115", recordType: "reference_score", metricType: "community_reference", scoreValue: "20", scoreLabel: "社群參考", sourceType: "community", sourceId: "community-tp", sourceTitle: "社群整理", sourceUrl: "", verifiedAt: "", retrievedAt: "2026-08-20", notes: "待驗證", status: "pending_verification",
  }];
  const registry = [{ ...source, id: "community-tp", dataset: "admission_history", sourceType: "community", status: "PARTIAL", snapshot: null }];
  assert.deepEqual(validateAdmissionHistoryRecords(validCommunity, registry, new Set(["tp:100"])).fatalIssues, []);
  const invalid = validateAdmissionHistoryRecords([{ ...validCommunity[0], schoolCode: "404" }], registry, new Set(["tp:100"]));
  assert.match(invalid.fatalIssues.join("\n"), /UNKNOWN_SCHOOL/);
});

test("official history requires an official source URL and cannot use community metric", () => {
  const result = validateAdmissionHistoryRecords([{
    id: "official-tp-1", district: "tp", schoolCode: "100", schoolName: "測試高中", programCode: "100-資訊科", programName: "資訊科", schoolYear: "115", dataSchoolYear: "115", recordType: "minimum_score", metricType: "community_reference", scoreValue: "20", scoreLabel: "錄取門檻", sourceType: "official", sourceId: source.id, sourceTitle: "官方", sourceUrl: "", verifiedAt: "2026-08-20", retrievedAt: "2026-08-20", notes: "", status: "verified",
  }], [source], new Set(["tp:100"]));
  assert.match(result.fatalIssues.join("\n"), /OFFICIAL_HISTORY_SOURCE_REQUIRED/);
  assert.match(result.fatalIssues.join("\n"), /OFFICIAL_METRIC_REQUIRED/);
});

test("source snapshots produce deterministic hashes and flag changed content", () => {
  assert.equal(hashSourceContent("official content"), hashSourceContent("official content"));
  const changed = validateSourceRegistry([{ ...source, snapshot: { ...source.snapshot, contentHash: hashSourceContent("new") } }], [{ ...source, snapshot: { ...source.snapshot, contentHash: hashSourceContent("old") } }], ["tp"]);
  assert.match(changed.warnings.join("\n"), /SOURCE_HASH_CHANGED/);
});

test("formal vocational departments must map to a real program and a registered source", () => {
  const result = validateVocationalGroupRecords([{
    id: "electronics", name: "電子科", groupId: "electrical-electronic", groupName: "電機與電子群", sourceId: source.id, sourceType: "official_original", status: "verified",
  }], [source], new Set(["電子科"]));
  assert.deepEqual(result.fatalIssues, []);
  const invalid = validateVocationalGroupRecords([{ id: "unknown", name: "虛構科", groupId: "other", groupName: "其他", sourceId: source.id, sourceType: "official_original", status: "verified" }], [source], new Set(["電子科"]));
  assert.match(invalid.fatalIssues.join("\n"), /UNKNOWN_PROGRAM/);
});

test("capabilities are derived per dataset instead of blanket verified", () => {
  const capability = deriveDistrictCapability("tp", {
    sourceRegistry: [source, { ...source, id: "history-community", dataset: "admission_history", sourceType: "community", status: "PARTIAL", snapshot: null }],
    schoolDirectoryStatus: "VERIFIED",
    mapStatus: "PARTIAL",
    plannerStatus: "AVAILABLE",
  });
  assert.equal(capability.admissionRules, "VERIFIED");
  assert.equal(capability.admissionHistory, "PARTIAL");
  assert.notEqual(capability.admissionHistory, "VERIFIED");
});
