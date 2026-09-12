import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchSchoolRecords } from '../lib/school-data/pipeline.mjs';
const schools = JSON.parse(readFileSync(new URL('../content/schools/generated/schools.json', import.meta.url)));
const searchIndex = JSON.parse(readFileSync(new URL('../content/schools/generated/school-search-index.json', import.meta.url)));
test('school-code routes are unique in sitemap and resolve from the generated entity repository', () => {
  const sitemap = readFileSync(new URL('../public/sitemap.xml',import.meta.url),'utf8');
  const urls=[...sitemap.matchAll(/<loc>https:\/\/jshs\.cc\/schools\/([^<]+)<\/loc>/g)].map(m=>m[1]).filter(p=>!p.includes('/') && schools.some(s=>s.code===p));
  assert.equal(urls.length,schools.length);
  assert.equal(new Set(urls).size,schools.length);
});
test('search covers curriculum and related food terms with combined geographical filters', () => {
  for(const term of ['餐飲','AI']){
    const result=searchSchoolRecords(schools,term);
    assert.ok(result.length>0,term);
    for(const s of result) assert.match([s.name,s.departmentRaw,s.features,s.courseDirection,s.project,s.transport,s.lodging].join(' '),term==='AI'?/AI|人工智慧/i:/餐飲|餐旅|烘焙/);
  }
  const sample=schools.find(s=>s.courseDirection.includes('課程'));
  assert.ok(searchSchoolRecords(schools,'課程',{city:sample.city}).some(s=>s.code===sample.code));
  assert.equal(searchSchoolRecords(schools,'__definitely_missing_school__').length,0);
});
test('Search V2 indexes school entities through the lightweight generated search index',()=>{
  const source=readFileSync(new URL('../lib/search-index.ts',import.meta.url),'utf8');
  assert.match(source,/getSchoolSearchIndex\(\)/);
  assert.doesNotMatch(source,/getSchools\(\)/);
  for(const field of ['code','name','ownership','admissionDistricts','departmentNames','normalizedSearchText'])assert.ok(source.includes(`school.${field}`),field);
  for(const field of ['courseDirection','project','transport','commute','lodging','features','departmentRaw'])assert.doesNotMatch(source,new RegExp(`school\\.${field}`),field);
  assert.match(source,/category: "學校"/);
  assert.doesNotMatch(source,/school-directory|school\.districtCode/);
  assert.equal(searchIndex.length, schools.length);
  assert.ok(searchIndex.every((school)=>school.code && school.name && school.normalizedSearchText));
  assert.ok(searchIndex.some((school)=>school.normalizedSearchText.includes('餐飲') || school.normalizedSearchText.includes('餐旅') || school.normalizedSearchText.includes('烘焙')));
  assert.ok(searchIndex.some((school)=>school.normalizedSearchText.includes('台中') || school.normalizedSearchText.includes('中投')));
  assert.ok(searchIndex.every((school)=>!('raw' in school) && !('admissionRecords' in school) && !('sources' in school)));
});
