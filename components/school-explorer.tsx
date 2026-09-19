"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteIcon } from "@/components/site-icons";
import { SchoolMedia } from "@/components/school-media";
import type { SchoolSearchIndexEntry } from "@/lib/school-search-index";
import "@/components/schools-v2.css";

// Canonical card route contract: href={`/schools/${s.code}`}.

export type SchoolExplorerFilters = { query?: string; district?: string; city?: string; area?: string; ownership?: string; program?: string; gender?: string; department?: string };
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
const normalized = (value: string) => value.toLowerCase().replaceAll("台", "臺").replace(/\s/g, "");
const hotSearches = ["臺中女中", "臺中二中", "資訊科", "餐飲科", "機械科", "護理科"];

function SearchBox({ value, onChange, compact = false }: { value: string; onChange: (value: string) => void; compact?: boolean }) {
  return <form className={`sv-search-box${compact ? " is-compact" : ""}`} role="search" onSubmit={event => event.preventDefault()}><SiteIcon name="search" size={20} /><label htmlFor="school-search">搜尋學校、科別或課程方向</label><input id="school-search" type="search" value={value} onChange={event => onChange(event.target.value)} placeholder="搜尋學校名稱、群科、科別，例如：臺中女中、資訊科、餐飲科" /><button type="submit">搜尋</button></form>;
}

function ExploreShortcut({ href, icon, title, description }: { href: string; icon: "search" | "school" | "calculator"; title: string; description: string }) {
  return <Link href={href} className="sv-explore-shortcut"><span className="sv-shortcut-icon" aria-hidden="true"><SiteIcon name={icon} size={21} /></span><span><strong>{title}</strong><small>{description}</small></span><SiteIcon name="chevron-right" size={16} /></Link>;
}

function FilterPanel({ prefix, schools, filters, update, clear }: { prefix: string; schools: readonly SchoolSearchIndexEntry[]; filters: SchoolExplorerFilters; update: (key: keyof SchoolExplorerFilters, value: string) => void; clear: () => void }) {
  const fields: [keyof SchoolExplorerFilters, string, string[]][] = [["city", "縣市", unique(schools.map(s => s.city))], ["area", "行政區", unique(schools.filter(s => !filters.city || s.city === filters.city).map(s => s.area))], ["district", "招生區", unique(schools.flatMap(s => s.admissionDistricts))], ["ownership", "公私立", unique(schools.map(s => s.ownership))], ["program", "學制", unique(schools.flatMap(s => s.schoolTypes || [s.schoolType]))], ["gender", "招生性別", unique(schools.flatMap(s => s.genders || [s.gender]))], ["department", "群科／科別", unique(schools.flatMap(s => s.departmentNames))]];
  return <div className="sv-filter-fields"><div className="sv-filter-heading"><strong>更多篩選</strong><button type="button" onClick={clear}>清除篩選</button></div>{fields.map(([key, label, values]) => <label key={key} htmlFor={`${prefix}-${key}`}>{key === "district" ? "招生區／免試就學區" : label}<select id={`${prefix}-${key}`} value={filters[key] || ""} onChange={event => update(key, event.target.value)}><option value="">全部</option>{values.map(value => <option key={value}>{value}</option>)}</select></label>)}</div>;
}

