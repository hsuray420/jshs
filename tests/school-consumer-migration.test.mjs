import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read = path => readFile(new URL(`../${path}`,import.meta.url),'utf8');
test('ancillary school consumers use the correct canonical generated school data layer',async()=>{
  for(const file of ['lib/assistant-knowledge.ts','components/admission-calculator.tsx','app/api/school-reviews/route.ts']) {
    const source=await read(file);
    assert.match(source,/school-search-index|getSchoolSearchIndex/);
    assert.doesNotMatch(source,/school-repository|getSchools\(/);
    assert.doesNotMatch(source,/school-directory|schools\.csv\?raw/);
  }
  for(const file of ['lib/planner-data.ts']) {
    const source=await read(file);
    assert.match(source,/school-repository/);
    assert.doesNotMatch(source,/school-directory|schools\.csv\?raw/);
  }
});
test('retired directory command cannot generate a parallel regional directory',async()=>{
 const source=await read('scripts/generate-school-directory.mjs');
 assert.match(source,/import\('\.\/generate-schools\.mjs'\)/);
 assert.doesNotMatch(source,/readFile|writeFile|csvFiles/);
});
