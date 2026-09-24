"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";
import type { MenuGroup, MenuItem, PrimaryNavigationItem } from "@/lib/site-map";
import { featureThemeFor, type FeatureTheme } from "@/components/navigation/feature-theme";

export type NavigationItem = PrimaryNavigationItem & { icon?: SiteIconName; tone?: string };
type MenuSection = Readonly<{ label?: string; items: readonly MenuItem[] }>;

const fallbackIcons: Readonly<Record<string, SiteIconName>> = {
  "全國校科查詢": "search", "學校地圖": "school", "學校比較": "compare", "通勤比較": "route",
  "歷年錄取": "history", "費用試算": "calculator", "學長姐分享": "messages", "校園開放日": "calendar", "群科介紹": "book",
  "模擬考中心": "calculator", "我的模考": "chart", "成績趨勢": "chart", "模考落點": "target", "對答案": "check",
  "成績積分試算": "calculator", "積分規則": "book", "個人積分摘要": "chart",
  "自己排": "planner", "志願探索": "search", "版本紀錄": "history", "列印／下載": "file", "官方選填平台": "school",
  "升學總覽": "calendar", "重要時程": "calendar", "現在該做什麼": "check", "我的待辦": "check",
  "升學入門": "book", "志願與積分": "calculator", "特殊入學與資格": "shield", "升學百科": "knowledge", "生涯探索": "target", "升學動態": "bell", "官方資訊入口": "shield", "官方簡章與規則": "file", "官方招生時程": "calendar", "官方招生平台": "school",
  "資料來源": "shield", "資料更新狀態": "history", "15 區建置進度": "chart", "試算與分析方法": "calculator", "資料版本紀錄": "history", "錯誤回報": "messages", "平台可信度說明": "shield", "資料更新紀錄": "history",
  "關於本站": "knowledge", "贊助與編輯獨立": "shield", "支持／合作": "messages", "聯絡我們": "messages", "服務狀態": "check", "隱私權政策": "shield", "服務條款": "file", "Cookie／資料使用說明": "file",
};

function itemIcon(item: MenuItem): SiteIconName { return (item.icon as SiteIconName | undefined) || fallbackIcons[item.label] || "more"; }

export function groupMenuSections(group: MenuGroup): readonly MenuSection[] {
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

export function NavMegaMenuItem({ item, onNavigate, mobile = false, theme }: { item: MenuItem; onNavigate?: () => void; mobile?: boolean; theme: FeatureTheme }) {
  return <Link href={item.href} onClick={onNavigate} role="menuitem" className={`jshs-nav-mega-item jshs-nav-theme--${theme}${mobile ? " is-mobile" : ""}`}>
    <span className="jshs-nav-mega-icon" aria-hidden="true"><SiteIcon name={itemIcon(item)} size={20} /></span>
    <span className="jshs-nav-mega-item-copy"><b>{item.label}</b><span>{item.description}</span></span>
    <SiteIcon name="chevron-right" size={16} className="jshs-nav-mega-chevron" />
  </Link>;
}

export function NavDropdownHeader({ group }: { group: MenuGroup }) {
  return <header className="jshs-nav-mega-header">
    <h2>{group.eyebrow}</h2>
    <p>{group.description}</p>
  </header>;
}

export function NavDropdownSection({ section, onNavigate, mobile = false, theme }: { section: MenuSection; onNavigate?: () => void; mobile?: boolean; theme: FeatureTheme }) {
  return <section className="jshs-nav-mega-section">
    {section.label ? <h3>{section.label}</h3> : null}
    <div className="jshs-nav-mega-section-items">{section.items.map((item) => <NavMegaMenuItem key={item.label} item={item} onNavigate={onNavigate} mobile={mobile} theme={theme} />)}</div>
  </section>;
}

export function NavDropdownGrid({ group, onNavigate, mobile = false }: { group: MenuGroup; onNavigate?: () => void; mobile?: boolean }) {
  const theme = featureThemeFor(group.label);
  return <div className={`jshs-nav-mega-grid jshs-nav-theme--${theme}${mobile ? " is-mobile" : ""}`}>{groupMenuSections(group).map((section, index) => <NavDropdownSection key={`${section.label || "items"}-${index}`} section={section} onNavigate={onNavigate} mobile={mobile} theme={theme} />)}</div>;
}

export function NavDropdownFooter({ group, onNavigate }: { group: MenuGroup; onNavigate?: () => void }) {
  return <footer className="jshs-nav-mega-footer"><Link href={group.href} onClick={onNavigate}>查看全部{group.label}<SiteIcon name="chevron-right" size={16} /></Link></footer>;
}

export function NavDropdown({ item, group, active, open, onToggle, onNavigate }: { item: NavigationItem; group: MenuGroup; active: boolean; open: boolean; onToggle: () => void; onNavigate: () => void }) {
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = `jshs-nav-mega-${item.label}`;

  const positionPanel = useCallback(() => {
    const details = rootRef.current;
    const panel = panelRef.current;
    if (!details || !panel || !open) return;
    const trigger = details.getBoundingClientRect();
    const width = panel.getBoundingClientRect().width;
    const padding = 24;
    const left = Math.max(padding, Math.min(window.innerWidth - width - padding, trigger.left + trigger.width / 2 - width / 2));
    setPanelStyle({ left: `${left - trigger.left}px`, right: "auto" });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(positionPanel);
    window.addEventListener("resize", positionPanel);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", positionPanel); };
  }, [open, positionPanel]);

  return <div ref={rootRef} className={`jshs-desktop-more jshs-nav-dropdown jshs-nav-theme--${featureThemeFor(item.label)} ${active || open ? "is-active" : ""}`}>
    <button type="button" aria-label={`${item.label}，展開副選單`} aria-haspopup="menu" aria-expanded={open} aria-controls={panelId} onClick={onToggle}><span>{item.label}</span><SiteIcon name="chevron-down" size={12} /></button>
    {open ? <div ref={panelRef} id={panelId} role="menu" style={panelStyle} className="jshs-nav-mega-panel">
      <NavDropdownHeader group={group} />
      <NavDropdownGrid group={group} onNavigate={onNavigate} />
      <NavDropdownFooter group={group} onNavigate={onNavigate} />
    </div> : null}
  </div>;
}

export function NavMobileAccordion({ item, group, onNavigate }: { item: NavigationItem; group: MenuGroup; onNavigate: () => void }) {
  return <details className={`jshs-mobile-group jshs-nav-mobile-accordion jshs-nav-theme--${featureThemeFor(item.label)}`} open={item.label === "找學校"}>
    <summary className="jshs-mobile-group-heading"><span className="jshs-nav-mobile-icon" aria-hidden="true"><SiteIcon name={item.icon || "more"} size={19} /></span><span><b>{item.label}</b><small>{group.description}</small></span><SiteIcon name="chevron-down" size={17} /></summary>
    <div className="jshs-nav-mobile-body"><NavDropdownGrid group={group} onNavigate={onNavigate} mobile /><NavDropdownFooter group={group} onNavigate={onNavigate} /></div>
  </details>;
}
