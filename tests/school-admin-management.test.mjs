import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHOOL_COLUMNS } from '../lib/school-data/pipeline.mjs';
import { updateCanonicalSchoolCsv, validateSchoolAdminUpdates } from '../lib/school-admin-csv.mjs';

const row = (code, name, address = '臺北市中正區忠孝東路一段1號') => [
  '', code, name, '公立', '基北區臺北市', '高中', '男女校', '臺北市', '中正區', address, 'https://school.example', '02-12345678', '普通科：100', '100', '100', '', '普通課程', '', '提供公車', '捷運轉乘', '未提供住宿', 'https://maps.example', 'https://source.example/course', 'https://source.example/project', 'https://source.example/bus', 'https://source.example/commute', '', 'https://source.example/address', '', '2026-09-20',
];
const csv = (rows) => `\ufeff${SCHOOL_COLUMNS.join(',')}\n${rows.map((values) => values.map((value) => /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value).join(',')).join('\n')}\n`;

test('updates only the exact school row and preserves CSV structure', () => {
  const source = csv([row('193302', '臺北市立建國高級中學'), row('193303', '臺北市立成功高級中學')]);
  const result = updateCanonicalSchoolCsv({ csvText: source, schoolCode: '193302', updates: { 地址: '臺北市中正區新地址1號', 通勤資訊: '臺北車站轉乘' } });
  assert.equal(result.rowCount, 2);
  assert.deepEqual(result.changedFields, ['地址', '通勤資訊']);
  assert.equal(result.csvText.charCodeAt(0), 0xfeff);
  assert.deepEqual(result.csvText.replace(/^\ufeff/, '').split('\n')[0].split(','), SCHOOL_COLUMNS);
  assert.match(result.csvText, /193302[^\n]*新地址1號/);
  assert.match(result.csvText, /193303[^\n]*臺北市立成功高級中學/);
});

test('rejects immutable fields and malformed URL input', () => {
  assert.throws(() => validateSchoolAdminUpdates({ 學校代碼: '999999' }), /not editable/);
  assert.throws(() => validateSchoolAdminUpdates({ 官網: 'javascript:alert(1)' }), /invalid URL/);
});

test('rejects duplicate target codes and schema-invalid CSV before writing', () => {
  const duplicate = csv([row('193302', 'A'), row('193302', 'B')]);
  assert.throws(() => updateCanonicalSchoolCsv({ csvText: duplicate, schoolCode: '193302', updates: { 地址: '臺北市中正區新地址1號' } }), /duplicate school code/);
  const invalid = csv([row('193302', 'A')]).replace(',高中,', ',未知學制,');
  assert.throws(() => updateCanonicalSchoolCsv({ csvText: invalid, schoolCode: '193302', updates: { 地址: '臺北市中正區新地址1號' } }), /invalid school type/);
});
