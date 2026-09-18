"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";
import { DonationLink } from "@/components/donation-link";
import { getDistrictLabel, readStoredDistrict, subscribeToDistrict } from "@/lib/district-context";
import { menuGroups, primaryNavigation, type MenuGroup, type MenuItem, type PrimaryNavigationItem } from "@/lib/site-map";
import { searchSite } from "@/lib/search-index";

type NavigationTone = "school" | "score" | "planner" | "guide" | "trust";
type NavigationItem = PrimaryNavigationItem & { icon?: SiteIconName; tone?: NavigationTone };

const mobileNavigation = primaryNavigation as readonly NavigationItem[];
const navigationGroups = new Map(menuGroups.map((group) => [group.label, group]));

function districtSnapshot() { return getDistrictLabel(readStoredDistrict()); }

function Brand() {
  return <Link href="/" className="jshs-brand" aria-label="全國國中升學資訊網首頁"><span className="jshs-brand-logo" aria-hidden="true"><SiteIcon name="school" size={21} /></span><span>全國國中升學資訊網</span></Link>;
}

function NavIcon({ item }: { item: NavigationItem }) { return <SiteIcon name={item.icon || "more"} size={17} />; }

type MenuSection = Readonly<{ label?: string; items: readonly MenuItem[] }>;

function groupSections(group: MenuGroup): readonly MenuSection[] {
  const sections: MenuSection[] = [];
  for (const item of group.items) {
    if (item.children?.length) {
      sections.push({ label: item.label, items: item.children });
      continue;
    }
    const label = item.section || undefined;
    const previous = sections.at(-1);
    if (previous && previous.label === label) {
      sections[sections.length - 1] = { ...previous, items: [...previous.items, item] };
    } else {
      sections.push({ label, items: [item] });
    }
  }
  return sections;
}

function MenuDestination({ item, onNavigate, compact = false }: { item: MenuItem; onNavigate?: () => void; compact?: boolean }) {
  return <Link onClick={onNavigate} href={item.href} className={`jshs-menu-destination ${compact ? "is-compact" : ""}`}>
    {item.icon ? <span className="jshs-menu-item-icon" aria-hidden="true"><SiteIcon name={item.icon as SiteIconName} size={18} /></span> : null}
    <span className="jshs-menu-item-copy"><b>{item.label}</b><span>{item.description}</span></span>
    <SiteIcon name="chevron-right" size={15} className="jshs-menu-item-arrow" />
  </Link>;
}

function NavigationSection({ section, onNavigate, mobile = false }: { section: MenuSection; onNavigate?: () => void; mobile?: boolean }) {
  return <section className={`jshs-navigation-section ${section.label ? "has-label" : ""}`}>
    {section.label ? <h3>{section.label}</h3> : null}
    <div className="jshs-group-items">{section.items.map((item) => <MenuDestination key={item.label} item={item} onNavigate={onNavigate} compact={mobile} />)}</div>
  </section>;
}

function GroupItems({ group, onNavigate, mobile = false }: { group: MenuGroup; onNavigate?: () => void; mobile?: boolean }) {
  return <div className={`jshs-navigation-sections ${mobile ? "is-mobile jshs-mobile-group-items" : ""}`}>{groupSections(group).map((section, index) => <NavigationSection key={`${section.label || "items"}-${index}`} section={section} onNavigate={onNavigate} mobile={mobile} />)}</div>;
}

function MobileNavigationGroup({ item, group, onNavigate }: { item: NavigationItem; group: MenuGroup; onNavigate: () => void }) {
  return <details className={`jshs-mobile-group is-${item.tone || "trust"}`} open={item.label === "找學校"}>
    <summary className="jshs-mobile-group-heading">
      <span className="jshs-icon-tile" aria-hidden="true"><NavIcon item={item} /></span>
      <span className="min-w-0"><b>{item.label}</b><small>{group.description}</small></span>
      <SiteIcon name="chevron-down" size={17} />
    </summary>
    <div className="jshs-mobile-group-body">
      <Link href={group.href} onClick={onNavigate} className="jshs-mobile-group-all">查看全部<SiteIcon name="chevron-right" size={15} /></Link>
    <GroupItems group={group} onNavigate={onNavigate} mobile />
    </div>
  </details>;
}

