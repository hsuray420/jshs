import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCsv,normalizeSchool,SCHOOL_COLUMNS,SCHOOL_LEVEL_FIELDS,REGION_SPECIFIC_FIELDS,SOURCE_COLUMNS} from './pipeline.mjs';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');

export const ENABLED_SCHOOL_REGIONS = Object.freeze([
  {code:'ct',label:'中投區',folder:'中投區_ct',file:'JSHS_中投區_96校_最終版_2026-09-07.csv'},
  {code:'hsinchu-miaoli',label:'竹苗區',folder:'竹苗區_hsinchu-miaoli',file:'JSHS_竹苗區_39校_最終完成版_2026-09-08.csv'},
  {code:'taoyuan-lienchiang',label:'桃連區',folder:'桃連區_taoyuan-lienchiang',file:'JSHS_桃連區_50校_最終完成版_2026-09-08.csv'},
  {code:'kaohsiung',label:'高雄區',folder:'高雄區_kaohsiung',file:'JSHS_高雄區_53校_最終完成版_2026-09-07.csv'},
  {code:'tp',label:'基北區',folder:'基北區_tp',file:'JSHS_基北區_135校_完成版_無排序分數_2026-09-07.csv'},
  {code:'changhua',label:'彰化區',folder:'彰化區_changhua',file:'JSHS_彰化區_49校_最終完成版_2026-09-08.csv'},
  {code:'tainan',label:'臺南區',folder:'臺南區_tainan',file:'JSHS_臺南區_73校_最終完成版_2026-09-08.csv'},
]);

export const SCHOOL_FIELD_CLASSIFICATION = Object.freeze({
  schoolLevel: SCHOOL_LEVEL_FIELDS,
  regionSpecific: REGION_SPECIFIC_FIELDS,
  sourceMetadata: SOURCE_COLUMNS,
});

export function regionalCsvPath(region,root=projectRoot){
  return path.join(root,'content','schools','regions',region.folder,region.file);
}

export function validateRegionalSchools(regions){
  const errors=[],warnings=[];
  const expectedSet=new Set(SCHOOL_COLUMNS);
  const globalCodes=[];
  const allRows=[];
  for(const region of regions){
    const headersSet=new Set(region.headers);
    const missing=SCHOOL_COLUMNS.filter(column=>!headersSet.has(column));
    const unexpected=region.headers.filter(column=>!expectedSet.has(column));
    if(missing.length || unexpected.length) errors.push(`${region.label}: schema mismatch missing=${missing.join('、')||'none'} unexpected=${unexpected.join('、')||'none'}`);
    if(JSON.stringify(region.headers)!==JSON.stringify(SCHOOL_COLUMNS) || JSON.stringify(region.rawHeaders)!==JSON.stringify(SCHOOL_COLUMNS)) warnings.push(`${region.label}: header order/duplicates normalized from ${region.rawHeaders.join('|')}`);
    const regionCodes=[];
    const regionNames=[];
    for(const row of region.rows){
      const id=`${region.label}:${row['學校代碼']||'(missing code)'}`;
      for(const key of ['學校代碼','學校名稱','招生區']) if(!row[key]) errors.push(`${id}: missing ${key}`);
      if(!String(row['招生區']||'').startsWith(region.label)) warnings.push(`${id}: admission region text differs from folder label: ${row['招生區']}`);
      regionCodes.push(row['學校代碼']);
      regionNames.push(row['學校名稱']);
      globalCodes.push(row['學校代碼']);
      allRows.push({...row,資料來源區:region.label,資料來源區代碼:region.code,資料來源CSV:region.file});
    }
    for(const code of new Set(regionCodes)) if(regionCodes.filter(c=>c===code).length>1) errors.push(`${region.label}: duplicate school code: ${code}`);
    for(const name of new Set(regionNames)) if(regionNames.filter(n=>n===name).length>1) warnings.push(`${region.label}: duplicate school name: ${name}`);
  }
  const duplicateSchoolAudit=buildDuplicateSchoolAudit(allRows);
  for(const code of duplicateSchoolAudit.duplicateSchoolCodes) if(globalCodes.filter(c=>c===code).length>1) warnings.push(`cross-region school code aggregated: ${code}`);
  for(const conflict of duplicateSchoolAudit.conflictFields) {
    errors.push(`school-level conflict: ${conflict.schoolCode} ${conflict.schoolName} ${conflict.field} ${conflict.values.map(value=>`${value.region}=${value.value}`).join(' | ')}`);
  }
  return {errors,warnings,fieldClassification:SCHOOL_FIELD_CLASSIFICATION,duplicateSchoolAudit};
}

