export const SCHOOL_ADMIN_FIELDS = Object.freeze({
  rank: { csvColumn: '排名', label: '排名', section: 'identity', editable: false },
  schoolCode: { csvColumn: '學校代碼', label: '學校代碼', section: 'identity', editable: false },
  schoolName: { csvColumn: '學校名稱', label: '學校名稱', section: 'basic', editable: true },
  ownership: { csvColumn: '公私立', label: '公私立', section: 'basic', editable: true },
  admissionArea: { csvColumn: '招生區', label: '就學區', section: 'identity', editable: false },
  schoolType: { csvColumn: '學制分類', label: '學校類型', section: 'basic', editable: true },
  gender: { csvColumn: '男女校', label: '招生性別', section: 'basic', editable: true },
  city: { csvColumn: '縣市', label: '縣市', section: 'basic', editable: true },
  area: { csvColumn: '區', label: '行政區', section: 'basic', editable: true },
  address: { csvColumn: '地址', label: '地址', section: 'basic', editable: true, sourceColumn: '地址資料來源' },
  website: { csvColumn: '官網', label: '官方網站', section: 'basic', editable: true, input: 'url' },
  phone: { csvColumn: '電話', label: '電話', section: 'basic', editable: true },
  departments: { csvColumn: '科系與名額', label: '科別與名額', section: 'departments', editable: true, multiline: true },
  brochureQuota: { csvColumn: '簡章招生名額', label: '簡章招生名額', section: 'admissions', editable: true },
  admissionQuota: { csvColumn: '招生名額', label: '招生名額', section: 'admissions', editable: true },
  featuredPrograms: { csvColumn: '資優班/特色班', label: '資優班／特色班', section: 'admissions', editable: true, multiline: true },
  courseDirection: { csvColumn: '課程方向', label: '課程方向', section: 'departments', editable: true, multiline: true, sourceColumn: '課程資料來源' },
  projects: { csvColumn: '實習／專題', label: '實習／專題', section: 'departments', editable: true, multiline: true, sourceColumn: '實習專題資料來源' },
  schoolBus: { csvColumn: '校車／專車資訊', label: '校車／專車', section: 'transport', editable: true, multiline: true, sourceColumn: '校車／專車資料來源' },
  commute: { csvColumn: '通勤資訊', label: '通勤資訊', section: 'transport', editable: true, multiline: true, sourceColumn: '通勤資料來源' },
  lodging: { csvColumn: '住宿資訊', label: '住宿資訊', section: 'transport', editable: true, multiline: true, sourceColumn: '住宿資料來源' },
  mapUrl: { csvColumn: 'Google地圖', label: 'Google 地圖', section: 'transport', editable: true, input: 'url' },
  courseSource: { csvColumn: '課程資料來源', label: '課程資料來源', section: 'sources', editable: true, input: 'url' },
  projectSource: { csvColumn: '實習專題資料來源', label: '實習專題資料來源', section: 'sources', editable: true, input: 'url' },
  schoolBusSource: { csvColumn: '校車／專車資料來源', label: '校車／專車資料來源', section: 'sources', editable: true, input: 'url' },
  commuteSource: { csvColumn: '通勤資料來源', label: '通勤資料來源', section: 'sources', editable: true, input: 'url' },
  lodgingSource: { csvColumn: '住宿資料來源', label: '住宿資料來源', section: 'sources', editable: true, input: 'url' },
  addressSource: { csvColumn: '地址資料來源', label: '地址資料來源', section: 'sources', editable: true, input: 'url' },
  lifeSource: { csvColumn: '生活資料來源', label: '生活資料來源', section: 'sources', editable: true, input: 'url' },
  verifiedAt: { csvColumn: '資料更新日期', label: '最後確認日期', section: 'sources', editable: true, input: 'date' },
});

const BY_COLUMN = new Map(Object.entries(SCHOOL_ADMIN_FIELDS).map(([domainField, definition]) => [definition.csvColumn, { ...definition, domainField }]));

export function editableCsvColumns() {
  return Object.values(SCHOOL_ADMIN_FIELDS).filter((field) => field.editable).map((field) => field.csvColumn);
}

export function immutableCsvColumns() {
  return Object.values(SCHOOL_ADMIN_FIELDS).filter((field) => !field.editable).map((field) => field.csvColumn);
}

export function fieldDefinitionByCsvColumn(column) {
  return BY_COLUMN.get(column) || null;
}

export function mapDomainUpdatesToCsv(updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) throw new Error('updates must be an object');
  return Object.fromEntries(Object.entries(updates).map(([domainField, value]) => {
    const definition = SCHOOL_ADMIN_FIELDS[domainField];
    if (!definition) throw new Error(`unknown domain field: ${domainField}`);
    if (!definition.editable) throw new Error(`field is not editable: ${domainField}`);
    return [definition.csvColumn, value];
  }));
}

export function schoolAdminFieldCatalog() {
  return Object.entries(SCHOOL_ADMIN_FIELDS).map(([domainField, definition]) => ({ domainField, ...definition }));
}

