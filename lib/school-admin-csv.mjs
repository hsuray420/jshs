import { parseCsv, SCHOOL_COLUMNS } from './school-data/pipeline.mjs';
import { editableCsvColumns, immutableCsvColumns } from './school-admin-fields.mjs';

export const SCHOOL_ADMIN_EDITABLE_FIELDS = Object.freeze(editableCsvColumns());

const EDITABLE = new Set(SCHOOL_ADMIN_EDITABLE_FIELDS);
const IMMUTABLE = new Set(immutableCsvColumns());
const URL_FIELDS = new Set(['官網', 'Google地圖', '課程資料來源', '實習專題資料來源', '校車／專車資料來源', '通勤資料來源', '住宿資料來源', '地址資料來源', '生活資料來源']);

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
  const changedFields = Object.keys(fields).filter((field) => before[field] !== fields[field]);
  if (!changedFields.length) return { csvText, before, after: before, changedFields, rowCount: parsed.rows.length };
  const targetIndex = parsed.rows.findIndex((row) => row['學校代碼'] === schoolCode);
  const target = { ...parsed.rows[targetIndex], ...fields };
  const escape = (value) => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  const records = splitCsvRecords(csvText.slice(hasBom ? 1 : 0));
  if (records.length !== parsed.rows.length + 1) throw new Error(`${expectedLabel}: CSV record count mismatch`);
  const originalRecord = records[targetIndex + 1];
  const lineEnding = originalRecord.endsWith('\r\n') ? '\r\n' : originalRecord.endsWith('\n') ? '\n' : originalRecord.endsWith('\r') ? '\r' : '';
  records[targetIndex + 1] = `${SCHOOL_COLUMNS.map((field) => escape(String(target[field] ?? ''))).join(',')}${lineEnding}`;
  const output = `${hasBom ? '\ufeff' : ''}${records.join('')}`;
  validateCanonicalSchoolCsv(output, expectedLabel);
  return { csvText: output, before, after: Object.fromEntries(Object.keys(fields).map((field) => [field, fields[field]])), changedFields, rowCount: parsed.rows.length };
}

function splitCsvRecords(text) {
  const records = [];
  let start = 0;
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') index += 1;
      else quoted = !quoted;
      continue;
    }
    if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      records.push(text.slice(start, index + 1));
      start = index + 1;
    }
  }
  if (start < text.length) records.push(text.slice(start));
  return records.filter((record) => record.replace(/[\r\n]+$/g, '').length > 0);
}

export function editableSchoolFields() { return [...SCHOOL_ADMIN_EDITABLE_FIELDS]; }
export function immutableSchoolFields() { return [...IMMUTABLE]; }
