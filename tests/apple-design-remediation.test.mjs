import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

function relativeLuminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(first, second) {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("shared navigation keeps account access, 44px targets, and Escape dismissal", async () => {
  const [header, css] = await Promise.all([read("components/site-header.tsx"), read("app/globals.css")]);
  assert.match(header, /event\.key === "Escape"[^}]*closeDrawer\(\)/s);
  assert.match(header, /href="\/account"[^>]*aria-label="帳號"/);
  assert.doesNotMatch(css, /a\[aria-label="帳號"\]\s*\{\s*display:\s*none/);
  assert.match(css, /@media \(max-width:359px\)[^{]*\{[^}]*\.jshs-site-header \.jshs-home-header-search \{ display:none; \}/s);
  assert.match(css, /\.jshs-home-header-search,\.jshs-login-link\s*\{[^}]*min-height:44px/s);
  assert.match(css, /\.jshs-home-header-search\s*\{[^}]*width:44px/s);
  assert.match(css, /\.jshs-login-link > svg\s*\{[^}]*flex:0 0 auto/s);
  assert.match(css, /@media \(max-width:1359px\)\s*\{\s*\.jshs-desktop-nav\s*\{\s*display:none !important;/s);
  assert.match(css, /\.jshs-v2-home \.jshs-v2-search button\s*\{[^}]*height:44px[^}]*width:44px/s);
});

test("calculator first render is deterministic before local storage hydration", async () => {
  const calculator = await read("components/admission-calculator.tsx");
  assert.match(calculator, /useState\(false\)/);
  assert.doesNotMatch(calculator, /useState\(\(\) => typeof window !== "undefined"/);
});

test("page templates expose one main landmark and one page-level heading", async () => {
  const [detail, knowledge, eligibility, calculator, official] = await Promise.all([
    read("components/school-detail-client.tsx"),
    read("components/knowledge-topic-workspace.tsx"),
    read("components/admission-path-finder.tsx"),
    read("components/admission-calculator.tsx"),
    read("components/official-information-explorer.tsx"),
  ]);
  assert.doesNotMatch(detail, /<main className="sv-container sv-detail-content"/);
  for (const source of [knowledge, eligibility, calculator, official]) assert.doesNotMatch(source, /<h1/);
});

test("not-found page retains the shared site shell", async () => {
  const notFound = await read("app/not-found.tsx");
  assert.match(notFound, /<SiteHeader/);
  assert.match(notFound, /<SiteFooter/);
});

test("feature actions and school metadata meet audited contrast and target thresholds", async () => {
  const [css, schoolCss] = await Promise.all([read("app/globals.css"), read("components/schools-v2.css")]);
  const score = css.match(/\.jshs-feature-score\s*\{\s*--brand-primary:\s*(#[\da-f]{6})/i)?.[1];
  const planner = css.match(/\.jshs-feature-planner\s*\{\s*--brand-primary:\s*(#[\da-f]{6})/i)?.[1];
  assert.ok(score && contrast(score, "#ffffff") >= 4.5, "score action color must contrast with white");
  assert.ok(planner && contrast(planner, "#ffffff") >= 4.5, "planner action color must contrast with white");
  assert.match(schoolCss, /\.sv-place\s*\{\s*color:\s*#526b86/i);
  assert.match(schoolCss, /\.sv-school-media-placeholder\s*\{[^}]*color:\s*#55708f/is);
  assert.match(schoolCss, /\.sv-favorite-button\s*\{[^}]*min-height:44px[^}]*min-width:44px/is);
});
