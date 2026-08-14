import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("the central district catalog turns the current CSV into 96 addressable schools", async () => {
  const [{ toSchoolRecords, parseDepartments }, csv] = await Promise.all([
    import("../lib/school-catalog.mjs"),
    read("public/it_hs/ct/schools.csv"),
  ]);
  const schools = toSchoolRecords(csv);

  assert.equal(schools.length, 96);
  assert.equal(new Set(schools.map((school) => school.code)).size, 96);
  assert.deepEqual(parseDepartments("普通科:76(不限)"), [
    { name: "普通科", quota: 76, audience: "不限" },
  ]);
  assert.equal(schools.find((school) => school.code === "060323")?.name, "國立中科實驗高級中學");
});

test("every central district school has a static decision page contract", async () => {
  const [page, catalog] = await Promise.all([
    read("app/schools/ct/[code]/page.tsx"),
    read("lib/central-schools.ts"),
  ]);

  assert.match(catalog, /schools\.csv\?raw/);
  assert.match(page, /generateStaticParams/);
  assert.match(page, /EducationalOrganization/);
  assert.match(page, /BreadcrumbList/);
  assert.match(page, /115 學年度/);
  assert.match(page, /官方資料來源/);
  assert.match(page, /SchoolPlannerAction/);
  assert.match(page, /district=ct#calculator/);
  assert.match(page, /district=ct#analysis/);
});

test("central district search results link into the new school pages and preserve direct search", async () => {
  const [explorer, schoolsPage] = await Promise.all([
    read("components/school-explorer.tsx"),
    read("app/schools/page.tsx"),
  ]);

  assert.match(explorer, /href={`\/schools\/\$\{district\}\/\$\{school\.code\}`}/);
  assert.match(explorer, /initialQuery/);
  assert.match(schoolsPage, /q\?: string/);
});

test("the public sitemap exposes all central district school pages", async () => {
  const sitemap = await read("public/sitemap.xml");
  const schoolLocations = [...sitemap.matchAll(/<loc>https:\/\/jshs\.cc\/schools\/ct\/[^<]+<\/loc>/g)];

  assert.equal(schoolLocations.length, 96);
  assert.match(sitemap, /<loc>https:\/\/jshs\.cc\/schools\/ct\/060323<\/loc>/);
});

test("the homepage brand always uses the full Chinese name instead of JSHS", async () => {
  const [header, footer, homepage] = await Promise.all([
    read("components/site-header.tsx"),
    read("components/site-footer.tsx"),
    read("app/page.tsx"),
  ]);
  const publicHomepageShell = `${header}\n${footer}\n${homepage}`;

  assert.doesNotMatch(publicHomepageShell, />JSHS</);
  assert.doesNotMatch(publicHomepageShell, /JSHS NAVIGATION/);
  assert.doesNotMatch(publicHomepageShell, /JSHS 全國國中升學資訊網/);
  assert.match(header, /全國國中升學資訊網/);
  assert.match(footer, />全國國中升學資訊網</);
});

test("the central district school catalog is discoverable from every public menu", async () => {
  const [header, guide] = await Promise.all([
    read("components/site-header.tsx"),
    read("public/it_hs/guide.htm"),
  ]);

  assert.match(header, /label: "中投區學校資料", href: "\/schools\?district=ct"/);
  assert.match(header, /label: "查校科", href: "\/schools\?district=ct"/);
  assert.match(header, /label: "找校科", href: "\/schools\?district=ct"/);
  assert.match(header, /label: "原校科查詢", href: "\/it_hs\/guide\.htm#schools"/);

  assert.match(guide, /href="\/schools\?district=ct"[^>]*><b>中投區學校資料<\/b>/);
  assert.match(guide, /href="\/schools\?district=ct"[^>]*data-nav-search-item="查校科/);
  assert.match(guide, /href="\/schools\?district=ct"[^>]*><span aria-hidden="true">校<\/span>找校科<\/a>/);
  assert.match(guide, /data-page="schools"[^>]*><b>全國校科查詢<\/b>/);
});
