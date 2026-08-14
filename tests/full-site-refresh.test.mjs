import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const guideUrl = new URL("../public/it_hs/guide.htm", import.meta.url);
const guideCssUrl = new URL("../public/it_hs/guide.css", import.meta.url);
const guideScriptUrl = new URL("../public/it_hs/guide.js", import.meta.url);

test("the original admission app uses the unified JSHS public shell", async () => {
  const guide = await readFile(guideUrl, "utf8");

  assert.match(guide, /data-guide-shell="unified-2026"/);
  assert.match(guide, /<nav class="guide-primary-nav" aria-label="主要導覽">/);
  assert.match(guide, />升學指南</);
  assert.match(guide, />找校科</);
  assert.match(guide, />試算工具</);
  assert.match(guide, /href="#analysis"[^>]*data-page="analysis"[^>]*>我的規劃/);
  const primaryNavigation = guide.match(/<nav class="guide-primary-nav"[\s\S]*?<\/nav>/)?.[0] || "";
  assert.doesNotMatch(primaryNavigation, />就學區</);
  assert.match(guide, /class="guide-workspace-bar"/);
  assert.match(guide, /class="guide-footer"/);
});

test("the guide mobile drawer prioritizes search and four quick tasks without the duplicate workbench menu", async () => {
  const guide = await readFile(guideUrl, "utf8");

  assert.match(guide, /id="mobileMenu"[^>]+role="dialog"[^>]+aria-modal="true"/);
  assert.match(guide, /id="guideMenuSearch"[^>]+placeholder="搜尋內容與功能"/);
  for (const label of ["查校科", "算積分", "看時程", "排志願"]) assert.match(guide, new RegExp(`>${label}<`));
  assert.match(guide, /class="guide-mobile-bottom-nav"/);
  assert.doesNotMatch(guide, />工作台功能</);
});

test("the unified shell keeps every original interactive destination", async () => {
  const guide = await readFile(guideUrl, "utf8");

  for (const page of ["home", "overview", "admission", "calculator", "analysis", "schools", "download", "faq"]) {
    assert.match(guide, new RegExp(`data-page-section=["']${page}["']`));
  }
  for (const id of ["schoolSearch", "schoolGrid", "resPoints", "analysisResults", "wishlistSearch", "plannerTimelineList"]) {
    assert.match(guide, new RegExp(`id=["']${id}["']`));
  }
});

test("the guide stylesheet inherits the homepage design system at desktop and mobile sizes", async () => {
  const css = await readFile(guideCssUrl, "utf8");

  assert.match(css, /Unified JSHS 2026 public shell/);
  assert.match(css, /--guide-shell-width:\s*1180px/);
  assert.match(css, /\.guide-primary-nav/);
  assert.match(css, /\.guide-workspace-bar/);
  assert.match(css, /\.guide-footer/);
  assert.match(css, /\.guide-mobile-drawer/);
  assert.match(css, /\.guide-mobile-bottom-nav/);
  assert.match(css, /\.line-header-link:not\(\.is-ready\)/);
  assert.match(css, /@media \(max-width:\s*768px\)/);
  assert.match(css, /var\(--jshs-navy\)/);
  assert.match(css, /var\(--jshs-blue\)/);
});

test("routing from the mobile menu closes both its visual and accessible state", async () => {
  const script = await readFile(guideScriptUrl, "utf8");

  assert.match(script, /function setMobileMenuOpen\(open\)/);
  assert.match(script, /document\.body\.classList\.toggle\('guide-nav-open', open\)/);
  assert.match(script, /setMobileMenuOpen\(false\)/);
});

test("deep links render their requested tool before Cloudflare state finishes loading", async () => {
  const script = await readFile(guideScriptUrl, "utf8");
  const start = script.indexOf("window.addEventListener('DOMContentLoaded'");
  const boot = script.slice(start, start + 1800);
  const routerIndex = boot.indexOf("initPageRouter();");
  const dataIndex = boot.indexOf("await Promise.all([loadPlannerStore(), loadDistrictMetadata()]);");

  assert.ok(routerIndex >= 0, "the router must initialize during boot");
  assert.ok(dataIndex >= 0, "Cloudflare state and metadata should load in parallel");
  assert.ok(routerIndex < dataIndex, "the requested hash must render before network state completes");
});

test("calculator controls expose programmatic labels", async () => {
  const guide = await readFile(guideUrl, "utf8");
  const controls = ["prefScore", "weakScore", "mor_club_terms", "mor_service_learning", "nod_record", "subj_cn", "subj_en", "subj_math", "subj_sci", "subj_soc", "subj_write"];

  for (const id of controls) {
    assert.match(guide, new RegExp(`id=["']${id}["'][^>]+aria-label=["'][^"']+["']`));
  }
});