export function buildDuplicateSchoolAudit(rows){
  const byCode=new Map();
  for(const row of rows) byCode.set(row['學校代碼'],[...(byCode.get(row['學校代碼'])||[]),row]);
  const duplicateSchools=[...byCode.entries()].filter(([,items])=>items.length>1).map(([schoolCode,items])=>{
    const columns=SCHOOL_COLUMNS.map(field=>{
      const values=[...new Map(items.map(item=>[item[field]||'',{region:item['資料來源區'],value:item[field]||''}])).values()];
      return {field,values};
    });
    const identicalFields=columns.filter(column=>column.values.length<=1).map(column=>column.field);
    const conflictFields=columns.filter(column=>SCHOOL_LEVEL_FIELDS.includes(column.field)&&column.values.length>1).map(column=>({schoolCode,schoolName:items[0]['學校名稱']||'',field:column.field,values:column.values}));
    const regionSpecificFields=columns.filter(column=>!SCHOOL_LEVEL_FIELDS.includes(column.field)&&column.values.length>1).map(column=>column.field);
    return {
      schoolCode,
      schoolName:items.map(item=>item['學校名稱']||'').filter(Boolean).sort((a,b)=>b.length-a.length||a.localeCompare(b,'zh-Hant'))[0]||'',
      regions:items.map(item=>item['資料來源區']),
      rowCount:items.length,
      identicalFields,
      regionSpecificFields,
      conflictFields,
    };
  }).sort((a,b)=>a.schoolCode.localeCompare(b.schoolCode));
  return {
    duplicateSchoolCodes: duplicateSchools.map(item=>item.schoolCode),
    affectedSchools: duplicateSchools.length,
    extraRows: duplicateSchools.reduce((sum,item)=>sum+item.rowCount-1,0),
    identicalFields: [...new Set(duplicateSchools.flatMap(item=>item.identicalFields))].sort((a,b)=>SCHOOL_COLUMNS.indexOf(a)-SCHOOL_COLUMNS.indexOf(b)),
    regionSpecificFields: [...new Set(duplicateSchools.flatMap(item=>item.regionSpecificFields))].sort((a,b)=>SCHOOL_COLUMNS.indexOf(a)-SCHOOL_COLUMNS.indexOf(b)),
    conflictFields: duplicateSchools.flatMap(item=>item.conflictFields),
    duplicateSchools,
  };
}

export function loadEnabledRegionalSchools(root=projectRoot){
  const regions=ENABLED_SCHOOL_REGIONS.map(region=>{
    const filePath=regionalCsvPath(region,root);
    const text=fs.readFileSync(filePath,'utf8');
    const parsed=parseCsv(text);
    return {...region,path:filePath,hasBom:text.charCodeAt(0)===0xFEFF,headers:parsed.headers,rawHeaders:parsed.rawHeaders,rows:parsed.rows};
  });
  const audit=validateRegionalSchools(regions);
  const rows=regions.flatMap(region=>region.rows.map(row=>({...row,資料來源區:region.label,資料來源區代碼:region.code,資料來源CSV:region.file})));
  const byCode=new Map();
  for(const row of rows){
    const code=row['學校代碼'];
    byCode.set(code,[...(byCode.get(code)||[]),row]);
  }
  const schools=[...byCode.values()].map(relations=>normalizeSchool(relations[0],relations));
  return {regions,rows,schools,audit};
}
