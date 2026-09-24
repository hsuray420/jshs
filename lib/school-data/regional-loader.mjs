import fs from 'node:fs';
import path from 'node:path';
import registry from '../../content/schools/region-registry.json' with { type: 'json' };
import {parseCsv,normalizeSchool,SCHOOL_COLUMNS,SCHOOL_LEVEL_FIELDS,REGION_SPECIFIC_FIELDS,SOURCE_COLUMNS} from './pipeline.mjs';

// Keep the registry in the Worker bundle. A Worker has no filesystem-relative
// import.meta.url, while the CSV loading helpers still accept an explicit root
// for local generation and validation scripts.
const projectRoot=typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '';

export const REGION_STATUS = Object.freeze(['available','unavailable']);

export const REGION_REGISTRY = Object.freeze(registry.regions.map(region=>Object.freeze({...region})).sort((a,b)=>a.displayOrder-b.displayOrder));

export const ENABLED_SCHOOL_REGIONS = Object.freeze(REGION_REGISTRY.filter(region=>region.schoolDataStatus==='available').map(region=>{
  const relative=region.csvPath.replace(/^content\/schools\/regions\//,'');
  return Object.freeze({code:region.id,label:region.name,folder:path.dirname(relative),file:path.basename(relative),schoolYear:region.schoolYear,status:region.schoolDataStatus,csvPath:region.csvPath});
}));

export const UNAVAILABLE_SCHOOL_REGIONS = Object.freeze(REGION_REGISTRY.filter(region=>region.schoolDataStatus==='unavailable').map(region=>Object.freeze({code:region.id,label:region.name,status:region.schoolDataStatus,schoolYear:region.schoolYear})));

export function getRegionRegistry(){
  return REGION_REGISTRY;
}

export function getRegionStatus(code){
  return REGION_REGISTRY.find(region=>region.id===code)?.schoolDataStatus;
}

export function assertAvailableSchoolRegion(code){
  const region=REGION_REGISTRY.find(item=>item.id===code);
  if(!region) throw new Error(`unknown region: ${code}`);
  if(region.schoolDataStatus!=='available') throw new Error(`school data unavailable: ${code}`);
  return region;
}

export const SCHOOL_FIELD_CLASSIFICATION = Object.freeze({
  schoolLevel: SCHOOL_LEVEL_FIELDS,
  regionSpecific: REGION_SPECIFIC_FIELDS,
  sourceMetadata: SOURCE_COLUMNS,
});

export function regionalCsvPath(region,root=projectRoot){
  if(typeof region==='string'){
    const entry=assertAvailableSchoolRegion(region);
    return path.join(root,entry.csvPath);
  }
  return path.join(root,'content','schools','regions',region.folder,region.file);
}

export function validateRegionalSchools(regions){
  const errors=[],warnings=[];
  const ids=REGION_REGISTRY.map(region=>region.id);
  for(const status of REGION_REGISTRY.flatMap(region=>[region.schoolDataStatus,region.calculatorStatus])) {
    if(!REGION_STATUS.includes(status)) errors.push(`region registry invalid status: ${status}`);
  }
  for(const id of new Set(ids)) if(ids.filter(value=>value===id).length>1) errors.push(`region registry duplicate id: ${id}`);
  for(const region of REGION_REGISTRY) {
    if(region.schoolDataStatus==='available'&&!region.csvPath) errors.push(`${region.name}: available region missing csvPath`);
    if(region.schoolDataStatus==='unavailable'&&region.csvPath) errors.push(`${region.name}: unavailable region must not define csvPath`);
  }
  const expectedSet=new Set(SCHOOL_COLUMNS);
  const globalCodes=[];
  const allRows=[];
  for(const region of regions){
    const headersSet=new Set(region.headers);
    const missing=SCHOOL_COLUMNS.filter(column=>!headersSet.has(column));
    const unexpected=region.headers.filter(column=>!expectedSet.has(column));
    const duplicateHeaders=region.rawHeaders.filter((header,index)=>region.rawHeaders.indexOf(header)!==index);
    if(duplicateHeaders.length) errors.push(`${region.label}: duplicate header: ${[...new Set(duplicateHeaders)].join('、')}`);
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