function SchoolCard({ school, selected, onCompare }: { school: SchoolSearchIndexEntry; selected: boolean; onCompare: (code: string) => void }) {
  // 住宿資訊依 CSV 原文；卡片只呈現學生需要的狀態摘要。
  const departments = school.departmentNames.slice(0, 3).join("・") || "主要科別尚未提供";
  return <article className="sv-school-card"><SchoolMedia code={school.code} name={school.name} address={`${school.city}${school.area}`} className="sv-school-card-media" /><div className="sv-school-card-main"><div className="sv-card-topline"><div className="sv-tags"><span>{school.ownership || "公私立資料未提供"}</span><span>{school.schoolType || "學制資料未提供"}</span></div></div><h2><Link href={`/schools/${school.code}`}>{school.name}<SiteIcon name="chevron-right" size={16} /></Link></h2><p className="sv-place">{school.city} {school.area} · {school.admissionDistricts.join("、") || "招生區資料尚未提供"}</p><p className="sv-departments"><strong>主要科別</strong>{departments}{school.departmentNames.length > 3 ? ` 等 ${school.departmentNames.length} 科` : ""}</p><div className="sv-school-facts"><span><small>115 招生名額</small><b>{school.admissionQuota || "尚未提供"}</b></span><span><small>交通</small><b>{school.hasPublicTransport ? "有大眾運輸資訊" : "尚未提供"}</b></span><span><small>住宿</small><b>{school.lodgingStatus === "confirmed" ? "有住宿資料" : "尚未提供"}</b></span></div></div><div className="sv-school-card-actions"><button type="button" className={`sv-compare-button${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => onCompare(school.code)}>{selected ? "已加入比較" : "加入比較"}</button><Link className="sv-primary-link" href={`/schools/${school.code}`}>查看學校<SiteIcon name="chevron-right" size={16} /></Link></div></article>;
}

export function SchoolExplorer({ schools: initialSchools = [], initialFilters = {} }: { schools?: readonly SchoolSearchIndexEntry[]; initialFilters?: SchoolExplorerFilters }) {
  const [schools, setSchools] = useState<readonly SchoolSearchIndexEntry[]>(initialSchools);
  const [loading, setLoading] = useState(initialSchools.length === 0);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState<SchoolExplorerFilters>(() => {
    if (initialSchools.length || typeof window === "undefined") return initialFilters;
    const params = new URLSearchParams(window.location.search);
    const clean = (value: string | null) => value === "all" ? "" : value || "";
    return { query: params.get("q")?.slice(0, 150) || "", district: clean(params.get("district")), city: clean(params.get("city")), area: clean(params.get("area")), ownership: clean(params.get("ownership")), program: clean(params.get("program")), gender: clean(params.get("gender")), department: clean(params.get("department")) };
  });
  const [queryInput, setQueryInput] = useState(filters.query || "");
  const [sort, setSort] = useState("name");
  const [limit, setLimit] = useState(24);
  const [compareCodes, setCompareCodes] = useState<readonly string[]>([]);
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (initialSchools.length) return;
    const controller = new AbortController();
    fetch("/data/school-search-index.json", { headers: { accept: "application/json" }, signal: controller.signal }).then(response => response.ok ? response.json() as Promise<{ schools?: SchoolSearchIndexEntry[] }> : Promise.reject(new Error("index unavailable"))).then(payload => { setSchools(payload.schools || []); setLoadError(""); }).catch(error => { if (error.name !== "AbortError") { setSchools([]); setLoadError("目前無法載入學校資料，請稍後再試。"); } }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [initialSchools]);
  useEffect(() => { const timer = window.setTimeout(() => { setFilters(current => current.query === queryInput ? current : { ...current, query: queryInput }); setLimit(24); }, 180); return () => window.clearTimeout(timer); }, [queryInput]);
  const update = (key: keyof SchoolExplorerFilters, value: string) => { setFilters(current => ({ ...current, [key]: value, ...(key === "city" ? { area: "" } : {}) })); setLimit(24); };
  const clear = () => { setFilters({ query: filters.query }); setLimit(24); };
  const result = useMemo(() => schools.filter(s => { const tokens = (filters.query || "").split(/[\s、,;；]+/).map(normalized).filter(Boolean); const text = s.normalizedSearchText; const queryMatch = tokens.every(token => text.includes(token) || (token === "ai" && text.includes("人工智慧")) || (token === "餐飲" && /餐旅|烘焙/.test(text))); return queryMatch && (!filters.city || s.city === filters.city) && (!filters.area || s.area === filters.area) && (!filters.district || s.admissionDistricts.includes(filters.district)) && (!filters.ownership || s.ownership === filters.ownership) && (!filters.program || (s.schoolTypes || [s.schoolType]).includes(filters.program)) && (!filters.gender || (s.genders || [s.gender]).includes(filters.gender)) && (!filters.department || s.departmentNames.includes(filters.department)); }).sort((a, b) => sort === "quota" ? (Number(b.admissionQuota) || 0) - (Number(a.admissionQuota) || 0) : String(sort === "city" ? a.city : sort === "ownership" ? a.ownership : a.name).localeCompare(String(sort === "city" ? b.city : sort === "ownership" ? b.ownership : b.name), "zh-Hant")), [schools, filters, sort]);
  const active = Object.entries(filters).filter(([key, value]) => key !== "query" && value).length;
  const hasIntent = Boolean((filters.query || "").trim() || active);
  const toggleCompare = (code: string) => setCompareCodes(current => current.includes(code) ? current.filter(item => item !== code) : current.length < 4 ? [...current, code] : current);
  if (loading) return <div className="sv-root"><div className="sv-container sv-loading-shell"><div className="sv-skeleton sv-skeleton-hero" /><div className="sv-skeleton sv-skeleton-row" /><div className="sv-skeleton sv-skeleton-row" /></div></div>;
  if (loadError) return <div className="sv-root"><div className="sv-container sv-empty"><h1>學校資料暫時無法載入</h1><p>{loadError}</p><button className="sv-button sv-primary" type="button" onClick={() => window.location.reload()}>重新載入</button></div></div>;
  return <div className={`sv-root${hasIntent ? " is-search-mode" : " is-explore-mode"}`}><header className={`sv-hero${hasIntent ? " is-compact" : ""}`}><div className="sv-container">{hasIntent ? <div className="sv-compact-heading"><p className="sv-eyebrow">全國高中職查詢</p><h1>找到適合你的學校</h1></div> : <><p className="sv-eyebrow">全國高中職查詢</p><h1>探索全國高中職<br /><em>找到適合你的學校</em></h1><p className="sv-hero-description">從興趣、地區、群科與生活需求開始，找到值得進一步了解的學校。</p></>}<SearchBox value={queryInput} onChange={setQueryInput} compact={hasIntent} />{!hasIntent ? <div className="sv-hot-searches" aria-label="熱門搜尋">{hotSearches.map(term => <button key={term} type="button" onClick={() => setQueryInput(term)}>{term}</button>)}</div> : null}</div></header>{!hasIntent ? <section className="sv-container sv-explore-area" aria-labelledby="explore-shortcuts"><div className="sv-explore-heading"><h2 id="explore-shortcuts">從你想知道的開始</h2><p>還沒有明確目標？先用一個方向探索。</p></div><div className="sv-explore-shortcuts"><ExploreShortcut href="#filters" icon="search" title="依地區探索" description="從縣市、招生區找學校" /><ExploreShortcut href="#filters" icon="school" title="依群科探索" description="從興趣與科別開始" /><ExploreShortcut href="/schools/map" icon="school" title="地圖找學校" description="查看全國學校位置" /><ExploreShortcut href="/schools/compare" icon="calculator" title="開始比較" description="並排比較 2–4 所學校" /></div></section> : null}<div className="sv-container sv-main-content">{hasIntent ? <div className="sv-filter-chips" id="filters"><button type="button" onClick={() => drawer.current?.showModal()}>更多篩選<SiteIcon name="chevron-down" size={15} /></button>{active ? <span>{active} 個條件</span> : null}<span className="sv-availability-note">全國學校資料 · 可依目前可用資料探索</span></div> : null}<div className="sv-layout" id={hasIntent ? undefined : "filters"}>{!hasIntent ? <aside className="sv-filter"><div className="sv-explore-filter-hint"><h2>想縮小範圍？</h2><p>選擇縣市、招生區或群科，結果會立即更新。</p><button type="button" onClick={() => drawer.current?.showModal()}>開啟篩選</button></div></aside> : null}<div className="sv-results"><div className="sv-toolbar"><p aria-live="polite"><strong>{hasIntent ? result.length : schools.length}</strong> {hasIntent ? "所符合條件的學校" : "所學校"}</p>{hasIntent ? <><div className="sv-view-toggle" role="group" aria-label="結果檢視方式"><button type="button" className="is-selected">清單</button><Link href="/schools/map" aria-label="切換到地圖模式">地圖</Link></div><label>排序<select value={sort} onChange={event => setSort(event.target.value)} aria-label="排序方式"><option value="name">相關度／名稱</option><option value="quota">招生名額</option><option value="city">縣市</option><option value="ownership">公私立</option></select></label></> : null}</div>{hasIntent && !result.length ? <div className="sv-empty"><h2>找不到符合條件的學校</h2><p>試試較短的關鍵字，或減少篩選條件。</p><button className="sv-button" type="button" onClick={() => { setQueryInput(""); setFilters({}); }}>重新搜尋</button></div> : null}<div className="sv-result-list">{result.slice(0, limit).map(s => <SchoolCard key={s.code} school={s} selected={compareCodes.includes(s.code)} onCompare={toggleCompare} />)}</div>{result.length > limit ? <button className="sv-button sv-more" type="button" onClick={() => setLimit(current => current + 24)}>顯示更多學校（已顯示 {Math.min(limit, result.length)} / {result.length}）</button> : null}</div></div><p className="sv-data-note">學校基本資料可先瀏覽；招生、交通與住宿資訊會依學校與資料來源分別顯示，尚未提供的欄位不會讓學校從結果消失。</p></div>{compareCodes.length ? <div className="sv-compare-bar"><span>已選 {compareCodes.length} 所學校</span><Link href={`/schools/compare?schools=${compareCodes.join(",")}`}>開始比較<SiteIcon name="chevron-right" size={16} /></Link></div> : null}<dialog ref={drawer} className="sv-drawer"><div className="sv-drawer-head"><strong>調整搜尋條件</strong><button type="button" onClick={() => drawer.current?.close()} aria-label="關閉更多篩選">關閉</button></div><FilterPanel prefix="mobile" schools={schools} filters={filters} update={update} clear={clear} /><button className="sv-button sv-primary" type="button" onClick={() => drawer.current?.close()}>查看 {result.length} 所學校</button></dialog></div>;
}
