"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteIcon } from "@/components/site-icons";
import { SchoolMedia } from "@/components/school-media";
import type { SchoolSearchIndexEntry } from "@/lib/school-search-index";
import "@/components/schools-v2.css";

export type SchoolExplorerFilters = { query?: string; district?: string; city?: string; area?: string; ownership?: string; program?: string; gender?: string; department?: string };
const normalized = (value: string) => value.toLowerCase().replaceAll("台", "臺").replace(/\s/g, "");
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
// Canonical reference uses 中投區. Keep this list curated and source-backed;
// it is not a runtime ranking or a fabricated popularity score.
const curatedPopularCodes = ["060322", "060323", "061301", "061306"];
// Existing utility routes remain available: /schools/compare and /schools/map.
// Kept client-safe and aligned with content/schools/region-registry.json.
const regions = [{ id: "tp", name: "基北區", schoolDataStatus: "available" }, { id: "taoyuan-lienchiang", name: "桃連區", schoolDataStatus: "available" }, { id: "hsinchu-miaoli", name: "竹苗區", schoolDataStatus: "available" }, { id: "ct", name: "中投區", schoolDataStatus: "available" }, { id: "kaohsiung", name: "高雄區", schoolDataStatus: "available" }] as const;
const defaultDistrict = "ct";

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <form className="sv-search-box" role="search" onSubmit={(event) => event.preventDefault()}><SiteIcon name="search" size={20} /><label className="sr-only" htmlFor="school-search">搜尋學校、科別或課程方向</label><input id="school-search" type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder="搜尋學校名稱、地區或科別…" /><button type="submit" aria-label="搜尋"><SiteIcon name="search" size={19} /></button></form>;
}

function FilterPanel({ prefix, schools, filters, update, clear }: { prefix: string; schools: readonly SchoolSearchIndexEntry[]; filters: SchoolExplorerFilters; update: (key: keyof SchoolExplorerFilters, value: string) => void; clear: () => void }) {
  const fields: [keyof SchoolExplorerFilters, string, string[]][] = [["ownership", "公私立", unique(schools.map((school) => school.ownership))], ["program", "學校類型／學制", unique(schools.flatMap((school) => school.schoolTypes || [school.schoolType]))], ["city", "縣市", unique(schools.map((school) => school.city))], ["department", "科別", unique(schools.flatMap((school) => school.departmentNames))]];
  return <div className="sv-filter-fields"><div className="sv-filter-heading"><strong>篩選條件</strong><button type="button" onClick={clear}>清除</button></div>{fields.map(([key, label, values]) => <label key={key} htmlFor={`${prefix}-${key}`}>{label}<select id={`${prefix}-${key}`} value={filters[key] || ""} onChange={(event) => update(key, event.target.value)}><option value="">全部</option>{values.map((value) => <option key={value}>{value}</option>)}</select></label>)}</div>;
}

function SchoolCard({ school, selected, onCompare, compact = false }: { school: SchoolSearchIndexEntry; selected?: boolean; onCompare?: (code: string) => void; compact?: boolean }) {
  return <article className={`sv-school-card${compact ? " is-popular" : ""}`}><Link className="sv-school-card-image" href={`/schools/${school.code}`}><SchoolMedia code={school.code} name={school.name} address={`${school.city}${school.area}`} /></Link><div className="sv-school-card-main"><div className="sv-card-topline"><div className="sv-tags"><span>{school.ownership || "公私立資料未提供"}</span><span>{school.schoolType || "學校類型未提供"}</span><span>{school.gender || "性別未提供"}</span></div>{onCompare ? <button type="button" className={`sv-favorite-button${selected ? " is-selected" : ""}`} aria-pressed={selected} aria-label={selected ? "取消比較" : "加入比較"} onClick={() => onCompare(school.code)}>♡</button> : null}</div><h3><Link href={`/schools/${school.code}`}>{school.name}</Link></h3><p className="sv-place">{school.city}{school.area ? ` · ${school.area}` : ""} · {school.admissionDistricts.join("、") || "招生區資料尚未提供"}</p>{!compact ? <><p className="sv-departments">{school.departmentNames.slice(0, 2).join(" · ") || "主要科別尚未提供"}</p><div className="sv-school-card-actions"><Link className="sv-primary-link" href={`/schools/${school.code}`}>查看學校 <SiteIcon name="chevron-right" size={15} /></Link></div></> : null}</div></article>;
}

