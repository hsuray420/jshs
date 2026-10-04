import test from "node:test";
import assert from "node:assert/strict";

import {
  SCHOOL_ADMIN_FIELDS,
  editableCsvColumns,
  mapDomainUpdatesToCsv,
} from "../lib/school-admin-fields.mjs";
import {
  buildSchoolCommitMessage,
  createSchoolFieldDiff,
  detectSchoolFieldConflicts,
  summarizeGitHubWorkflowRun,
} from "../lib/school-admin-workflow.mjs";
import { SCHOOL_COLUMNS } from "../lib/school-data/pipeline.mjs";
import { updateCanonicalSchoolCsv } from "../lib/school-admin-csv.mjs";

const escape = (value) => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
const record = (overrides = {}) => Object.fromEntries(SCHOOL_COLUMNS.map((column) => [column, overrides[column] || ""]));
const line = (values) => SCHOOL_COLUMNS.map((column) => escape(values[column] || "")).join(",");

test("central field mapping keeps domain fields independent from CSV column names", () => {
  assert.equal(SCHOOL_ADMIN_FIELDS.schoolName.csvColumn, "學校名稱");
  assert.equal(SCHOOL_ADMIN_FIELDS.address.csvColumn, "地址");
  assert.equal(SCHOOL_ADMIN_FIELDS.admissionArea.editable, false);
  assert.ok(editableCsvColumns().includes("電話"));
  assert.deepEqual(mapDomainUpdatesToCsv({ address: "新地址", website: "https://school.example" }), {
    地址: "新地址",
    官網: "https://school.example",
  });
  assert.throws(() => mapDomainUpdatesToCsv({ admissionArea: "其他區" }), /not editable/);
  assert.throws(() => mapDomainUpdatesToCsv({ unknown: "x" }), /unknown domain field/);
});

test("CSV update changes only the target record bytes and retains line endings", () => {
  const first = record({ 學校代碼: "193302", 學校名稱: "甲校", 公私立: "公立", 招生區: "中投區", 學制分類: "高中", 男女校: "男女校", 縣市: "臺中市", 地址: "舊址" });
  const second = record({ 學校代碼: "193303", 學校名稱: "乙校", 公私立: "私立", 招生區: "中投區", 學制分類: "高職", 男女校: "男女校", 縣市: "臺中市", 地址: "未修改", 官網: "https://example.com/?a=1,b=2" });
  const untouched = line(second).replace("乙校", '"乙校"');
  const source = `\ufeff${SCHOOL_COLUMNS.join(",")}\r\n${line(first)}\r\n${untouched}\r\n`;
  const result = updateCanonicalSchoolCsv({ csvText: source, schoolCode: "193302", updates: { 地址: "新址" } });

  assert.match(result.csvText, /\r\n/);
  assert.ok(result.csvText.endsWith(`${untouched}\r\n`), "untouched row must remain byte-for-byte identical");
  assert.equal(result.rowCount, 2);
  assert.deepEqual(result.changedFields, ["地址"]);
});

test("field-level concurrency rebases unrelated changes and reports true conflicts with three values", () => {
  const base = { 地址: "A", 電話: "1" };
  const latest = { 地址: "A", 電話: "2" };
  const updates = { 地址: "B" };
  assert.deepEqual(detectSchoolFieldConflicts({ base, latest, updates }), []);

  assert.deepEqual(detectSchoolFieldConflicts({ base, latest: { 地址: "C" }, updates }), [{
    field: "地址",
    loadedValue: "A",
    latestValue: "C",
    proposedValue: "B",
  }]);
});

test("diff and commit message are readable and list only changed fields", () => {
  const diff = createSchoolFieldDiff({ base: { 地址: "舊址", 官網: "https://old.example" }, draft: { 地址: "新址", 官網: "https://new.example" } });
  assert.equal(diff.length, 2);
  assert.deepEqual(diff[0], { field: "地址", oldValue: "舊址", newValue: "新址" });
  assert.equal(buildSchoolCommitMessage({ schoolCode: "193303", schoolName: "臺中二中", fields: diff.map((item) => item.field) }), [
    "admin(schools): update 193303 臺中二中",
    "",
    "Changed:",
    "- 地址",
    "- 官網",
    "",
    "Edited via JSHS Admin",
  ].join("\n"));
});

test("deployment tracking requires a workflow run for the exact source commit", () => {
  const sha = "a".repeat(40);
  assert.deepEqual(summarizeGitHubWorkflowRun([], sha), {
    status: "not_found",
    reason: "workflow_not_found",
  });
  assert.equal(summarizeGitHubWorkflowRun([{ head_sha: "b".repeat(40), status: "completed", conclusion: "success" }], sha).status, "not_found");
  assert.equal(summarizeGitHubWorkflowRun([{ head_sha: sha, status: "queued" }], sha).status, "queued");
  assert.equal(summarizeGitHubWorkflowRun([{ head_sha: sha, status: "in_progress" }], sha).status, "in_progress");
  assert.equal(summarizeGitHubWorkflowRun([{ head_sha: sha, status: "completed", conclusion: "success" }], sha).status, "success");
  assert.equal(summarizeGitHubWorkflowRun([{ head_sha: sha, status: "completed", conclusion: "failure" }], sha).status, "failure");
  assert.equal(summarizeGitHubWorkflowRun([{ head_sha: sha, status: "completed", conclusion: "cancelled" }], sha).status, "cancelled");
});
