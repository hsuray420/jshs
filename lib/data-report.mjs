export const DATA_REPORT_CATEGORIES = Object.freeze([
  "學校資料",
  "招生名額",
  "積分規則",
  "重要日期",
  "來源連結",
  "功能問題",
  "其他",
]);

export const DATA_REPORT_STATUSES = Object.freeze(["pending", "accepted", "fixed", "rejected"]);

export function normalizeDataReportInput(input) {
  if (!input || typeof input !== "object") return { ok: false, error: "invalid_json" };
  const body = input;
  const pageUrl = clean(body.pageUrl, 500);
  const category = clean(body.category, 40);
  const suggestedValue = clean(body.suggestedValue, 2000);
  if (!pageUrl || !DATA_REPORT_CATEGORIES.includes(category) || !suggestedValue) {
    return { ok: false, error: "report_details_required" };
  }

  const normalizedPageUrl = normalizePageUrl(pageUrl);
  if (!normalizedPageUrl) return { ok: false, error: "invalid_page_url" };

  const sourceUrl = clean(body.sourceUrl, 500);
  if (sourceUrl && !isHttpUrl(sourceUrl)) return { ok: false, error: "invalid_source_url" };

  return {
    ok: true,
    value: {
      pageUrl: normalizedPageUrl,
      category,
      dataset: clean(body.dataset, 120),
      academicYear: clean(body.academicYear, 8),
      field: clean(body.field, 120),
      currentValue: clean(body.currentValue, 2000),
      suggestedValue,
      sourceUrl,
      note: clean(body.note, 1000),
      contact: clean(body.contact, 160),
      status: "pending",
    },
  };
}

function clean(value, maxLength) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/gu, "").trim().slice(0, maxLength)
    : "";
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizePageUrl(value) {
  if (value.startsWith("/")) return value.split(/[?#]/u, 1)[0].slice(0, 300);
  try {
    const url = new URL(value);
    if (!isHttpUrl(value) || !["jshs.cc", "www.jshs.cc", "localhost"].includes(url.hostname)) return null;
    return `${url.pathname}${url.search}`.slice(0, 300);
  } catch {
    return null;
  }
}
