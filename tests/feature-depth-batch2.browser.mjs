import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/ray/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const baseURL = process.env.FEATURE_VERIFY_BASE_URL || "http://localhost:4173";
const browser = await chromium.launch({ headless: true });
const result = {};

async function scenario(name, run) { try { result[name] = { passed: await run() }; } catch (error) { result[name] = { passed: false, error: String(error) }; } }
async function page(width = 390) { const current = await browser.newPage({ viewport: { width, height: 844 } }); await current.addInitScript(() => { localStorage.setItem("jshs_district", "ct"); localStorage.setItem("jshs_intro_acknowledged", "1"); }); return current; }

await scenario("tasks_add_edit_toggle_delete_and_refresh", async () => {
  const current = await page(); await current.goto(`${baseURL}/schedule/tasks?district=ct`, { waitUntil: "networkidle" });
  await current.getByLabel("新增自訂待辦").fill("整理報名資料"); await current.getByRole("button", { name: "新增" }).click();
  await current.reload({ waitUntil: "networkidle" }); const persisted = await current.getByText("整理報名資料").isVisible();
  await current.getByRole("button", { name: "編輯" }).click(); await current.getByLabel("編輯待辦").fill("整理官方報名資料"); await current.getByRole("button", { name: "儲存" }).click();
  await current.getByLabel("完成 整理官方報名資料").check(); await current.getByRole("button", { name: "刪除" }).click(); await current.getByRole("button", { name: "確認刪除" }).click();
  const deleted = await current.getByText("目前沒有自訂待辦。").isVisible(); await current.close(); return persisted && deleted;
});

await scenario("open_days_personal_record_with_and_without_source", async () => {
  const current = await page(); await current.goto(`${baseURL}/schools/open-days?district=ct`, { waitUntil: "networkidle" });
  const fields = current.locator("form input"); await fields.nth(0).fill("測試高中"); await fields.nth(1).fill("校園參訪"); await fields.nth(2).fill("2026-10-10"); await fields.nth(4).fill("校門口"); await fields.nth(6).fill("無來源個人紀錄"); await current.getByRole("button", { name: "新增開放日個人紀錄" }).click();
  const personal = await current.getByText("個人紀錄", { exact: true }).isVisible(); await current.getByRole("button", { name: "編輯" }).click(); await current.getByRole("button", { name: "編輯" }).click(); await current.getByRole("button", { name: "完成" }).click(); await current.getByRole("button", { name: "刪除" }).click(); await current.close(); return personal;
});

await scenario("export_pdf_has_traditional_chinese_no_question_marks", async () => {
  const current = await page(1280); await current.addInitScript(() => localStorage.setItem("jshs_local_planner_items", JSON.stringify([{ id: "p1", district: "ct", school_code: "050314", school_name: "國立卓蘭高級中等學校", department: "資訊科", tier: "", notes: "這是一段很長的繁體中文備註，用來驗證 PDF 文字不會被替換。", created_at: "2026-08-31" }])));
  await current.goto(`${baseURL}/planner/export`, { waitUntil: "networkidle" }); const download = await Promise.all([current.waitForEvent("download"), current.getByRole("button", { name: "下載 PDF" }).click()]).then(([value]) => value); const path = await download.path(); const bytes = path ? await (await import("node:fs/promises")).readFile(path) : Buffer.alloc(0); await current.close(); return bytes.includes(Buffer.from("MSung-Light")) && !bytes.includes(Buffer.from("?"));
});

await scenario("account_and_notification_unavailable_states", async () => {
  const current = await page(); await current.goto(`${baseURL}/account?error=line_callback`, { waitUntil: "networkidle" }); const cancelled = await current.getByText("登入取消").isVisible(); await current.goto(`${baseURL}/notifications/email`, { waitUntil: "networkidle" }); const email = await current.getByText("目前尚未提供 Email 通知").isVisible(); await current.goto(`${baseURL}/notifications/push`, { waitUntil: "networkidle" }); const push = await current.getByText("目前尚未提供手機推播").isVisible(); await current.close(); return cancelled && email && push;
});

await scenario("map_confidence_and_missing_coordinate_states", async () => {
  const current = await page(); await current.route("**/api/school-geocode?district=ct", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ coordinates: { "ct:050314": { schoolCode: "050314", lat: 24.2, lon: 120.8, coordinateSource: "overpass", matchedName: "x", matchMethod: "fuzzy_or_address", confidence: "low", verifiedAt: "2026-08-31" } }, matched: 1, total: 2 }) })); await current.goto(`${baseURL}/schools/map?district=ct`, { waitUntil: "networkidle" }); await current.getByText("此位置為自動比對，可能需要校正。").waitFor(); const missing = await current.getByText("尚未取得座標").count(); await current.close(); return missing > 0;
});

await browser.close();
console.log(JSON.stringify(result, null, 2));
if (Object.values(result).some((item) => !item.passed)) process.exitCode = 1;
