import { parseCsv, SCHOOL_COLUMNS } from './school-data/pipeline.mjs';

export const SCHOOL_ADMIN_EDITABLE_FIELDS = Object.freeze([
  '學校名稱', '地址', '官網', '電話', 'Google地圖',
  '校車／專車資訊', '通勤資訊', '住宿資訊',
  '校車／專車資料來源', '通勤資料來源', '住宿資料來源', '地址資料來源', '生活資料來源',
  '資料更新日期',
]);

const EDITABLE = new Set(SCHOOL_ADMIN_EDITABLE_FIELDS);
const IMMUTABLE = new Set(SCHOOL_COLUMNS.filter((field) => !EDITABLE.has(field)));
const URL_FIELDS = new Set(['官網', 'Google地圖', '校車／專車資料來源', '通勤資料來源', '住宿資料來源', '地址資料來源', '生活資料來源']);

export function validateSchoolAdminUpdates(updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) throw new Error('updates must be an object');
  const normalized = {};
  for (const [field, value] of Object.entries(updates)) {
    if (!EDITABLE.has(field)) throw new Error(`field is not editable: ${field}`);
    if (typeof value !== 'string') throw new Error(`field must be text: ${field}`);
    if (value.length > 4000) throw new Error(`field is too long: ${field}`);
    if (URL_FIELDS.has(field) && value && !/^https?:\/\/\S+$/i.test(value.trim())) throw new Error(`invalid URL field: ${field}`);
    normalized[field] = value;
  }
  return normalized;
}

export function validateCanonicalSchoolCsv(csvText, expectedLabel = 'regional CSV') {
  const parsed = parseCsv(csvText);
  if (JSON.stringify(parsed.rawHeaders) !== JSON.stringify(SCHOOL_COLUMNS)) throw new Error(`${expectedLabel}: schema order mismatch`);
  const codes = parsed.rows.map((row) => row['學校代碼']);
  if (parsed.rows.some((row) => !row['學校代碼'] || !row['學校名稱'] || !row['招生區'])) throw new Error(`${expectedLabel}: required school field missing`);
  const duplicate = codes.find((code, index) => codes.indexOf(code) !== index);
  if (duplicate) throw new Error(`${expectedLabel}: duplicate school code: ${duplicate}`);
  for (const row of parsed.rows) {
    if (!['高中', '高職', '綜高', '進修部'].includes(row['學制分類'])) throw new Error(`${expectedLabel}: invalid school type`);
    if (!['男校', '女校', '男女校'].includes(row['男女校'])) throw new Error(`${expectedLabel}: invalid gender`);
    if (!['公立', '私立'].includes(row['公私立'])) throw new Error(`${expectedLabel}: invalid ownership`);
  }
  return parsed;
}

export function updateCanonicalSchoolCsv({ csvText, schoolCode, updates, expectedLabel = 'regional CSV' }) {
  if (!/^\d+[A-Za-z0-9_-]*$/.test(String(schoolCode || ''))) throw new Error('invalid school code');
  const fields = validateSchoolAdminUpdates(updates);
  const hasBom = csvText.charCodeAt(0) === 0xfeff;
  const parsed = validateCanonicalSchoolCsv(csvText, expectedLabel);
  const matches = parsed.rows.filter((row) => row['學校代碼'] === schoolCode);
  if (!matches.length) throw new Error(`school not found: ${schoolCode}`);
  if (matches.length !== 1) throw new Error(`duplicate school code: ${schoolCode}`);
  const before = Object.fromEntries(Object.keys(fields).map((field) => [field, matches[0][field] || '']));
  const rows = parsed.rows.map((row) => row['學校代碼'] === schoolCode ? { ...row, ...fields } : row);
  const changedFields = Object.keys(fields).filter((field) => before[field] !== fields[field]);
  const escape = (value) => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  const output = `${hasBom ? '\ufeff' : ''}${SCHOOL_COLUMNS.join(',')}\n${rows.map((row) => SCHOOL_COLUMNS.map((field) => escape(String(row[field] ?? ''))).join(',')).join('\n')}\n`;
  validateCanonicalSchoolCsv(output, expectedLabel);
  return { csvText: output, before, after: Object.fromEntries(Object.keys(fields).map((field) => [field, fields[field]])), changedFields, rowCount: rows.length };
}

export function editableSchoolFields() { return [...SCHOOL_ADMIN_EDITABLE_FIELDS]; }
export function immutableSchoolFields() { return [...IMMUTABLE]; }
