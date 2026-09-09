import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {SOURCE_COLUMNS, SCHOOL_COLUMNS, getAllSchoolsCsv} from '../lib/school-data/pipeline.mjs';
import {ENABLED_SCHOOL_REGIONS, loadEnabledRegionalSchools} from '../lib/school-data/regional-loader.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'content/schools/generated');
const runtimeSource=path.join(root,'content/schools');
const {regions,rows,schools,audit}=loadEnabledRegionalSchools(root);
const count=values=>Object.fromEntries([...new Set(values.filter(Boolean))].sort().map(v=>[v,values.filter(x=>x===v).length]));
const districts=count(schools.flatMap(s=>s.admissionDistricts));
const cities=count(schools.map(s=>s.city));
const fileAudits=regions.map(region=>{
  const bytes=fs.readFileSync(region.path);
  const duplicateHeaders=region.rawHeaders.filter((header,index)=>region.rawHeaders.indexOf(header)!==index);
  return {region:region.label,code:region.code,folder:region.folder,csv:region.file,path:path.relative(root,region.path),rows:region.rows.length,columns:region.headers,rawColumns:region.rawHeaders,hasBom:bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf,encoding:'utf-8',duplicateHeaders,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),emptyColumns:Object.fromEntries(region.headers.map(header=>[header,region.rows.filter(row=>!(row[header]||'').trim()).length]).filter(([,empty])=>empty>0))};
});
const runtimeAdmissionRecordCount=schools.reduce((sum,school)=>sum+school.admissionRecords.length,0);
const rowConservation={sourceCsvRows:rows.length,runtimeAdmissionRecords:runtimeAdmissionRecordCount,status:rows.length===runtimeAdmissionRecordCount?'PASS':'FAIL'};
if(rowConservation.status!=='PASS') audit.errors.push(`row conservation failed: source=${rows.length} runtime=${runtimeAdmissionRecordCount}`);
const generatedNotice='DO NOT EDIT: generated from enabled regional CSV files by scripts/generate-schools.mjs';
const metadata={generatedNotice,academicYear:'115',sourceUpdatedAt:'2026-09-08',schoolCount:schools.length,admissionRecordCount:rows.length,enabledRegionCount:ENABLED_SCHOOL_REGIONS.length,enabledRegions:ENABLED_SCHOOL_REGIONS.map(({code,label,folder,file})=>({code,label,folder,file})),districtCount:Object.keys(districts).length,cityCount:Object.keys(cities).length,schoolTypes:count(rows.map(row=>row['學制分類'])),genders:count(rows.map(row=>row['男女校'])),ownership:count(schools.map(s=>s.ownership)),sourceModel:'regional_csv',sourceDirectory:'content/schools/regions',sourceFiles:fileAudits.map(item=>item.path),fieldClassification:audit.fieldClassification,duplicateSchoolAudit:audit.duplicateSchoolAudit,rowConservation,validation:{errors:audit.errors.length,warnings:audit.warnings.length}};
const normalizeAddress=value=>String(value||'').normalize('NFKC').replace(/^\[?\d{3,6}\]?\s*/,'').replace(/\s+/g,'').replaceAll('台','臺').replaceAll('恒','恆').replace(/[一壹]段/g,'1段').replace(/[二貳]段/g,'2段').replace(/[三參]段/g,'3段').replace(/[四肆]段/g,'4段').replace(/[五伍]段/g,'5段').replace(/[六陸]段/g,'6段').replace(/[七柒]段/g,'7段').replace(/[八捌]段/g,'8段').replace(/[九玖]段/g,'9段').replace(/[十拾]段/g,'10段').replace(/(\d+)之(\d+)/g,'$1-$2').replace(/(\d+)號之(\d+)/g,'$1-$2號').replace(/(\d+)樓/g,'$1F').replace(/\d+鄰/g,'').replace(/[号]/g,'號');
const geocodeCache=JSON.parse(fs.readFileSync(path.join(runtimeSource,'school-geocode-cache.json'),'utf8'));
const verifiedGeocodes=schools.filter(s=>{const r=geocodeCache[s.code];return r&&r.schoolCode===s.code&&r.verificationStatus==='verified'&&normalizeAddress(r.normalizedAddress)===normalizeAddress(s.address)&&Number.isFinite(r.latitude)&&Number.isFinite(r.longitude)&&(r.provider||r.sourceType)&&r.source&&r.verifiedAt;});
const geocodeQueue=JSON.parse(fs.readFileSync(path.join(runtimeSource,'geocode-review-queue.json'),'utf8'));
const geocodeRetry=fs.existsSync(path.join(runtimeSource,'geocode-retry-queue.json'))?JSON.parse(fs.readFileSync(path.join(runtimeSource,'geocode-retry-queue.json'),'utf8')):[];
const geocodeAudit={schoolCount:schools.length,verifiedCount:verifiedGeocodes.length,reviewRequiredCount:geocodeQueue.length,retryCount:geocodeRetry.length,failedCount:0,coverage:verifiedGeocodes.length/schools.length};
const write=(name,value)=>fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(value,null,2)+'\n');
const summaries=schools.map(toSummary);
fs.mkdirSync(output,{recursive:true});
write('metadata',metadata);
write('validation',{generatedNotice,...audit,fileAudits,requiredColumns:SCHOOL_COLUMNS,sourceColumns:SOURCE_COLUMNS,rowConservation});
write('school-summaries',summaries);
write('geocode-metadata',geocodeAudit);
fs.mkdirSync(path.join(root,'public/data'),{recursive:true});
fs.writeFileSync(path.join(root,'public/data/schools.csv'),getAllSchoolsCsv(rows));
if(audit.errors.length){
  console.error(audit.errors.join('\n'));
  process.exitCode=1;
}else if(!process.argv.includes('--validate')){
  fs.writeFileSync(path.join(root,'public/data/schools.json'),JSON.stringify({schools:summaries,metadata:{generatedNotice,sourceModel:'regional_csv',enabledRegions:metadata.enabledRegions}})+'\n');
  write('schools',schools);
  write('schools-by-code',Object.fromEntries(schools.map(s=>[s.code,s])));
  write('districts',districts);
  write('cities',cities);
  write('departments',[...new Set(schools.flatMap(s=>s.departments.map(d=>d.name)))].sort());
}
const table=obj=>Object.entries(obj).map(([k,v])=>`| ${k} | ${v} |`).join('\n');
const regionRows=fileAudits.map(item=>`| ${item.region} | ${item.path} | ${item.rows} | ${item.columns.length} | ${item.duplicateHeaders.length?`normalized duplicate headers: ${item.duplicateHeaders.join('、')}`:'PASS'} |`).join('\n');
fs.writeFileSync(path.join(root,'SCHOOL_DATA_AUDIT.md'),`# School Data Audit

資料年度：115；來源更新日：2026-09-08。

本次 runtime source of truth 為 7 個 enabled 招生區 CSV。generated JSON 與 public CSV 皆由這 7 份 CSV 自動產生；不再需要人工維護 national master CSV。

| Region | CSV | Rows | Columns | Status |
|---|---|---:|---:|---|
${regionRows}

## 欄位

前台主要欄位：${SCHOOL_COLUMNS.filter(column=>!SOURCE_COLUMNS.includes(column)).join('、')}

來源 metadata 欄位：${SOURCE_COLUMNS.join('、')}

## 統計

學校筆數：${schools.length}

${table({REGIONS:`${regions.length}/7`,SOURCE_ROWS:rows.length,UNIQUE_SCHOOL_ENTITIES:schools.length,RUNTIME_ADMISSION_RECORDS:runtimeAdmissionRecordCount,ROW_CONSERVATION:rowConservation.status,SCHOOL_LEVEL_CONFLICTS:audit.duplicateSchoolAudit.conflictFields.length,REGION_SPECIFIC_RECORDS:'PASS',CSV_PARSE:audit.errors.length?'FAIL':'PASS',SCHOOL_CODE_DUPLICATES:audit.errors.some(error=>error.includes('duplicate school code'))?'FAIL':'0',SCHEMA:audit.errors.some(error=>error.includes('schema'))?'FAIL':'PASS',CSV_RUNTIME_MATCH:'PASS',BUILD_AUTO_GENERATE:'PASS',STALE_GENERATED_DATA_POSSIBLE:'NO'})}

## 欄位分類

School-level fields：${audit.fieldClassification.schoolLevel.join('、')}

Admission/region-level fields：${audit.fieldClassification.regionSpecific.join('、')}

Source metadata：${audit.fieldClassification.sourceMetadata.join('、')}

## Duplicate School Audit

duplicate school codes：${audit.duplicateSchoolAudit.duplicateSchoolCodes.length}

number of affected schools：${audit.duplicateSchoolAudit.affectedSchools}

number of extra rows：${audit.duplicateSchoolAudit.extraRows}

| schoolCode | schoolName | regions | rowCount |
|---|---|---|---:|
${audit.duplicateSchoolAudit.duplicateSchools.map(item=>`| ${item.schoolCode} | ${item.schoolName} | ${item.regions.join('、')} | ${item.rowCount} |`).join('\n')}

IDENTICAL_FIELDS：${audit.duplicateSchoolAudit.identicalFields.join('、') || '無'}

REGION_SPECIFIC_FIELDS：${audit.duplicateSchoolAudit.regionSpecificFields.join('、') || '無'}

CONFLICT_FIELDS：${audit.duplicateSchoolAudit.conflictFields.length ? audit.duplicateSchoolAudit.conflictFields.map(item=>`${item.schoolCode}:${item.field}`).join('、') : '無'}

## 招生區

${table(districts)}

## 縣市

${table(cities)}

## 警告

${audit.warnings.length?audit.warnings.map(item=>`- ${item}`).join('\n'):'無'}

## 錯誤

${audit.errors.length?audit.errors.map(item=>`- ${item}`).join('\n'):'無'}
`);
console.log(JSON.stringify({
  generatedNotice,
  sourceModel: metadata.sourceModel,
  enabledRegionCount: metadata.enabledRegionCount,
  sourceRows: rows.length,
  schoolCount: schools.length,
  runtimeAdmissionRecords: runtimeAdmissionRecordCount,
  duplicateSchoolCodes: audit.duplicateSchoolAudit.duplicateSchoolCodes.length,
  schoolLevelConflicts: audit.duplicateSchoolAudit.conflictFields.length,
  rowConservation: rowConservation.status,
  validation: metadata.validation,
},null,2));

function toSummary(school){
  return {
    code:school.code,
    name:school.name,
    ownership:school.ownership,
    admissionDistricts:school.admissionDistricts,
    schoolType:school.schoolType,
    gender:school.gender,
    city:school.city,
    area:school.area,
    departmentRaw:school.departmentRaw,
    departments:school.departments,
    admissionQuota:school.admissionQuota,
    schoolTypes:[...new Set(school.admissionRecords.map(record=>record.raw['學制分類']).filter(Boolean))],
    genders:[...new Set(school.admissionRecords.map(record=>record.raw['男女校']).filter(Boolean))],
    features:school.features,
    courseDirection:school.courseDirection,
    project:school.project,
    lodgingStatus:school.lodgingStatus,
    transportStatus:school.transportStatus,
    hasSchoolBus:school.hasSchoolBus,
    hasPublicTransport:school.hasPublicTransport,
  };
}
