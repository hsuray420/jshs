import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const googleTagId = "G-Y9298RKYMZ";

async function listPublicHtmlFiles(dir = new URL("../public/", import.meta.url), prefix = "public/") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childPrefix = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...await listPublicHtmlFiles(new URL(`${entry.name}/`, dir), `${childPrefix}/`));
      continue;
    }
    if (/\.(html|htm)$/i.test(entry.name)) files.push(childPrefix);
  }

  return files;
}

test("production UI has only the approved Google tag runtime script and no remote data fallback", async () => {
  const [layout, fiveYear, guide, siteConfig] = await Promise.all([
    readSource("app/layout.tsx"),
    readSource("public/it_5/it_5.html"),
    readSource("public/it_hs/guide.htm"),
    readSource("public/it_hs/site-config.js"),
  ]);

  for (const source of [layout, fiveYear, guide]) {
    assert.doesNotMatch(source, /googlesyndication|fonts\.googleapis|fonts\.gstatic|cdn\.tailwindcss/);
  }
  assert.match(layout, /googletagmanager\.com\/gtag\/js\?id=\$\{googleTagId\}/);
  assert.match(layout, new RegExp(`gtag\\('config', '\\$\\{googleTagId\\}'\\)`));
  assert.match(fiveYear, new RegExp(`googletagmanager\\.com/gtag/js\\?id=${googleTagId}`));
  assert.match(guide, new RegExp(`gtag\\('config', '${googleTagId}'\\)`));
  assert.match(guide, /href="guide-tailwind\.css/);
  assert.doesNotMatch(siteConfig, /tyctw\.github\.io|publicSchoolIndexSource/);
});

test("all static HTML entry points include exactly one Google tag", async () => {
  const htmlFiles = await listPublicHtmlFiles();
  assert.ok(htmlFiles.length >= 20);

  for (const path of htmlFiles) {
    const source = await readSource(path);
    assert.equal((source.match(/googletagmanager\.com\/gtag\/js/g) || []).length, 1, path);
    assert.equal((source.match(new RegExp(googleTagId, "g")) || []).length, 2, path);
    assert.match(source, /<head>\s*<!-- Google tag \(gtag\.js\) -->/i, path);
  }
});

test("school and planner data are served by Cloudflare Assets and D1", async () => {
  const [schoolRoute, plannerStore, plannerRoute, plannerStateRoute, legacyGuide, workerConfig] = await Promise.all([
    readSource("app/api/schools.csv/route.ts"),
    readSource("db/planner-store.ts"),
    readSource("app/api/planner/route.ts"),
    readSource("app/api/planner/state/route.ts"),
    readSource("public/it_hs/guide.js"),
    readSource("wrangler.jsonc"),
  ]);

  assert.match(schoolRoute, /env\.ASSETS\.fetch/);
  assert.match(schoolRoute, /district/);
  assert.match(plannerStore, /CREATE TABLE IF NOT EXISTS planner_items/);
  assert.match(plannerStore, /CREATE TABLE IF NOT EXISTS planner_states/);
  assert.match(plannerStore, /\.prepare\(/);
  assert.match(plannerStore, /\.bind\(/);
  assert.match(plannerRoute, /HttpOnly/);
  assert.match(plannerStateRoute, /export async function PUT/);
  assert.match(legacyGuide, /fetch\('\/api\/planner\/state'/);
  assert.match(legacyGuide, /await Promise\.all\(\[loadPlannerStore\(\), loadDistrictMetadata\(\)\]\)/);
  assert.match(workerConfig, /"binding": "ASSETS"/);
  assert.match(workerConfig, /"binding": "DB"/);
});

test("admin uploads use Cloudflare D1 instead of an unavailable external file layer", async () => {
  const [store, filesRoute, csvRoute, downloadRoute] = await Promise.all([
    readSource("db/admin-store.ts"),
    readSource("app/api/admin/files/route.ts"),
    readSource("app/api/admin/schools-csv/route.ts"),
    readSource("app/api/files/[id]/route.ts"),
  ]);

  for (const source of [store, filesRoute, csvRoute, downloadRoute]) {
    assert.doesNotMatch(source, /getR2|R2Bucket|\.FILES/);
  }
  assert.match(store, /file_blob/);
  assert.match(filesRoute, /arrayBuffer/);
});

test("local source changes are gated through GitHub Actions before Cloudflare deploy", async () => {
  const [pkg, workflow, agents] = await Promise.all([
    readSource("package.json"),
    readSource(".github/workflows/cloudflare-deploy.yml"),
    readSource("AGENTS.md"),
  ]);

  assert.match(pkg, /"test":\s*"pnpm run validate:content && pnpm run typecheck && pnpm run build && node --test tests\/\*\.test\.mjs"/);
  assert.match(workflow, /on:\s*\n\s*push:\s*\n\s*branches:\s*\n\s*-\s*main/);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /pnpm test/);
  assert.match(workflow, /wrangler deploy --keep-vars/);
  assert.match(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.match(agents, /Push `main` to GitHub remote `github`/);
  assert.match(agents, /Let GitHub Actions deploy `jshs\.cc` from GitHub/);
});

test("health status follows Cloudflare core services, not optional LINE integrations", async () => {
  const healthRoute = await readSource("app/api/health/route.ts");

  assert.match(healthRoute, /const coreOk = database/);
  assert.match(healthRoute, /status: coreOk \? 200 : 503/);
  assert.match(healthRoute, /integrations/);
});