function DesktopNavigationGroup({ item, group, active, onToggle, onNavigate }: { item: NavigationItem; group: MenuGroup; active: boolean; onToggle: (menu: HTMLDetailsElement) => void; onNavigate: () => void }) {
  const panelId = `jshs-navigation-${item.label}`;
  return <details name="jshs-desktop-nav" onToggle={(event) => onToggle(event.currentTarget)} className={`jshs-desktop-more is-${item.tone || "trust"} is-layout-${group.layout || "default"} is-sections-${groupSections(group).length} ${active ? "is-active" : ""}`}>
    <summary aria-label={`${item.label}，展開副選單`} aria-haspopup="menu" aria-controls={panelId}><NavIcon item={item} /><span>{item.label}</span><SiteIcon name="chevron-down" size={14} /></summary>
    <div id={panelId} role="menu" className="jshs-navigation-panel">
      <div className="jshs-desktop-menu-heading"><span><b>{group.eyebrow}</b><small>{group.description}</small></span></div>
      <GroupItems group={group} onNavigate={onNavigate} />
      <Link href={group.href} onClick={onNavigate} className="jshs-desktop-menu-all">查看全部{item.label}<SiteIcon name="chevron-right" size={14} /></Link>
    </div>
  </details>;
}

export function SiteHeader({ activeHref }: { activeHref?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [memberName, setMemberName] = useState<string | null>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const districtLabel = useSyncExternalStore(subscribeToDistrict, districtSnapshot, () => "選擇就學區");
  const results = useMemo(() => searchSite(query, 12), [query]);

  useEffect(() => {
    document.body.classList.toggle("jshs-nav-open", drawerOpen);
    if (!drawerOpen) return () => document.body.classList.remove("jshs-nav-open");
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => { window.clearTimeout(focusTimer); document.body.classList.remove("jshs-nav-open"); };
  }, [drawerOpen]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/session", { cache: "no-store", headers: { accept: "application/json" } })
      .then(response => response.ok ? response.json() as Promise<{ authenticated?: boolean; displayName?: string }> : null)
      .then(payload => { if (!cancelled && payload?.authenticated) setMemberName(payload.displayName || "LINE 使用者"); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (desktopNavRef.current?.contains(event.target as Node)) return;
      closeDesktopMenus();
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeDesktopMenus();
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function openDrawer() { lastFocusRef.current = document.activeElement as HTMLElement | null; setDrawerOpen(true); }
  function closeDrawer() { setDrawerOpen(false); setQuery(""); window.setTimeout(() => lastFocusRef.current?.focus(), 0); }
  function closeDesktopMenus() { desktopNavRef.current?.querySelectorAll<HTMLDetailsElement>(".jshs-desktop-more[open]").forEach((menu) => { menu.open = false; }); }
  function keepSingleDesktopMenu(openMenu: HTMLDetailsElement) {
    if (!openMenu.open) return;
    desktopNavRef.current?.querySelectorAll<HTMLDetailsElement>(".jshs-desktop-more[open]").forEach((menu) => {
      if (menu !== openMenu) menu.open = false;
    });
  }

  return <>
    <header className="sticky top-0 z-40 w-full border-b border-[var(--jshs-border)] bg-white jshs-site-header">
      <div className="jshs-header-inner">
        <Brand />
        <nav ref={desktopNavRef} aria-label="主要導覽" className="jshs-desktop-nav">{mobileNavigation.map((item) => {
          const group = navigationGroups.get(item.label);
          const active = activeHref === item.activeHref;
          return group ? <DesktopNavigationGroup key={item.label} item={item} group={group} active={active} onToggle={keepSingleDesktopMenu} onNavigate={closeDesktopMenus} /> : null;
        })}</nav>
        <div className="ml-auto flex shrink-0 items-center gap-2"><DonationLink fallbackHref="/support" className="jshs-donation-link hidden md:inline-flex">小額捐款</DonationLink>{/* Unauthenticated fallback: >登入</ */}<Link href="/account" className="jshs-login-link">{memberName || "登入"}</Link><button type="button" onClick={openDrawer} aria-label="開啟全站導覽" aria-expanded={drawerOpen} className="jshs-header-action jshs-header-menu-button grid place-items-center xl:hidden"><SiteIcon name="menu" size={23} /></button></div>
      </div>
    </header>

    {drawerOpen ? <div className="fixed inset-0 z-[80] bg-[var(--jshs-page)]" role="dialog" aria-modal="true" aria-label="全站導覽"><div className="mx-auto flex h-full w-[min(860px,100%)] flex-col bg-white"><div className="flex items-center justify-between border-b border-[var(--jshs-border)] px-5 py-4"><Brand /><button type="button" onClick={closeDrawer} aria-label="關閉全站導覽" className="jshs-close-action grid h-10 w-10 place-items-center"><SiteIcon name="close" size={21} /></button></div><div className="overflow-y-auto px-5 pb-24 pt-5"><Link href="/districts" onClick={closeDrawer} className="flex items-center justify-between p-4 jshs-surface-card"><span><small className="block jshs-muted-copy">目前就學區</small><b className="mt-1 block">目前：{districtLabel}</b></span><span className="flex items-center gap-1 text-sm font-black">切換<SiteIcon name="chevron-right" size={16} /></span></Link><form action="/search" method="get" className="mt-4"><label className="jshs-mobile-search flex items-center gap-2 rounded-xl bg-[var(--jshs-muted-surface)] px-4"><SiteIcon name="search" size={19} /><span className="sr-only">搜尋內容與功能</span><input ref={searchRef} name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋學校、會考、志願、資格…" className="w-full border-0 bg-transparent shadow-none" /></label></form>{query.trim() ? <div className="mt-5 grid gap-2">{results.map((item) => <MenuDestination key={item.id} item={{ label: item.title, href: item.href, description: `${item.category} · ${item.body}` }} onNavigate={closeDrawer} />)}<Link href={`/search?q=${encodeURIComponent(query.trim())}`} onClick={closeDrawer} className="p-4 text-sm font-bold text-[var(--jshs-primary)] jshs-surface-card">查看完整搜尋結果 →</Link>{!results.length ? <p className="p-4 text-sm jshs-muted-copy">找不到相符內容，試試「中投志願序」、「超額比序」、「資訊科」或「官方簡章」。</p> : null}</div> : <section aria-labelledby="mobile-groups-title" className="mt-6"><div><p className="jshs-eyebrow">完整功能</p><h2 id="mobile-groups-title" className="mt-1 text-xl">依需求找工具</h2><p className="mt-1 text-sm jshs-muted-copy">桌機與手機使用相同八個主分類；往下即可直接查看每個功能。</p></div><div className="mt-4 grid gap-5">{mobileNavigation.map((item) => { const group = navigationGroups.get(item.label); return group ? <MobileNavigationGroup key={item.label} item={item} group={group} onNavigate={closeDrawer} /> : null; })}</div></section>}</div></div></div> : null}

    <nav aria-label={`手機快速導覽：${mobileNavigation.map((item) => item.label).join("、")}`} className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--jshs-border)] bg-white px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 xl:hidden">{mobileNavigation.slice(0, 4).map((item) => <Link key={item.label} href={item.href} aria-current={activeHref === item.activeHref ? "page" : undefined} className={`jshs-mobile-nav-item is-${item.tone || "trust"} ${activeHref === item.activeHref ? "is-active" : ""}`}><NavIcon item={item} /><span>{item.label}</span></Link>)}<button type="button" onClick={openDrawer} aria-label="開啟更多功能選單" aria-expanded={drawerOpen} className={`jshs-mobile-nav-item ${drawerOpen ? "is-active" : ""}`}><SiteIcon name="menu" size={24} /><span>其他</span></button></nav>
  </>;
}
