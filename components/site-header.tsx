"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { primaryNavigation } from "@/lib/site-map";

type NavigationLink = Readonly<{ label: string; href: string; description: string }>;

const navigationDetails: Readonly<Record<string, Readonly<{ eyebrow: string; description: string; links: readonly NavigationLink[] }>>> = {
  "/news": {
    eyebrow: "先理解，再做決定",
    description: "會考、規則、志願策略與生涯選擇，都從這裡開始。",
    links: [
      { label: "會考準備", href: "/news/exam", description: "重要時程、各科準備與應試提醒" },
      { label: "入學規則", href: "/news/rules", description: "免試入學、比序與跨區資格" },
      { label: "志願策略", href: "/news/strategy", description: "挑戰、適中、穩定三層規劃" },
      { label: "生涯與家長", href: "/news/career", description: "學制方向、家庭討論與新生準備" },
    ],
  },
  "/schools": {
    eyebrow: "把校名變成可比較的選項",
    description: "依就學區、學制、校科與生活條件探索適合的方向。",
    links: [
      { label: "全國校科查詢", href: "/it_hs/guide.htm#schools", description: "搜尋學校、科別、名額與地址" },
      { label: "高中職學制", href: "/it_hs/guide.htm#overview", description: "比較普高、技高與綜合高中" },
      { label: "校科探索指南", href: "/news/schools", description: "十五群科、五專與學校比較" },
      { label: "選擇就學區", href: "/districts?target=schools", description: "切換地區並保留查校任務" },
    ],
  },
  "/tools": {
    eyebrow: "把資料變成下一步",
    description: "依正確就學區使用積分、落點與志願決策工具。",
    links: [
      { label: "積分試算", href: "/it_hs/guide.htm#calculator", description: "輸入會考與免試入學積分" },
      { label: "落點分析", href: "/it_hs/guide.htm#analysis", description: "整理穩定、適中與挑戰選項" },
      { label: "重要時程", href: "/news/exam", description: "查看會考與升學階段提醒" },
      { label: "選擇就學區", href: "/districts?target=calculator", description: "確認該區目前可用工具" },
    ],
  },
  "/planner": {
    eyebrow: "把選項留在同一個地方",
    description: "收藏校科、比較風險、安排志願與重要日期。",
    links: [
      { label: "志願規劃台", href: "/it_hs/guide.htm#analysis", description: "比較、排序與檢查志願清單" },
      { label: "Cloudflare 收藏", href: "/planner", description: "查看已同步的收藏校科" },
      { label: "志願策略指南", href: "/news/strategy", description: "先理解排序方法與常見錯誤" },
      { label: "繼續找校科", href: "/it_hs/guide.htm#schools", description: "新增候選學校與科別" },
    ],
  },
};

const quickActions = [
  { label: "查校科", href: "/it_hs/guide.htm#schools", icon: "校" },
  { label: "算積分", href: "/it_hs/guide.htm#calculator", icon: "算" },
  { label: "看時程", href: "/news/exam", icon: "日" },
  { label: "排志願", href: "/it_hs/guide.htm#analysis", icon: "排" },
] as const;

const districtLabels: Readonly<Record<string, string>> = {
  tp: "基北區", ilan: "宜蘭區", "taoyuan-lienchiang": "桃連區", "hsinchu-miaoli": "竹苗區",
  ct: "中投區", changhua: "彰化區", yunlin: "雲林區", chiayi: "嘉義區", tainan: "臺南區",
  kaohsiung: "高雄區", pingtung: "屏東區", hualien: "花蓮區", taitung: "臺東區", penghu: "澎湖區", kinmen: "金門區",
};

