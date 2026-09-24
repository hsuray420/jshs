import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const siteMapUrl = new URL("../content/site-map.json", import.meta.url);
const headerUrl = new URL("../components/site-header.tsx", import.meta.url);
const megaMenuUrl = new URL("../components/navigation/mega-menu.tsx", import.meta.url);
const footerUrl = new URL("../components/site-footer.tsx", import.meta.url);
const globalsUrl = new URL("../app/globals.css", import.meta.url);
const assistantUrl = new URL("../components/ai-assistant.tsx", import.meta.url);
const expectedGroups = ["找學校", "模擬考", "成績分析", "我的志願", "日程", "升學指南", "資料與信任"];
const requiredLabels = [
  "全國校科查詢", "歷年錄取", "學長姐分享", "學校地圖", "費用試算", "通勤比較", "群科介紹",
  "模擬考", "模擬考中心", "對答案", "我的模考", "成績趨勢", "模考落點",
  "會考與免試", "成績積分試算", "積分規則", "個人積分摘要", "升學總覽", "重要時程",
  "現在該做什麼", "我的待辦", "自己排", "志願探索", "版本紀錄", "列印／下載", "官方選填平台",
  "特殊入學與資格", "升學入門", "志願與積分", "升學百科", "生涯探索", "升學動態", "資料來源", "資料更新狀態",
  "15 區建置進度", "試算與分析方法", "資料版本紀錄", "錯誤回報", "平台可信度說明",
  "關於本站", "支持／合作", "聯絡我們", "服務狀態", "隱私權政策", "服務條款", "Cookie／資料使用說明",
];

function collectLabels(items) { return items.flatMap(({ label, children = [] }) => [label, ...collectLabels(children)]); }

test("site map defines the final seven menu groups from the product navigation", async () => {
  const siteMap = JSON.parse(await readFile(siteMapUrl, "utf8"));
  assert.deepEqual(siteMap.menuGroups.map(({ label }) => label), expectedGroups);
  const labels = siteMap.menuGroups.flatMap(({ items }) => collectLabels(items));
  for (const label of requiredLabels) assert.ok(labels.includes(label), `missing menu item: ${label}`);
});

test("desktop and mobile navigation render the same complete submenu model", async () => {
  const [header, megaMenu, footer] = await Promise.all([readFile(headerUrl, "utf8"), readFile(megaMenuUrl, "utf8"), readFile(footerUrl, "utf8")]);
  assert.match(header, /menuGroups\.map/);
  assert.match(header, /mobileNavigation = primaryNavigation/);
  assert.match(header, /mobileNavigation\.map/);
  assert.match(header, /SITE_NAME/);
  assert.match(header, /aria-label="主要導覽"/);
  assert.match(header, /role="dialog"/);
  assert.match(header, /搜尋內容與功能/);
  assert.match(header, /mobile-bottom-nav/);
  assert.match(header, /SiteIcon/);
  assert.match(header, /jshs-mobile-nav-item/);
  assert.match(header, /開啟更多功能選單/);
  assert.match(header, /NavMobileAccordion/);
  assert.match(megaMenu, /jshs-mobile-group-heading/);
  assert.match(header, /NavMegaMenuItem/);
  assert.match(megaMenu, /查看全部/);
  assert.match(megaMenu, /jshs-desktop-more/);
  assert.match(header, /NavDropdown/);
  assert.match(megaMenu, /className=\{`jshs-desktop-more/);
  assert.match(megaMenu, /<button[\s\S]*aria-haspopup="menu"/);
  assert.match(header, /keepSingleDesktopMenu/);
  assert.match(header, /setOpenDesktopMenu\(null\)/);
  assert.match(header, /onNavigate=\{closeDesktopMenus\}/);
  assert.match(header, /components\/navigation\/mega-menu/);
  assert.doesNotMatch(header, /return <Link key=\{item\.href\}/);
  assert.doesNotMatch(header, /<details key=\{item\.label\} className=\{`jshs-mobile-group/);
  assert.doesNotMatch(header, /[♧♙⌕☰↗]/);
  assert.match(megaMenu, /group\.items/);
  assert.doesNotMatch(header, /功能準備中/);
  assert.match(footer, /footerGroups\.map/);
  assert.match(footer, /快速入口/);
  assert.match(footer, /資料與信任/);
  assert.match(footer, /法律/);
});

test("navigation menus use one shared data-driven mega-menu system", async () => {
  const [header, megaMenu, siteMap] = await Promise.all([readFile(headerUrl, "utf8"), readFile(megaMenuUrl, "utf8"), readFile(siteMapUrl, "utf8")]);
  const catalog = JSON.parse(siteMap);
  assert.match(header, /NavDropdown/);
  assert.match(header, /NavMobileAccordion/);
  assert.match(megaMenu, /export function NavMegaMenuItem/);
  assert.match(megaMenu, /export function NavDropdownHeader/);
  assert.match(megaMenu, /export function NavDropdownGrid/);
  assert.match(megaMenu, /export function NavDropdownSection/);
  assert.match(megaMenu, /export function NavDropdownFooter/);
  assert.match(megaMenu, /window\.innerWidth/);
  assert.match(megaMenu, /aria-expanded=\{open\}/);
  assert.doesNotMatch(header, /function DesktopNavigationGroup/);
  assert.doesNotMatch(header, /function MobileNavigationGroup/);
  assert.match(header, /aria-expanded=\{drawerOpen\}/);
  assert.ok(catalog.menuGroups.some(({ layout }) => layout === "compact"));
  assert.ok(catalog.menuGroups.some(({ items }) => items.some(({ section }) => section)));
  assert.ok(catalog.menuGroups.some(({ items }) => items.some(({ icon }) => icon)));
});

test("mega menu descriptions remain readable and floating surfaces are mutually exclusive", async () => {
  const [globals, header, assistant] = await Promise.all([readFile(globalsUrl, "utf8"), readFile(headerUrl, "utf8"), readFile(assistantUrl, "utf8")]);
  assert.match(globals, /\.jshs-nav-mega-item-copy span \{[^}]*overflow: visible;[^}]*overflow-wrap: anywhere;[^}]*white-space: normal;[^}]*word-break: break-word;/s);
  assert.match(globals, /\.jshs-nav-mega-footer \{[^}]*padding: 12px 16px 0;/s);
  assert.doesNotMatch(globals, /\.jshs-desktop-more > div \{/);
  assert.match(header, /new Event\("jshs:nav-open"\)/);
  assert.match(header, /jshs:ai-open/);
  assert.match(assistant, /new Event\("jshs:ai-open"\)/);
  assert.match(assistant, /jshs:nav-open/);
});
