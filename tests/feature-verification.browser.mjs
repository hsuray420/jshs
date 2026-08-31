import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/ray/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const baseURL = process.env.FEATURE_VERIFY_BASE_URL || "http://localhost:4173";
const outputPath = "artifacts/feature-verification-browser.json";
const routes = [
  "/schools", "/schools/map", "/schools/compare", "/schools/commute", "/schools/history", "/schools/groups",
  "/tools", "/tools/rules", "/tools/placement", "/tools/summary", "/tools/history",
  "/planner/custom", "/planner/recommend", "/planner/versions", "/planner/export",
  "/schedule", "/schedule/timeline", "/schedule/now", "/schedule/tasks",
  "/admission-guides", "/news", "/trust", "/trust/sources", "/trust/progress", "/trust/methodology", "/trust/versions",
];
const viewports = [[320, 740], [375, 812], [390, 844], [430, 932], [768, 1024], [1024, 900], [1280, 900], [1440, 960]];
const result = { baseURL, generatedAt: new Date().toISOString(), routes: {}, scenarios: {} };
const browser = await chromium.launch({ headless: true });

async function inspectRoute(route, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const consoleErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(250);
  const metrics = await page.evaluate(() => ({
    title: document.title,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
    hasHeader: Boolean(document.querySelector("header")),
    hasMain: Boolean(document.querySelector("main")),
    text: document.body.innerText.slice(0, 500),
  }));
  await page.close();
  return { status: response?.status() ?? 0, ...metrics, overflow: metrics.bodyWidth > width + 1, consoleErrors };
}

for (const route of routes) {
  result.routes[route] = [];
  for (const [width, height] of viewports) {
    try { result.routes[route].push({ viewport: `${width}x${height}`, ...(await inspectRoute(route, width, height)) }); }
    catch (error) { result.routes[route].push({ viewport: `${width}x${height}`, error: String(error) }); }
  }
}

async function scenario(name, run) {
  try { result.scenarios[name] = { passed: await run() }; }
  catch (error) { result.scenarios[name] = { passed: false, error: String(error) }; }
}

await scenario("history_loading_empty_error_invalid_and_mobile", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route("**/it_hs/historical-records.json", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ records: [] }) });
  });
  await page.goto(`${baseURL}/schools/history`, { waitUntil: "domcontentloaded" });
  const loading = await page.getByText("正在載入歷年資料").isVisible();
  await page.getByText("目前沒有找到這個年度的官方歷史資料。").waitFor();
  const empty = await page.getByText("目前沒有符合條件的社群參考紀錄。").isVisible();
  await page.unrouteAll();
  await page.route("**/it_hs/historical-records.json", (route) => route.fulfill({ status: 500, body: "server failure" }));
  await page.reload({ waitUntil: "networkidle" });
  const error = await page.getByText("歷年資料暫時無法載入").isVisible();
  await page.unrouteAll();
  await page.route("**/it_hs/historical-records.json", (route) => route.fulfill({ contentType: "application/json", body: "not-json" }));
  await page.reload({ waitUntil: "networkidle" });
  const invalid = await page.getByText("歷年資料格式無法辨識").isVisible();
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
  await page.close();
  return loading && empty && error && invalid && !overflow;
});

await scenario("history_community_separation", async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${baseURL}/schools/history`, { waitUntil: "networkidle" });
  const sections = await page.locator("section").allTextContents();
  const official = sections.find((text) => text.includes("官方資料")) || "";
  const community = sections.find((text) => text.includes("社群參考資料")) || "";
  await page.close();
  return official.includes("目前沒有找到這個年度的官方歷史資料") && community.includes("社群參考資料");
});

await scenario("placement_no_prediction", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseURL}/tools/placement`, { waitUntil: "networkidle" });
  const text = await page.locator("main").innerText();
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
  await page.close();
  return text.includes("目前資料不足，無法提供可信的落點判斷") && !text.includes("你的落點") && !text.includes("穩定") && !overflow;
});

await scenario("recommend_discovery_not_prediction", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => localStorage.setItem("jshs_score_latest", JSON.stringify({ district: "ct", result: { totalScore: 50 } })));
  await page.goto(`${baseURL}/planner/recommend`, { waitUntil: "networkidle" });
  const text = await page.locator("main").innerText();
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
  await page.close();
  return text.includes("志願探索") && text.includes("位於你的就學區") && !/錄取率|上榜率|適中|衝刺/.test(text) && !overflow;
});

await scenario("news_portal_is_not_announcement", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseURL}/news`, { waitUntil: "networkidle" });
  const text = await page.locator("main").innerText();
  await page.close();
  return text.includes("目前沒有可驗證的官方公告紀錄") && text.includes("官方入口不是公告紀錄");
});

await scenario("trust_history_not_verified", async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${baseURL}/trust/progress`, { waitUntil: "networkidle" });
  const rows = await page.locator("tbody tr").allTextContents();
  await page.close();
  return rows.some((row) => /UNAVAILABLE|PARTIAL/.test(row));
});

await scenario("groups_search_empty_and_back", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseURL}/schools/groups`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("例如：電機、餐旅").fill("不存在的群別");
  const empty = await page.getByText("找不到符合條件的群別").isVisible();
  await page.goto(`${baseURL}/schools`, { waitUntil: "networkidle" });
  await page.goBack({ waitUntil: "networkidle" });
  const restored = await page.getByText("技高群科探索").isVisible();
  await page.close();
  return empty && restored;
});

await scenario("commute_osrm_failure_no_minutes", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    localStorage.setItem("jshs_district", "ct");
    localStorage.setItem("jshs_intro_acknowledged", "1");
  });
  await page.route("**/api/school-geocode?district=*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ coordinates: { "ct:050314": { lat: 24.18, lon: 120.65 } } }) }));
  await page.route("**/api/school-geocode?q=*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ coordinate: { lat: 24.17, lon: 120.64 } }) }));
  await page.route("**/api/commute?*", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false }) }));
  await page.goto(`${baseURL}/schools/commute?district=ct`, { waitUntil: "networkidle" });
  await page.getByLabel("出發地／住家地址").fill("臺中市西屯區市政路");
  await page.getByRole("button", { name: "定位出發地" }).click();
  await page.getByRole("checkbox").first().check();
  await page.getByText("目前無法取得道路路線，因此不估算通勤時間。").waitFor();
  await page.waitForTimeout(500);
  const text = await page.locator("main").innerText();
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
  await page.close();
  return text.includes("直線距離參考") && text.includes("目前無法取得道路路線，因此不估算通勤時間。") && !/道路路線約\s*\d+\s*分鐘/.test(text) && !overflow;
});

await mkdir("artifacts", { recursive: true });
await writeFile(outputPath, JSON.stringify(result, null, 2));
await browser.close();
console.log(JSON.stringify({ outputPath, scenarios: result.scenarios, checkedRoutes: routes.length }, null, 2));
