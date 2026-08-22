"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { menuGroups, primaryNavigation, type MenuGroup, type MenuItem } from "@/lib/site-map";

const quickActions = [
  { label: "查校科", href: "/schools?district=ct", icon: "校" },
  { label: "算積分", href: "/tools?district=ct", icon: "算" },
  { label: "看時程", href: "/news/exam", icon: "日" },
  { label: "排志願", href: "/planner", icon: "排" },
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

function flattenMenuItems(items: readonly MenuItem[]): Array<{ label: string; href: string; description: string; available?: boolean }> {
  return items.flatMap((item) => [
    { label: item.label, href: item.href, description: item.description, available: item.available },
    ...flattenMenuItems(item.children || []),
  ]);
}

// Keep the legacy four-task search surface discoverable while the full menu model powers navigation.
const legacyNavigationItems = primaryNavigation.map((item) => ({
  label: item.label,
  href: item.href,
  description: `前往${item.label}`,
  available: true,
}));

const searchItems = [
  ...legacyNavigationItems,
  ...menuGroups.flatMap((group) => flattenMenuItems(group.items)),
];

function MenuDestination({ item, onNavigate, compact = false }: { item: MenuItem; onNavigate?: () => void; compact?: boolean }) {
  const className = compact
    ? "rounded-[1.25rem] px-4 py-3 text-sm font-bold text-[var(--jshs-muted)] hover:bg-[var(--jshs-muted-surface)] hover:text-[var(--jshs-primary)]"
    : "rounded-[1.25rem] p-4 hover:bg-[var(--jshs-muted-surface)]";

  if (item.available === false) {
    return (
      <span className={`${className} block cursor-not-allowed opacity-60`} aria-disabled="true" title="此功能尚未開放">
        <b className={compact ? "font-bold" : "block text-sm text-[var(--jshs-primary)]"}>{item.label}</b>
        <span className="mt-1 block text-xs leading-5 jshs-muted-copy">{item.description}</span>
        <small className="mt-2 block text-[var(--jshs-secondary)]">功能準備中</small>
      </span>
    );
  }

  return (
    <Link onClick={onNavigate} href={item.href} className={className}>
      <b className={compact ? "font-bold" : "block text-sm text-[var(--jshs-primary)]"}>{item.label}</b>
      <span className="mt-1 block text-xs leading-5 jshs-muted-copy">{item.description}</span>
    </Link>
  );
}

function MenuGroupHeader({ group }: { group: MenuGroup }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-[var(--jshs-border)] pb-4">
      <div>
        <p className="jshs-eyebrow">{group.eyebrow}</p>
        <p className="mt-2 max-w-lg text-sm leading-6 jshs-muted-copy">{group.description}</p>
      </div>
      <Link className="shrink-0 px-4 py-2.5 text-xs jshs-button-primary" href={group.href}>前往全部 →</Link>
    </div>
  );
}

function PrimaryMegaMenu({ group, onClose }: { group: MenuGroup; onClose: () => void }) {
  return (
    <div className={`absolute top-[calc(100%-2px)] z-50 w-[min(700px,calc(100vw-32px))] p-5 jshs-surface-card ${group.activeHref === "/planner" ? "right-0" : "left-1/2 -translate-x-1/2"}`}>
      <MenuGroupHeader group={group} />
      <div className="mt-3 grid max-h-[min(520px,calc(100vh-150px))] grid-cols-2 gap-2 overflow-y-auto pr-1">
        {group.items.map((item) => <MenuDestination key={`${group.label}-${item.label}`} item={item} onNavigate={onClose} />)}
      </div>
    </div>
  );
}

