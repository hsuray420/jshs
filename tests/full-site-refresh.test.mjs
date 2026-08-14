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
  assert.match(guide, /href="\/news#latest"[^>]*>升學情報/);
  assert.match(guide, /href="#schools"[^>]*data-page="schools"[^>]*>找學校/);
  assert.match(guide, /href="#calculator"[^>]*data-page="calculator"[^>]*>升學工具/);
  assert.match(guide, /href="#home"[^>]*data-page="home"[^>]*data-district-picker[^>]*>就學區/);
  assert.match(guide, /href="#analysis"[^>]*data-page="analysis"[^>]*>我的規劃/);
  assert.match(guide, /class="guide-workspace-bar"/);
  assert.match(guide, /class="guide-footer"/);
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
  assert.match(css, /\.line-header-link:not\(\.is-ready\)/);
  assert.match(css, /@media \(max-width:\s*768px\)/);
  assert.match(css, /var\(--jshs-navy\)/);
  assert.match(css, /var\(--jshs-blue\)/);
});

test("routing from the mobile menu closes both its visual and accessible state", async () => {
  const script = await readFile(guideScriptUrl, "utf8");

  assert.match(script, /mobileMenu\.classList\.add\('hidden'\)/);
  assert.match(script, /mobileMenuBtn\?\.setAttribute\('aria-expanded', 'false'\)/);
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