function subscribeToDistrict(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getDistrictLabel() {
  const savedDistrict = localStorage.getItem("jshs_district") || "";
  return districtLabels[savedDistrict] ? `目前：${districtLabels[savedDistrict]}` : "選擇就學區";
}

const searchItems = primaryNavigation.flatMap((item) => [
  { label: item.label, href: item.href, description: navigationDetails[item.activeHref]?.description || "" },
  ...(navigationDetails[item.activeHref]?.links || []),
]);

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const districtLabel = useSyncExternalStore(subscribeToDistrict, getDistrictLabel, () => "選擇就學區");
  const headerRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const shouldFocusSearchRef = useRef(false);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-TW");
    if (!normalized) return [];
    const unique = new Map<string, (typeof searchItems)[number]>();
    searchItems.forEach((item) => {
      const haystack = `${item.label} ${item.description}`.toLocaleLowerCase("zh-TW");
      if (haystack.includes(normalized) && !unique.has(item.href)) unique.set(item.href, item);
    });
    return [...unique.values()].slice(0, 12);
  }, [query]);

  useEffect(() => {
    document.body.classList.toggle("jshs-nav-open", drawerOpen);
    if (drawerOpen && shouldFocusSearchRef.current) window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => document.body.classList.remove("jshs-nav-open");
  }, [drawerOpen]);

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setOpenGroup(null);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenGroup(null);
      setDrawerOpen(false);
    };
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  function openDrawer(focusSearch = false) {
    shouldFocusSearchRef.current = focusSearch;
    setOpenGroup(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    shouldFocusSearchRef.current = false;
    setDrawerOpen(false);
    setQuery("");
  }

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-18 w-[min(1180px,calc(100%-32px))] items-center gap-4">
          <Link className="flex min-w-0 shrink-0 items-center gap-2.5 font-black tracking-tight text-[#14213d]" href="/">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#173d78] text-lg text-white">↗</span>
            <span className="truncate text-xs sm:text-base">全國國中升學資訊網</span>
          </Link>

          <nav aria-label="主要導覽" className="ml-auto hidden h-18 items-stretch lg:flex">
            {primaryNavigation.map((item) => {
              const active = item.activeHref === activeHref;
              const detail = navigationDetails[item.activeHref];
              const open = openGroup === item.activeHref;
              return (
                <div key={item.href} className="relative flex items-center">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`mega-${item.activeHref.slice(1)}`}
                    onClick={() => setOpenGroup(open ? null : item.activeHref)}
                    className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-extrabold transition ${active || open ? "bg-blue-50 text-[#173d78]" : "text-slate-500 hover:bg-slate-50 hover:text-[#173d78]"}`}
                  >
                    {item.label}<span aria-hidden="true" className={`text-xs transition ${open ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {open ? (
                    <div id={`mega-${item.activeHref.slice(1)}`} className={`absolute top-[calc(100%-6px)] z-50 w-[540px] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-blue-950/15 ${item.activeHref === "/planner" ? "right-0" : "left-1/2 -translate-x-1/2"}`}>
                      <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-4">
                        <div><p className="text-xs font-black tracking-[.14em] text-[#2868d7]">{detail.eyebrow}</p><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{detail.description}</p></div>
                        <Link onClick={() => setOpenGroup(null)} className="shrink-0 rounded-xl bg-[#173d78] px-4 py-2.5 text-xs font-black text-white" href={item.href}>前往全部 →</Link>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {detail.links.map((link) => <Link onClick={() => setOpenGroup(null)} key={`${item.activeHref}-${link.href}-${link.label}`} href={link.href} className="rounded-2xl p-4 hover:bg-blue-50"><b className="block text-sm text-[#173d78]">{link.label}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{link.description}</span></Link>)}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            <Link href="/districts" className="hidden rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-[#173d78] md:block">{districtLabel} ▾</Link>
            <button type="button" onClick={() => openDrawer(true)} aria-label="搜尋內容與功能" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-[#173d78]">⌕</button>
            <button type="button" onClick={() => openDrawer()} aria-label="開啟完整選單" aria-expanded={drawerOpen} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-[#173d78] lg:hidden"><span className="text-lg" aria-hidden="true">☰</span></button>
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[80] bg-[#f5f8fc]" role="dialog" aria-modal="true" aria-label="全站導覽">
          <div className="mx-auto flex h-full w-[min(760px,100%)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-8">
              <div><p className="text-xs font-black tracking-[.16em] text-[#2868d7]">全站導覽</p><b className="mt-1 block text-lg text-[#14213d]">找到現在需要的下一步</b></div>
              <button type="button" onClick={closeDrawer} aria-label="關閉選單" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-2xl text-[#173d78]">×</button>
            </div>

            <div className="overflow-y-auto px-5 pb-28 pt-5 sm:px-8">
              <Link onClick={closeDrawer} href="/districts" className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-[#173d78]"><span><small className="block font-bold text-blue-500">全站使用情境</small><b className="mt-1 block">{districtLabel}</b></span><span aria-hidden="true">切換 →</span></Link>

              <label className="mt-5 block">
                <span className="sr-only">搜尋內容與功能</span>
                <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋內容與功能" className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 text-base text-slate-800 outline-none focus:border-[#2868d7] focus:ring-4 focus:ring-blue-100" />
              </label>

              {query.trim() ? (
                <section aria-live="polite" className="mt-6">
                  <div className="flex items-end justify-between"><h2 className="text-xl font-black text-[#14213d]">搜尋結果</h2><span className="text-xs font-bold text-slate-400">{results.length} 個入口</span></div>
                  <div className="mt-3 grid gap-2">
                    {results.map((item) => <Link key={`${item.href}-${item.label}`} onClick={closeDrawer} href={item.href} className="rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50"><b className="text-[#173d78]">{item.label}</b><span className="mt-1 block text-sm leading-6 text-slate-500">{item.description}</span></Link>)}
                    {!results.length ? <p className="rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">目前沒有符合的入口。可以搜尋「會考」、「學校」、「積分」或「志願」。</p> : null}
                  </div>
                </section>
              ) : (
                <>
                  <section className="mt-7">
                    <h2 className="text-sm font-black tracking-[.12em] text-slate-500">你現在想做什麼？</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {quickActions.map((item) => <Link onClick={closeDrawer} key={item.label} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-4 text-[#173d78] shadow-sm hover:border-blue-300 hover:bg-blue-50"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-sm font-black" aria-hidden="true">{item.icon}</span><b className="mt-3 block">{item.label}</b></Link>)}
                    </div>
                  </section>

                  <nav aria-label="瀏覽所有內容" className="mt-8">
                    <h2 className="text-sm font-black tracking-[.12em] text-slate-500">瀏覽所有內容</h2>
                    <div className="mt-3 grid gap-2">
                      {primaryNavigation.map((item) => {
                        const detail = navigationDetails[item.activeHref];
                        return (
                          <details key={item.href} className="group rounded-2xl border border-slate-200 bg-white">
                            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-black text-[#173d78] marker:content-none"><span>{item.label}<small className="mt-1 block font-medium text-slate-500">{detail.description}</small></span><span className="transition group-open:rotate-180" aria-hidden="true">⌄</span></summary>
                            <div className="grid gap-1 border-t border-slate-100 p-2 sm:grid-cols-2">
                              <Link onClick={closeDrawer} href={item.href} className="rounded-xl px-4 py-3 text-sm font-black text-[#2868d7] hover:bg-blue-50">前往{item.label}首頁 →</Link>
                              {detail.links.map((link) => <Link onClick={closeDrawer} key={`${item.activeHref}-${link.href}-${link.label}`} href={link.href} className="rounded-xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-[#173d78]">{link.label}</Link>)}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </nav>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <nav aria-label="行動版快速導覽" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden">
        {[
          { label: "首頁", href: "/", icon: "⌂", active: !activeHref },
          { label: "指南", href: "/news#latest", icon: "讀", active: activeHref === "/news" },
          { label: "找校科", href: "/it_hs/guide.htm#schools", icon: "校", active: activeHref === "/schools" },
          { label: "工具", href: "/it_hs/guide.htm#calculator", icon: "算", active: activeHref === "/tools" },
          { label: "規劃", href: "/it_hs/guide.htm#analysis", icon: "存", active: activeHref === "/planner" },
        ].map((item) => <Link key={item.label} aria-current={item.active ? "page" : undefined} href={item.href} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-black ${item.active ? "bg-blue-50 text-[#173d78]" : "text-slate-500"}`}><span className="text-base" aria-hidden="true">{item.icon}</span>{item.label}</Link>)}
      </nav>
    </>
  );
}
