import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/ray/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const baseURL = process.env.FEATURE_VERIFY_BASE_URL || "http://localhost:3000";
const routes = ["/trust", "/trust/about", "/trust/sponsor", "/trust/updates", "/trust/report"];
const viewports = [320, 375, 390, 430];

test("public release trust routes render without mobile overflow or fatal browser errors", async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const route of routes) for (const width of viewports) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const consoleErrors = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      page.on("pageerror", (error) => consoleErrors.push(String(error)));
      const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 15_000 });
      const metrics = await page.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewportWidth: window.innerWidth, hasMain: Boolean(document.querySelector("main")) }));
      const actionableErrors = consoleErrors.filter((message) => {
        const isVinextDevNoise = baseURL.includes("localhost") && (
          message.includes("virtual:vite-rsc/entry-browser") ||
          message.includes("Failed to load resource: the server responded with a status of 404")
        );
        return !isVinextDevNoise;
      });
      if (response?.status() !== 200 || !metrics.hasMain || metrics.bodyWidth > metrics.viewportWidth + 1 || actionableErrors.length) {
        failures.push({ route, width, status: response?.status(), metrics, consoleErrors: actionableErrors });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  assert.deepEqual(failures, []);
});