function MoreMegaMenu({ group, onClose }: { group: MenuGroup; onClose: () => void }) {
  return (
    <div className="absolute right-0 top-[calc(100%-2px)] z-50 w-[min(860px,calc(100vw-32px))] p-5 jshs-surface-card">
      <MenuGroupHeader group={group} />
      <div className="mt-4 grid max-h-[min(580px,calc(100vh-150px))] gap-4 overflow-y-auto pr-1 md:grid-cols-3">
        {group.items.map((section) => (
          <section key={section.label} className="rounded-[1.5rem] bg-[var(--jshs-muted-surface)] p-3">
            <div className="px-3 pb-2">
              <b className="text-sm text-[var(--jshs-primary)]">{section.label}</b>
              <span className="mt-1 block text-xs leading-5 jshs-muted-copy">{section.description}</span>
            </div>
            <div className="grid gap-1">
              {section.children?.map((item) => <MenuDestination key={`${section.label}-${item.label}`} item={item} onNavigate={onClose} compact />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const districtLabel = useSyncExternalStore(subscribeToDistrict, getDistrictLabel, () => "選擇就學區");
  const headerRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const shouldFocusSearchRef = useRef(false);
  const moreGroup = menuGroups.find((group) => group.label === "更多");

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
      <header ref={headerRef} className="sticky top-3 z-40 mx-auto w-[min(1180px,calc(100%-24px))] jshs-floating-nav">
        <div className="flex min-h-16 items-center gap-3 px-3 sm:px-4">
          <Link className="flex min-w-0 shrink-0 items-center gap-2.5 font-black tracking-tight text-[var(--jshs-ink)]" href="/">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--jshs-primary)] text-lg text-white">↗</span>
            <span className="truncate text-xs sm:text-base">全國國中升學資訊網</span>
          </Link>

          <nav aria-label="主要導覽" className="ml-auto hidden h-16 items-stretch lg:flex">
            {menuGroups.map((group) => {
              const isMore = group.label === "更多";
              const open = openGroup === group.label;
              const active = group.activeHref === activeHref;
              return (
                <div key={group.label} className="relative flex items-center">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`mega-${group.label}`}
                    aria-label={isMore ? "更多導覽" : undefined}
                    onClick={() => setOpenGroup(open ? null : group.label)}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-extrabold transition jshs-button ${active || open ? "bg-[var(--jshs-accent)] text-[var(--jshs-ink)]" : "text-[var(--jshs-muted)] hover:bg-[var(--jshs-muted-surface)] hover:text-[var(--jshs-primary)]"}`}
                  >
                    {group.label}<span aria-hidden="true" className={`text-xs transition ${open ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {open && !isMore ? <PrimaryMegaMenu group={group} onClose={() => setOpenGroup(null)} /> : null}
                  {open && isMore && moreGroup ? <MoreMegaMenu group={moreGroup} onClose={() => setOpenGroup(null)} /> : null}
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            <Link href="/districts" className="hidden border border-[var(--jshs-border)] bg-[var(--jshs-muted-surface)] px-3 py-2 text-xs text-[var(--jshs-primary)] jshs-button md:block">{districtLabel} ▾</Link>
            <button type="button" onClick={() => openDrawer(true)} aria-label="搜尋內容與功能" className="grid h-10 w-10 place-items-center border border-[var(--jshs-border)] bg-white text-[var(--jshs-primary)] jshs-button">⌕</button>
            <button type="button" onClick={() => openDrawer()} aria-label="開啟完整選單" aria-expanded={drawerOpen} className="grid h-10 w-10 place-items-center border border-[var(--jshs-border)] bg-white text-[var(--jshs-primary)] jshs-button lg:hidden"><span className="text-lg" aria-hidden="true">☰</span></button>
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[80] bg-[var(--jshs-background)]" role="dialog" aria-modal="true" aria-label="全站導覽">
          <div className="mx-auto flex h-full w-[min(820px,100%)] flex-col bg-[var(--jshs-surface)] shadow-[var(--jshs-shadow-card)]">
            <div className="flex items-center justify-between border-b border-[var(--jshs-border)] px-5 py-4 sm:px-8">
              <div><p className="jshs-eyebrow">全站導覽</p><b className="mt-1 block text-lg text-[var(--jshs-ink)]">找到現在需要的下一步</b></div>
              <button type="button" onClick={closeDrawer} aria-label="關閉選單" className="grid h-11 w-11 place-items-center border border-[var(--jshs-border)] text-2xl text-[var(--jshs-primary)] jshs-button">×</button>
            </div>

            <div className="overflow-y-auto px-5 pb-28 pt-5 sm:px-8">
              <Link onClick={closeDrawer} href="/districts" className="flex items-center justify-between px-5 py-4 text-[var(--jshs-primary)] jshs-surface-card"><span><small className="block font-bold text-[var(--jshs-secondary)]">全站使用情境</small><b className="mt-1 block">{districtLabel}</b></span><span aria-hidden="true">切換 →</span></Link>

              <label className="mt-5 block">
                <span className="sr-only">搜尋內容與功能</span>
                <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋內容與功能" className="h-14 w-full rounded-full border border-[var(--jshs-border)] bg-white/70 px-5 text-base text-[var(--jshs-ink)] outline-none focus:border-[var(--jshs-primary)] focus:ring-4 focus:ring-[rgba(93,112,82,.18)]" />
              </label>

              {query.trim() ? (
                <section aria-live="polite" className="mt-6">
                  <div className="flex items-end justify-between"><h2 className="text-xl font-black text-[var(--jshs-ink)]">搜尋結果</h2><span className="text-xs font-bold text-[var(--jshs-muted)]">{results.length} 個入口</span></div>
                  <div className="mt-3 grid gap-2">
                    {results.map((item) => item.available === false ? <span key={`${item.href}-${item.label}`} className="p-4 opacity-60 jshs-surface-card"><b className="text-[var(--jshs-primary)]">{item.label}</b><span className="mt-1 block text-sm leading-6 jshs-muted-copy">{item.description}</span><small className="mt-2 block text-[var(--jshs-secondary)]">功能準備中</small></span> : <Link key={`${item.href}-${item.label}`} onClick={closeDrawer} href={item.href} className="p-4 jshs-surface-card"><b className="text-[var(--jshs-primary)]">{item.label}</b><span className="mt-1 block text-sm leading-6 jshs-muted-copy">{item.description}</span></Link>)}
                    {!results.length ? <p className="rounded-[1.5rem] bg-[var(--jshs-muted-surface)] p-5 text-sm leading-6 jshs-muted-copy">目前沒有符合的入口。可以搜尋「會考」、「學校」、「積分」或「志願」。</p> : null}
                  </div>
                </section>
              ) : (
                <>
                  <section className="mt-7">
                    <h2 className="text-sm font-black tracking-[.12em] text-[var(--jshs-muted)]">你現在想做什麼？</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {quickActions.map((item) => <Link onClick={closeDrawer} key={item.label} href={item.href} className="p-4 text-[var(--jshs-primary)] jshs-surface-card"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--jshs-muted-surface)] text-sm font-black" aria-hidden="true">{item.icon}</span><b className="mt-3 block">{item.label}</b></Link>)}
                    </div>
                  </section>

                  <nav aria-label="瀏覽所有內容" className="mt-8">
                    <h2 className="text-sm font-black tracking-[.12em] text-[var(--jshs-muted)]">瀏覽所有內容</h2>
                    <div className="mt-3 grid gap-2">
                      {menuGroups.map((group) => (
                        <details key={group.label} className="group jshs-surface-card">
                          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-black text-[var(--jshs-primary)] marker:content-none"><span>{group.label}<small className="mt-1 block font-medium jshs-muted-copy">{group.description}</small></span><span className="transition group-open:rotate-180" aria-hidden="true">⌄</span></summary>
                          <div className="grid gap-1 border-t border-[var(--jshs-border)] p-2 sm:grid-cols-2">
                            <MenuDestination item={{ label: `前往${group.label}首頁`, href: group.href, description: group.description }} onNavigate={closeDrawer} compact />
                            {group.items.map((item) => item.children?.length ? (
                              <section key={`${group.label}-${item.label}`} className="rounded-[1.25rem] bg-[var(--jshs-muted-surface)] p-2 sm:col-span-2">
                                <b className="block px-3 py-2 text-sm text-[var(--jshs-primary)]">{item.label}</b>
                                <div className="grid gap-1 sm:grid-cols-2">
                                  {item.children.map((child) => <MenuDestination key={`${item.label}-${child.label}`} item={child} onNavigate={closeDrawer} compact />)}
                                </div>
                              </section>
                            ) : <MenuDestination key={`${group.label}-${item.label}`} item={item} onNavigate={closeDrawer} compact />)}
                          </div>
                        </details>
                      ))}
                    </div>
                  </nav>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <nav aria-label="行動版快速導覽" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--jshs-border)] bg-white/90 px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden">
        {[
          { label: "首頁", href: "/", icon: "⌂", active: !activeHref },
          { label: "指南", href: "/news#latest", icon: "讀", active: activeHref === "/news" },
          { label: "找校科", href: "/schools?district=ct", icon: "校", active: activeHref === "/schools" },
          { label: "工具", href: "/tools?district=ct", icon: "算", active: activeHref === "/tools" },
          { label: "規劃", href: "/planner", icon: "存", active: activeHref === "/planner" },
        ].map((item) => <Link key={item.label} aria-current={item.active ? "page" : undefined} href={item.href} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] text-[11px] font-black ${item.active ? "bg-[var(--jshs-accent)] text-[var(--jshs-ink)]" : "text-[var(--jshs-muted)]"}`}><span className="text-base" aria-hidden="true">{item.icon}</span>{item.label}</Link>)}
      </nav>
    </>
  );
}
