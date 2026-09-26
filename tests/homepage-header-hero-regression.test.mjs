import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");
const textualExtensions = new Set([".css", ".htm", ".html", ".js", ".json", ".md", ".mjs", ".svg", ".ts", ".tsx", ".txt"]);

async function collectTextFiles(directory) {
  const entries = await readdir(new URL(`${directory}/`, root), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTextFiles(path));
    else if (textualExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

test("the homepage hero asset stays above the page background at every viewport", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /\.jshs-v2-home \.jshs-v2-hero-image \{[^}]*background-image:url\("\/images\/hero-students-production\.png"\);[^}]*z-index:0;/s);
  assert.match(css, /\.jshs-v2-home \.jshs-v2-hero-content \{[^}]*position:relative;[^}]*z-index:1;/s);
});

test("desktop header uses a collision-safe three-zone layout and calibrated controls", async () => {
  const [css, menu] = await Promise.all([source("app/globals.css"), source("components/navigation/mega-menu.tsx")]);
  assert.match(css, /@media \(min-width:1200px\) \{[\s\S]*?\.jshs-header-inner \{[^}]*display:grid;[^}]*grid-template-columns:max-content minmax\(0,1fr\) max-content;[^}]*height:76px;[^}]*max-width:1680px;[^}]*padding-inline:clamp\(32px,3vw,48px\);/);
  assert.match(css, /\.jshs-v2-home \.jshs-brand-wordmark strong \{[^}]*font-weight:700;/s);
  assert.match(css, /\.jshs-desktop-nav \{[^}]*gap:clamp\(12px,1\.82vw,28px\);[^}]*height:76px;[^}]*justify-content:center;[^}]*justify-self:stretch;/s);
  assert.match(css, /\.jshs-desktop-more > button \{[^}]*font-size:clamp\(13px,1\.04vw,16px\);[^}]*font-weight:560;[^}]*gap:6px;[^}]*height:44px;[^}]*min-height:44px;[^}]*padding-inline:0;/s);
  assert.match(css, /\.jshs-home-header-search \{[^}]*height:44px;[^}]*width:44px;/s);
  assert.match(css, /\.jshs-login-link \{[^}]*height:44px;[^}]*padding-inline:14px;/s);
  assert.match(css, /\.jshs-header-menu-button,\.mobile-bottom-nav \{ display:none !important; \}/);
  assert.match(css, /@media \(max-width:1199px\)\s*\{[\s\S]*?\.jshs-desktop-nav\s*\{\s*display:none !important;[^}]*\}[\s\S]*?\.jshs-header-menu-button\s*\{\s*display:grid !important;/);
  assert.match(menu, /name="chevron-down" size=\{16\}/);
});

test("the only formal public site name is 全國國中升學資訊網", async () => {
  assert.match(await source("lib/brand.ts"), /SITE_NAME = "全國國中升學資訊網"/);
  const files = (await Promise.all(["app", "components", "content", "lib", "public"].map(collectTextFiles))).flat();
  const offenders = [];
  for (const path of files) {
    if ((await source(path)).includes("全國國中生升學資訊網")) offenders.push(path);
  }
  assert.deepEqual(offenders, [], `incorrect formal site name remains in: ${offenders.join(", ")}`);
});
