import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('map compare commute share repository and never fetch the retired directory', () => {
  for (const page of ['map', 'compare', 'commute']) assert.match(read(`app/schools/${page}/page.tsx`), /school-repository/);
  for (const component of ['school-map-explorer', 'school-comparison-explorer', 'commute-comparison']) assert.doesNotMatch(read(`components/${component}.tsx`), /school-directory\.json|districtCode:\s*string|geometric_estimate|scooter/);
});
test('comparison includes complete source-supported learning and life fields', () => {
  const source = read('components/school-comparison-explorer.tsx');
  for (const label of ['公私立', '學制', '男女校', '地區', '招生名額', '科別', '特色班', '課程方向', '實習／專題', '交通', '住宿']) assert.ok(source.includes(label), label);
});
test('school geocoding uses a provenance cache instead of runtime fuzzy school matching', () => {
  const source = read('app/api/school-geocode/route.ts');
  assert.match(source, /school-geocode/);
  assert.doesNotMatch(source, /school-directory|fuzzySchoolMatch|OVERPASS/);
  const cache = JSON.parse(read('content/schools/school-geocode-cache.json'));
  assert.ok(cache['010301']);
  for (const key of ['schoolCode', 'latitude', 'longitude', 'normalizedAddress', 'source', 'sourceType', 'verifiedAt']) assert.ok(key in cache['010301'], key);
});
