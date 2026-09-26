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
  assert.match(css, /@media \(min-width:1180px\) \{[\s\S]*?\.jshs-v2-home \.jshs-header-inner \{[^}]*display:grid;[^}]*grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\);[^}]*height:72px;/);
  assert.match(css, /\.jshs-v2-home \.jshs-brand-wordmark strong \{[^}]*font-weight:700;/s);
  assert.match(css, /\.jshs-v2-home \.jshs-desktop-nav \{[^}]*gap:20px;[^}]*height:72px;[^}]*justify-self:center;/s);
  assert.match(css, /\.jshs-v2-home \.jshs-desktop-more > button \{[^}]*font-size:14px;[^}]*font-weight:600;[^}]*gap:4px;[^}]*height:44px;[^}]*min-height:44px;[^}]*padding-inline:7px;/s);
  assert.match(css, /\.jshs-v2-home \.jshs-home-header-search \{[^}]*height:44px;[^}]*width:44px;/s);
  assert.match(css, /\.jshs-v2-home \.jshs-login-link \{[^}]*height:44px;[^}]*padding-inline:14px;/s);
  assert.match(css, /\.jshs-header-menu-button,\.mobile-bottom-nav \{ display:none !important; \}/);
  assert.match(menu, /name="chevron-down" size=\{12\}/);
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
