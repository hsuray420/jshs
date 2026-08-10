#!/usr/bin/env node

/**
 * Builds the school lists from the official 115 academic-year admission
 * committees' public "招生名額查詢" endpoint.  The endpoint is the source of
 * truth for the public, current (post 6/18) general-student quotas.
 *
 * Usage: node scripts/build-district-school-csvs.mjs
 *
 * The script intentionally fails a district instead of writing a partial CSV.
 * Some committees temporarily close their public service outside office hours;
 * rerun when that happens.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedAt = new Date().toLocaleString('zh-TW', {
  timeZone: 'Asia/Taipei', hour12: false,
});

const districts = [
  { id: 'ct', label: '中投區', host: 'ct', system: 'CT', file: 'schools.csv', enrichmentFile: 'backups/csv-audit-20260809/ct-schools.csv' },
  { id: 'ilan', label: '宜蘭區', host: 'iln', system: 'IL', file: 'schools.csv' },
  { id: 'hsinchu-miaoli', label: '竹苗區', host: 'hhm', system: 'HM', file: 'schools.csv' },
  { id: 'changhua', label: '彰化區', host: 'chc', system: 'CH', file: 'schools.csv' },
  { id: 'yunlin', label: '雲林區', host: 'ylc', system: 'YL', file: 'schools.csv' },
  { id: 'chiayi', label: '嘉義區', host: 'cyc', system: 'CY', file: 'schools.csv' },
  { id: 'tainan', label: '臺南區', host: 'tn', system: 'TN', file: 'schools.csv' },
  { id: 'pingtung', label: '屏東區', host: 'ptc', system: 'PT', file: 'schools.csv' },
  { id: 'kaohsiung', label: '高雄區', host: 'kh', system: 'KH', file: 'schools.csv' },
  { id: 'hualien', label: '花蓮區', host: 'hlc', system: 'HL', file: 'schools.csv' },
  { id: 'taitung', label: '臺東區', host: 'ttf', system: 'TT', file: 'schools.csv' },
  { id: 'penghu', label: '澎湖區', host: 'ph', system: 'PH', file: 'schools.csv' },
  { id: 'kinmen', label: '金門區', host: 'km', system: 'KM', file: 'schools.csv' },
];

const columns = [
  '排名', '學校代碼', '學校名稱', '公私立', '招生區', '學制分類', '男女校', '縣市', '區', '地址',
  '官網', '電話', '科系與名額', '簡章招生名額', '招生名額', '最低錄取分數', '分數年度', '分數來源備註',
  '資優班/特色班', '排序分數',
];

function csv(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...values] = rows;
  return values.filter((value) => value.length === header.length).map((value) => Object.fromEntries(header.map((name, index) => [name.replace(/^\ufeff/, ''), value[index]])));
}

async function existingRows(district) {
  if (!district.enrichmentFile) return new Map();
  try {
    const source = await readFile(resolve(root, district.enrichmentFile), 'utf8');
    return new Map(parseCsv(source).map((row) => [text(row['學校代碼']), row]));
  } catch {
    return new Map();
  }
}

function text(value) {
  return String(value ?? '').trim();
}

function genderName(records) {
  const values = new Set(records.map((record) => text(record.SexLimitNAME)));
  if (values.size === 1) return [...values][0] || '不限';
  return '不限';
}

function schoolType(records) {
  const values = [...new Set(records.map((record) => text(record.E_Kind_Name)).filter(Boolean))];
  return values.join('／') || '高中職';
}

function attendance(records) {
  const values = new Set(records.map((record) => text(record.Dpt_No_Name)));
  return values.has('進修部') ? (values.size === 1 ? '進修部' : '日間部／進修部') : '日間部';
}

function courseList(records) {
  return records
    .slice()
    .sort((a, b) => `${a.Dep_No}`.localeCompare(`${b.Dep_No}`, 'zh-Hant'))
    .map((record) => `${text(record.Dep_Name)}:${Number(record.Quota) || 0}(${text(record.SexLimitNAME) || '不限'})`)
    .join('；');
}

function toRows(district, records, enrichments) {
  const bySchool = new Map();
  for (const record of records) {
    // Only the public general admission rows belong in the school CSV.
    if (text(record.Admission_No) && text(record.Admission_No) !== 'A') continue;
    const key = `${text(record.Sch_No)}\u0000${text(record.Dpt_No_Name)}`;
    const bucket = bySchool.get(key) || [];
    bucket.push(record);
    bySchool.set(key, bucket);
  }

  return [...bySchool.values()]
    .sort((a, b) => `${a[0].Sch_No}`.localeCompare(`${b[0].Sch_No}`, 'en'))
    .map((records) => {
      const first = records[0];
      const quota = records.reduce((total, record) => total + (Number(record.Quota) || 0), 0);
      const enrichment = enrichments.get(text(first.Sch_No)) || {};
      const row = {
        '排名': '',
        '學校代碼': text(first.Sch_No),
        '學校名稱': text(first.Sch_Name),
        '公私立': text(first.P_Kind_Name),
        '招生區': `${district.label}免試入學${attendance(records)}`,
        '學制分類': schoolType(records),
        '男女校': genderName(records),
        '縣市': text(first.City_No_Name),
        '區': text(first.Villages_No_Name),
        '地址': '',
        '官網': '',
        '電話': '',
        '科系與名額': courseList(records),
        '簡章招生名額': '',
        '招生名額': quota,
        '最低錄取分數': '',
        '分數年度': '',
        '分數來源備註': `115學年度${district.label}高級中等學校免試入學委員會「招生名額查詢」；一般生實際招生名額；擷取時間：${generatedAt}`,
        '資優班/特色班': '請以各校當年度公告為準',
        '排序分數': text(enrichment['排序分數']),
      };
      for (const column of ['排名', '地址', '官網', '電話', '最低錄取分數', '分數年度', '資優班/特色班']) {
        if (text(enrichment[column])) row[column] = enrichment[column];
      }
      return row;
    });
}

async function fetchDistrict(district) {
  const endpoint = `https://${district.host}.entry.edu.tw/NoExamImitate_${district.system}/NoExamImitate/Apps/Action/Student/Sch_DepInfo.ashx`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-requested-with': 'XMLHttpRequest' },
    body: JSON.stringify({ mode: 'SearchAll' }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.success !== true || typeof payload.data !== 'string') throw new Error(payload.msg || '官方端點未回傳資料');
  const records = JSON.parse(payload.data);
  if (!Array.isArray(records) || records.length === 0) throw new Error('官方端點回傳空資料');
  return { endpoint, records };
}

const results = await Promise.allSettled(districts.map(async (district) => {
  const { endpoint, records } = await fetchDistrict(district);
  const rows = toRows(district, records, await existingRows(district));
  if (!rows.length) throw new Error('篩選後無免試入學資料');
  const target = resolve(root, 'public', 'it_hs', district.id, district.file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `\ufeff${columns.join(',')}\n${rows.map((row) => columns.map((column) => csv(row[column])).join(',')).join('\n')}\n`);
  return { district, endpoint, records, rows };
}));

const failed = [];
for (const result of results) {
  if (result.status === 'fulfilled') {
    const { district, endpoint, records, rows } = result.value;
    console.log(`完成 ${district.label}: ${rows.length} 校別、${records.length} 科別；${endpoint}`);
  } else {
    const district = districts[results.indexOf(result)];
    failed.push(`${district.label}: ${result.reason.message}`);
  }
}

if (failed.length) {
  console.error(`\n未寫入的就學區（保留既有檔案）：\n${failed.join('\n')}`);
  process.exitCode = 1;
}