export function SchoolExplorer({ schools: initialSchools = [], initialFilters = {} }: { schools?: readonly SchoolSearchIndexEntry[]; initialFilters?: SchoolExplorerFilters }) {
  const [schools, setSchools] = useState<readonly SchoolSearchIndexEntry[]>(initialSchools);
  const [loading, setLoading] = useState(initialSchools.length === 0);
  const [loadError, setLoadError] = useState("");
  const [district, setDistrict] = useState(() => { if (typeof window !== "undefined") { const saved = window.localStorage.getItem("jshs-school-district"); if (saved && regions.some((region) => region.id === saved)) return saved; } return initialFilters.district || defaultDistrict; });
  const [queryInput, setQueryInput] = useState(initialFilters.query || "");
  const [filters, setFilters] = useState<SchoolExplorerFilters>({ ...initialFilters, district: initialFilters.district || defaultDistrict });
  const [sort, setSort] = useState("name");
  const [compareCodes, setCompareCodes] = useState<readonly string[]>([]);
  const drawer = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!initialSchools.length) {
      const controller = new AbortController();
      fetch("/data/school-search-index.json", { headers: { accept: "application/json" }, signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<{ schools?: SchoolSearchIndexEntry[] }> : Promise.reject(new Error("index unavailable"))).then((payload) => setSchools(payload.schools || [])).catch((error) => { if (error.name !== "AbortError") setLoadError("目前無法載入學校資料，請稍後再試。"); }).finally(() => setLoading(false));
      return () => controller.abort();
    }
  }, [initialSchools]);
  useEffect(() => { window.localStorage.setItem("jshs-school-district", district); }, [district]);
  useEffect(() => { const timer = window.setTimeout(() => setFilters((current) => ({ ...current, query: queryInput })), 180); return () => window.clearTimeout(timer); }, [queryInput]);

  const scopedSchools = useMemo(() => {
    const scopeName = regions.find((region) => region.id === district)?.name || district;
    return schools.filter((school) => school.admissionDistricts.some((admissionDistrict) => admissionDistrict.includes(scopeName)));
  }, [schools, district]);
  const result = useMemo(() => scopedSchools.filter((school) => { const tokens = (filters.query || "").split(/[\s、,;；]+/).map(normalized).filter(Boolean); const queryMatch = tokens.every((token) => school.normalizedSearchText.includes(token) || (token === "餐飲" && /餐旅|烘焙/.test(school.normalizedSearchText))); return queryMatch && (!filters.city || school.city === filters.city) && (!filters.ownership || school.ownership === filters.ownership) && (!filters.program || (school.schoolTypes || [school.schoolType]).includes(filters.program)) && (!filters.department || school.departmentNames.includes(filters.department)); }).sort((a, b) => String(sort === "city" ? a.city : sort === "ownership" ? a.ownership : a.name).localeCompare(String(sort === "city" ? b.city : sort === "ownership" ? b.ownership : b.name), "zh-Hant")), [scopedSchools, filters, sort]);
  const popularSchools = useMemo(() => curatedPopularCodes.map((code) => scopedSchools.find((school) => school.code === code)).filter((school): school is SchoolSearchIndexEntry => Boolean(school)).slice(0, 4), [scopedSchools]);
  const active = Object.entries(filters).filter(([key, value]) => key !== "query" && key !== "district" && value).length;
  const hasIntent = Boolean((filters.query || "").trim() || active);
  const update = (key: keyof SchoolExplorerFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const clear = () => setFilters((current) => ({ district: current.district }));
  const changeDistrict = (value: string) => { setDistrict(value); setFilters((current) => ({ ...current, district: value })); };
  const toggleCompare = (code: string) => setCompareCodes((current) => current.includes(code) ? current.filter((item) => item !== code) : current.length < 4 ? [...current, code] : current);

  if (loading) return <div className="sv-root"><div className="sv-container sv-loading-shell"><div className="sv-skeleton sv-skeleton-hero" /><div className="sv-skeleton sv-skeleton-row" /><div className="sv-skeleton sv-skeleton-row" /></div></div>;
  if (loadError) return <div className="sv-root"><div className="sv-container sv-empty"><h1>學校資料暫時無法載入</h1><p>{loadError}</p><button className="sv-button sv-primary" type="button" onClick={() => window.location.reload()}>重新載入</button></div></div>;
  const region = regions.find((item) => item.id === district);
  return <div className={`sv-root sv-explorer-root${hasIntent ? " is-search-mode" : ""}`}><header className="sv-hero"><div className="sv-container"><p className="sv-eyebrow">全國國中升學資訊網 · 官方資料查校</p><h1>找到適合你的學校</h1><p className="sv-hero-description">從官方資料開始，認識每一所高中。</p><SearchBox value={queryInput} onChange={setQueryInput} /><div className="sv-district-control"><span className="sv-district-label"><SiteIcon name="school" size={18} />目前就學區</span><select value={district} onChange={(event) => changeDistrict(event.target.value)} aria-label="選擇目前就學區">{regions.map((item) => <option key={item.id} value={item.id} disabled={item.schoolDataStatus !== "available"}>{item.name}{item.schoolDataStatus !== "available" ? "（資料準備中）" : ""}</option>)}</select><small>依你的位置初步建議，如需調整可隨時切換</small></div></div></header><div className="sv-container sv-shortcuts"><Link href="#popular"><SiteIcon name="school" size={20} /><span>探索學校</span></Link><Link href="#filters"><SiteIcon name="shield" size={20} /><span>學校類型</span></Link><Link href="#filters"><SiteIcon name="search" size={20} /><span>縣市</span></Link><Link href="#filters"><SiteIcon name="knowledge" size={20} /><span>科別</span></Link><button type="button" onClick={() => drawer.current?.showModal()}><SiteIcon name="more" size={20} /><span>更多</span></button></div>{!hasIntent ? <section className="sv-container sv-popular-section" id="popular"><div className="sv-section-heading"><div><h2>{region?.name || "目前就學區"}探索學校</h2><p>從這裡開始探索目前資料範圍內的學校。</p></div><a href="#explore">查看全部 <SiteIcon name="chevron-right" size={15} /></a></div>{popularSchools.length ? <div className="sv-school-grid sv-popular-grid">{popularSchools.map((school) => <SchoolCard key={school.code} school={school} compact />)}</div> : <div className="sv-inline-empty">目前沒有可先展示的學校，請從下方完整清單探索。</div>}</section> : null}<section className="sv-container sv-explore-section" id="explore"><div className="sv-section-heading"><div><h2>探索{region?.name || "目前就學區"}所有學校</h2><p>使用篩選條件，快速找到符合你需求的學校。</p></div></div><div className="sv-filter-row" id="filters"><button type="button" onClick={() => drawer.current?.showModal()}><SiteIcon name="shield" size={17} />篩選條件{active ? ` (${active})` : ""}</button><label>排序方式<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">名稱</option><option value="city">縣市</option><option value="ownership">公私立</option></select></label></div><div className="sv-result-meta"><span>共 <strong>{result.length}</strong> 所學校</span><span className="sv-availability-note">資料範圍依目前可用的官方區域資料</span></div>{result.length ? <div className="sv-school-grid">{result.slice(0, 24).map((school) => <SchoolCard key={school.code} school={school} selected={compareCodes.includes(school.code)} onCompare={toggleCompare} />)}</div> : <div className="sv-empty"><h2>找不到符合條件的學校</h2><p>試試較短的關鍵字，或減少篩選條件。</p><button className="sv-button" type="button" onClick={() => { setQueryInput(""); clear(); }}>重新搜尋</button></div>}</section><p className="sv-data-note">學校基本資料可先瀏覽；招生、交通與住宿資訊依學校與資料來源分別顯示，尚未提供的欄位不會讓學校從結果消失。</p>{compareCodes.length ? <div className="sv-compare-bar"><span>已選 {compareCodes.length} 所學校</span><Link href={`/schools/compare?schools=${compareCodes.join(",")}`}>開始比較 <SiteIcon name="chevron-right" size={15} /></Link></div> : null}<dialog ref={drawer} className="sv-drawer"><div className="sv-drawer-head"><strong>調整搜尋條件</strong><button type="button" onClick={() => drawer.current?.close()} aria-label="關閉更多篩選"><SiteIcon name="close" size={18} /></button></div><FilterPanel prefix="mobile" schools={scopedSchools} filters={filters} update={update} clear={clear} /><button className="sv-button sv-primary" type="button" onClick={() => drawer.current?.close()}>查看 {result.length} 所學校</button></dialog></div>;
}
