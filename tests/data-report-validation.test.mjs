import assert from "node:assert/strict";
import test from "node:test";

import { normalizeDataReportInput } from "../lib/data-report.mjs";

test("data report validation keeps a useful, bounded audit payload", () => {
  const result = normalizeDataReportInput({
    pageUrl: "https://jshs.cc/schools/ct/123",
    category: "招生名額",
    academicYear: "115",
    dataset: "school_directory",
    field: "招生名額",
    currentValue: "100",
    suggestedValue: "120",
    sourceUrl: "https://example.gov.tw/admission.pdf",
    note: "官方簡章第 3 頁已更新。",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.pageUrl, "/schools/ct/123");
    assert.equal(result.value.sourceUrl, "https://example.gov.tw/admission.pdf");
    assert.equal(result.value.status, "pending");
  }
});

test("data report validation rejects unsafe URLs and missing correction details", () => {
  const result = normalizeDataReportInput({
    pageUrl: "javascript:alert(1)",
    category: "功能問題",
    suggestedValue: "",
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "report_details_required");
});

test("data report validation supports a relative page and optional contact without exposing extra fields", () => {
  const result = normalizeDataReportInput({
    pageUrl: "/trust/status",
    category: "來源連結",
    suggestedValue: "請更新來源連結",
    contact: "家長@example.com",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.contact, "家長@example.com");
    assert.equal(Object.hasOwn(result.value, "password"), false);
  }
});
