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
  new URL("../components/planner-mode-workspace.tsx", import.meta.url),
];

test("design tokens follow the JSHS Design System V1 education guide", async () => {
  const tokens = await readFile(tokenCssUrl, "utf8");

  assert.match(tokens, /--bg-page:\s*#F7F9FC/i);
  assert.match(tokens, /--text-primary:\s*#172033/i);
  assert.match(tokens, /--text-secondary:\s*#667085/i);
  assert.match(tokens, /--border-light:\s*#E7EAF0/i);
  assert.match(tokens, /--brand-primary:\s*#1A73E8/i);
  assert.match(tokens, /--success:\s*#34A853/i);
  assert.match(tokens, /--planner:\s*#F9AB00/i);
  assert.match(tokens, /--guide:\s*#8B5CF6/i);
  assert.match(tokens, /--radius-sm:\s*8px/i);
  assert.match(tokens, /--radius-md:\s*12px/i);
  assert.match(tokens, /--radius-lg:\s*16px/i);
  assert.match(tokens, /--radius-xl:\s*20px/i);
  assert.match(tokens, /--radius-full:\s*999px/i);
  assert.match(tokens, /--content-max:\s*1200px/i);
  assert.match(tokens, /--font-system:\s*Inter,\s*"Noto Sans TC",\s*"PingFang TC",\s*"Microsoft JhengHei",\s*sans-serif/i);
  assert.match(tokens, /--font-weight-strong:\s*600/i);
  assert.match(tokens, /--font-size-body:\s*16px/i);
  assert.match(tokens, /--font-size-h1:\s*34px/i);
  assert.doesNotMatch(tokens, /organic-radius|#5D7052|#C18C5D|linear-gradient/i);
});

test("global app stylesheet uses system typography and shared component primitives", async () => {
  const [globalCss, publicAppCss] = await Promise.all([
    readFile(globalCssUrl, "utf8"),
    readFile(publicAppCssUrl, "utf8"),
  ]);

  assert.match(globalCss, /font-family:\s*var\(--font-system\)/);
  assert.match(globalCss, /main h1 \{ font-size: var\(--font-size-h1\) !important; \}/);
  assert.match(globalCss, /main h2 \{ font-size: var\(--font-size-h2\) !important; \}/);
  assert.match(globalCss, /\.jshs-page-shell/);
  assert.match(globalCss, /\.jshs-surface-card/);
  assert.match(globalCss, /\.jshs-button-primary/);
  assert.match(globalCss, /\.jshs-input/);
  assert.match(globalCss, /\.jshs-table/);
  assert.match(globalCss, /Education platform visual system/);
  assert.match(globalCss, /backdrop-filter:\s*none/);
  // The homepage hero intentionally owns its gradients as part of the full-bleed
  // editorial treatment; the shared system still must not import decorative fonts
  // or apply global blending/organic treatments.
  assert.doesNotMatch(globalCss, /fonts\.googleapis|Fraunces|Nunito|body::before|mix-blend-mode|organic/i);
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

test("homepage uses a next-step guide and compact fixed four-colour actions", async () => {
  const [home, nextStep] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/home-next-step.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(home, /HomeNextStep/);
  assert.match(home, /HomeQuickActions/);
  assert.doesNotMatch(home, /jshs-home-task-(?:grid|card)/);
  for (const tone of ["school", "score", "planner", "guide"]) assert.match(nextStep, new RegExp(`tone: "${tone}"`));
  assert.match(nextStep, /SiteIcon/);
  assert.doesNotMatch(nextStep, /[▤⌂∑☷]/);
  assert.match(home, /jshs-home-hero/);
  assert.doesNotMatch(home, /StatusItem[^\n]*border-b/);
  assert.doesNotMatch(home, /districtMetadata\.disclaimer[^\n]*border-t/);
});
