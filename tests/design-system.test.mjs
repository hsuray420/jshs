import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokenCssUrl = new URL("../public/design-tokens.css", import.meta.url);
const globalCssUrl = new URL("../app/globals.css", import.meta.url);
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

test("design tokens define the Apple Notion visual system", async () => {
  const tokens = await readFile(tokenCssUrl, "utf8");

  assert.match(tokens, /--bg-page:\s*#FFFFFF/i);
  assert.match(tokens, /--bg-subtle:\s*#F5F5F7/i);
  assert.match(tokens, /--text-primary:\s*#1D1D1F/i);
  assert.match(tokens, /--text-secondary:\s*#6E6E73/i);
  assert.match(tokens, /--border-light:\s*#E5E5E7/i);
  assert.match(tokens, /--radius-sm:\s*8px/i);
  assert.match(tokens, /--radius-md:\s*12px/i);
  assert.match(tokens, /--radius-lg:\s*16px/i);
  assert.match(tokens, /--radius-xl:\s*20px/i);
  assert.match(tokens, /--radius-full:\s*999px/i);
  assert.doesNotMatch(tokens, /--jshs-background:\s*#FDFCF8/i);
  assert.doesNotMatch(tokens, /organic-radius|#5D7052|#C18C5D/i);
});

test("global app stylesheet uses system typography and shared component primitives", async () => {
  const globalCss = await readFile(globalCssUrl, "utf8");

  assert.match(globalCss, /-apple-system,\s*BlinkMacSystemFont/);
  assert.match(globalCss, /\.jshs-page-shell/);
  assert.match(globalCss, /\.jshs-surface-card/);
  assert.match(globalCss, /\.jshs-button-primary/);
  assert.match(globalCss, /\.jshs-input/);
  assert.match(globalCss, /\.jshs-table/);
  assert.match(globalCss, /Apple Notion design system/);
  assert.doesNotMatch(globalCss, /fonts\.googleapis|Fraunces|Nunito|body::before|mix-blend-mode|organic/i);
});

test("admin and legacy guide inherit the same Apple Notion system", async () => {
  const [adminCss, guideCss, guideTailwindSource] = await Promise.all([
    readFile(adminCssUrl, "utf8"),
    readFile(guideCssUrl, "utf8"),
    readFile(guideTailwindSourceUrl, "utf8"),
  ]);

  for (const css of [adminCss, guideCss, guideTailwindSource]) {
    assert.match(css, /#FFFFFF/i);
    assert.match(css, /#F5F5F7/i);
    assert.match(css, /#1D1D1F/i);
    assert.match(css, /-apple-system,\s*BlinkMacSystemFont/);
    assert.doesNotMatch(css, /Plus Jakarta Sans|Fraunces|Nunito|linear-gradient\(135deg,\s*var\(--admin-primary/i);
  }

  assert.match(adminCss, /Admin Apple Notion final layer/);
  assert.match(guideCss, /Guide Apple Notion final layer/);
});

test("core visitor surfaces use neutral design-system primitives for future pages", async () => {
  for (const url of surfaceUrls) {
    const source = await readFile(url, "utf8");
    assert.match(source, /jshs-page-shell|jshs-hero-section|jshs-section|jshs-surface-card|jshs-button/);
    assert.doesNotMatch(source, /jshs-organic|jshs-hero-band|jshs-pill-button|jshs-primary-action|jshs-secondary-action/);
  }
});
