import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokenCssUrl = new URL("../public/design-tokens.css", import.meta.url);
const globalCssUrl = new URL("../app/globals.css", import.meta.url);
const publicAppCssUrl = new URL("../public/app/globals.css", import.meta.url);
const adminCssUrl = new URL("../app/admin/styles.css", import.meta.url);
const guideCssUrl = new URL("../public/it_hs/guide.css", import.meta.url);
const guideTailwindSourceUrl = new URL("../styles/guide-tailwind.css", import.meta.url);
const surfaceUrls = [
  new URL("../app/page.tsx", import.meta.url),
  new URL("../components/site-header.tsx", import.meta.url),
  new URL("../components/site-footer.tsx", import.meta.url),
  new URL("../components/school-explorer.tsx", import.meta.url),
  new URL("../components/admission-calculator.tsx", import.meta.url),
  new URL("../components/planner-workspace.tsx", import.meta.url),
];

test("design tokens follow the education iOS visual guide", async () => {
  const tokens = await readFile(tokenCssUrl, "utf8");

  assert.match(tokens, /--bg-page:\s*#F2F2F7/i);
  assert.match(tokens, /--bg-subtle:\s*#F2F2F7/i);
  assert.match(tokens, /--text-primary:\s*#1C1C1E/i);
  assert.match(tokens, /--text-secondary:\s*#8E8E93/i);
  assert.match(tokens, /--border-light:\s*#E5E5EA/i);
  assert.match(tokens, /--brand-primary:\s*#007AFF/i);
  assert.match(tokens, /--success:\s*#34C759/i);
  assert.match(tokens, /--brand-tint:\s*#E8F2FF/i);
  assert.match(tokens, /--radius-sm:\s*9px/i);
  assert.match(tokens, /--radius-md:\s*20px/i);
  assert.match(tokens, /--radius-lg:\s*16px/i);
  assert.match(tokens, /--radius-xl:\s*20px/i);
  assert.match(tokens, /--radius-full:\s*999px/i);
  assert.match(tokens, /--shadow-hover:\s*0 8px 20px rgba\(0, 0, 0, \.08\)/i);
  assert.match(tokens, /--font-system:\s*-apple-system,\s*"SF Pro Text",\s*"PingFang TC",\s*"Noto Sans TC",\s*"Helvetica Neue",\s*Arial,\s*sans-serif/i);
  assert.match(tokens, /--font-weight-strong:\s*600/i);
  assert.doesNotMatch(tokens, /organic-radius|#5D7052|#C18C5D|linear-gradient/i);
});

test("global app stylesheet uses system typography and shared component primitives", async () => {
  const [globalCss, publicAppCss] = await Promise.all([
    readFile(globalCssUrl, "utf8"),
    readFile(publicAppCssUrl, "utf8"),
  ]);

  assert.match(globalCss, /font-family:\s*var\(--font-system\)/);
  assert.match(globalCss, /\.jshs-page-shell/);
  assert.match(globalCss, /\.jshs-surface-card/);
  assert.match(globalCss, /\.jshs-button-primary/);
  assert.match(globalCss, /\.jshs-input/);
  assert.match(globalCss, /\.jshs-table/);
  assert.match(globalCss, /Education platform visual system/);
  assert.match(globalCss, /backdrop-filter:\s*none/);
  assert.doesNotMatch(globalCss, /fonts\.googleapis|Fraunces|Nunito|body::before|mix-blend-mode|linear-gradient|organic/i);
  assert.match(publicAppCss, /tailwindcss v4/);
  assert.match(publicAppCss, /@import url\("\/design-tokens\.css"\)/);
  assert.match(publicAppCss, /\.jshs-surface-card/);
});

test("admin and legacy guide inherit the same education iOS system", async () => {
  const [adminCss, guideCss, guideTailwindSource] = await Promise.all([
    readFile(adminCssUrl, "utf8"),
    readFile(guideCssUrl, "utf8"),
    readFile(guideTailwindSourceUrl, "utf8"),
  ]);

  for (const css of [adminCss, guideCss, guideTailwindSource]) {
    assert.match(css, /#FFFFFF/i);
    assert.match(css, /#F2F2F7/i);
    assert.match(css, /#1C1C1E/i);
    assert.match(css, /#007AFF/i);
    assert.match(css, /-apple-system,\s*"SF Pro Text",\s*"PingFang TC",\s*"Noto Sans TC"/);
    assert.doesNotMatch(css, /Plus Jakarta Sans|Fraunces|Nunito|linear-gradient\(135deg,\s*var\(--admin-primary/i);
  }

  assert.match(adminCss, /Education design guide v2/);
  assert.match(guideCss, /Education design guide v2/);
  assert.match(guideCss, /font-family: -apple-system, "SF Pro Text", "PingFang TC", "Noto Sans TC"/);
});

test("core visitor surfaces use neutral design-system primitives for future pages", async () => {
  for (const url of surfaceUrls) {
    const source = await readFile(url, "utf8");
    assert.match(source, /jshs-page-shell|jshs-hero-section|jshs-section|jshs-surface-card|jshs-button/);
    assert.doesNotMatch(source, /jshs-organic|jshs-hero-band|jshs-pill-button|jshs-primary-action|jshs-secondary-action/);
  }
});

test("homepage task cards use icon tiles and grouped context spacing", async () => {
  const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.equal((home.match(/className=\{`jshs-icon-tile jshs-task-icon/g) || []).length, 1);
  assert.match(home, /jshs-task-icon/);
  assert.match(home, /jshs-info-group-title/);
  assert.doesNotMatch(home, /StatusItem[^\n]*border-b/);
  assert.doesNotMatch(home, /districtMetadata\.disclaimer[^\n]*border-t/);
});
