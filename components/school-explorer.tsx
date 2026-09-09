"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SchoolSummary } from "@/lib/school-summary-repository";
import "@/components/schools-v2.css";

export type SchoolExplorerFilters = { query?: string; district?: string; city?: string; area?: string; ownership?: string; program?: string; gender?: string; department?: string };
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
const normalized = (value: string) => value.toLowerCase().replaceAll("台", "臺").replace(/\s/g, "");

export function SchoolExplorer({ schools: initialSchools = [], initialFilters = {} }: { schools?: readonly SchoolSummary[]; initialFilters?: SchoolExplorerFilters }) {
  const [schools, setSchools] = useState<readonly SchoolSummary[]>(initialSchools);
  const [loading, setLoading] = useState(initialSchools.length === 0);
  const [filters, setFilters] = useState<SchoolExplorerFilters>(() => {
    if (initialSchools.length || typeof window === "undefined") return initialFilters;
    const params = new URLSearchParams(window.location.search);
    const clean = (value: string | null) => value === "all" ? "" : value || "";
    return { query: params.get("q")?.slice(0, 150) || "", district: clean(params.get("district")), city: clean(params.get("city")), area: clean(params.get("area")), ownership: clean(params.get("ownership")), program: clean(params.get("program")), gender: clean(params.get("gender")), department: clean(params.get("department")) };
  });
  const [sort, setSort] = useState("name");
  const [limit, setLimit] = useState(24);
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (initialSchools.length) return;
    fetch("/data/schools.json", { headers: { accept: "application/json" } })
      .then(response => response.ok ? response.json() as Promise<{ schools?: SchoolSummary[] }> : Promise.reject(new Error(`schools.json ${response.status}`)))
      .then(payload => setSchools(payload.schools || []))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
  }, [initialSchools]);
  const update = (key: keyof SchoolExplorerFilters, value: string) => { setFilters(current => ({ ...current, [key]: value, ...(key === "city" ? { area: "" } : {}) })); setLimit(24); };
  const cities = unique(schools.map(s => s.city));
  const districts = unique(schools.flatMap(s => s.admissionDistricts));
  const result = useMemo(() => schools.filter(s => {
    const tokens = (filters.query || "").split(/[\s、,;；]+/).map(normalized).filter(Boolean);
    const text = normalized([s.name, s.name.replace(/^(國立|市立|縣立|私立)/, "").replaceAll("高級中學", "高中").replaceAll("高級工業職業學校", "高工"), s.code, s.city, s.area, s.departmentRaw, s.courseDirection, s.features, s.project].join(" "));
    const queryMatch = tokens.every(token => text.includes(token) || (token === "ai" && text.includes("人工智慧")) || (token === "餐飲" && /餐旅|烘焙/.test(text)));
    return queryMatch && (!filters.city || s.city === filters.city) && (!filters.area || s.area === filters.area) && (!filters.district || s.admissionDistricts.includes(filters.district)) && (!filters.ownership || s.ownership === filters.ownership) && (!filters.program || (s.schoolTypes || [s.schoolType]).includes(filters.program)) && (!filters.gender || (s.genders || [s.gender]).includes(filters.gender)) && (!filters.department || s.departments.some(d => d.name === filters.department));
  }).sort((a, b) => sort === "quota" ? (Number(b.admissionQuota) || 0) - (Number(a.admissionQuota) || 0) : String(sort === "city" ? a.city : sort === "ownership" ? a.ownership : a.name).localeCompare(String(sort === "city" ? b.city : sort === "ownership" ? b.ownership : b.name), "zh-Hant")), [schools, filters, sort]);
  const active = Object.entries(filters).filter(([key, value]) => key !== "query" && value).length;
  const panel = (prefix: string) => <><h2>篩選學校</h2>{([
    ["city", "縣市", cities], ["area", "行政區", unique(schools.filter(s => !filters.city || s.city === filters.city).map(s => s.area))], ["district", "招生區／免試就學區", districts], ["ownership", "公私立", unique(schools.map(s => s.ownership))], ["program", "學制", unique(schools.flatMap(s => s.schoolTypes || [s.schoolType]))], ["gender", "招生性別", unique(schools.flatMap(s => s.genders || [s.gender]))], ["department", "科別／方向", unique(schools.flatMap(s => s.departments.map(d => d.name)))]
  ] as [keyof SchoolExplorerFilters, string, string[]][]).map(([key, label, values]) => <label key={key} htmlFor={`${prefix}-${key}`}>{label}<select id={`${prefix}-${key}`} value={filters[key] || ""} onChange={e => update(key, e.target.value)}><option value="">全部</option>{values.map(value => <option key={value}>{value}</option>)}</select></label>)}<button className="sv-button" onClick={() => { setFilters({ query: filters.query }); setLimit(24); }}>清除篩選</button><p className="sv-note">篩選欄位只使用目前 7 區 CSV header 中存在的資料。</p></>;
  return <div className="sv-root"><header className="sv-hero"><div className="sv-container"><p className="sv-eyebrow">JSHS · REGIONAL CSV SOURCE</p><h1>高中職查詢</h1><p>目前開放 7 個招生區，學校資料直接來自各招生區 CSV。</p><label className="sv-search">搜尋學校、科別或課程方向<input type="search" value={filters.query || ""} onChange={e => update("query", e.target.value)} placeholder="學校名稱、代碼、餐飲、AI、特色班…" /></label><div className="sv-stats"><span><b>{schools.length}</b> 所學校</span><span><b>{cities.length}</b> 縣市</span><span><b>{districts.length}</b> 招生區</span><span>115 學年度招生 · 各欄年份依 CSV 原文</span></div><a href="#school-sources">資料來源與使用說明 ↗</a></div></header><div className="sv-container"><nav className="sv-tools" aria-label="學校探索工具"><Link href="/schools/map">學校地圖 ↗</Link><Link href="/schools/compare">比較學校 ↗</Link><Link href="/schools/commute">通勤比較 ↗</Link></nav>{loading ? <p className="sv-note">正在載入最新學校資料…</p> : <div className="sv-layout"><aside className="sv-filter">{panel("desktop")}</aside><div className="sv-results"><div className="sv-toolbar"><p aria-live="polite"><strong>{result.length}</strong> 所符合條件</p><button className="sv-button sv-mobile-filter" onClick={() => drawer.current?.showModal()}>篩選 {active ? `(${active})` : ""}</button><label>排序<select value={sort} onChange={e => setSort(e.target.value)}><option value="name">學校名稱</option><option value="quota">招生名額</option><option value="city">縣市</option><option value="ownership">公私立</option></select></label></div>{!result.length && <div className="sv-empty"><h2>找不到符合條件的學校</h2><p>試試較短的關鍵字，或減少篩選條件。</p><button className="sv-button" onClick={() => setFilters({})}>重新搜尋</button></div>}<div className="sv-result-list">{result.slice(0, limit).map(s => <article className="sv-school" key={s.code}><div><div className="sv-tags"><span>{s.ownership || "公私立空白"}</span><span className={s.schoolType === "進修部" ? "sv-continuing" : ""}>{s.schoolType || "學制空白"}</span>{s.gender ? <span>{s.gender}</span> : null}</div><h2><Link href={`/schools/${s.code}`}>{s.name} <span aria-hidden="true">↗</span></Link></h2><p className="sv-place">{s.city} {s.area} · {s.admissionDistricts.join("、")}</p><p className="sv-departments">{s.departments.slice(0, 4).map(d => d.name).join(" · ") || s.departmentRaw || "目前沒有科別資料"}{s.departments.length > 4 ? ` 等 ${s.departments.length} 科` : ""}</p></div><div className="sv-school-facts"><p><span>115 招生名額</span><strong>{s.admissionQuota || "目前沒有資料"}</strong></p><span>住宿資訊依 CSV 原文</span><span>交通資訊依 CSV 原文</span></div></article>)}</div>{result.length > limit && <button className="sv-button sv-more" onClick={() => setLimit(current => current + 24)}>顯示更多學校（已顯示 {Math.min(limit, result.length)} / {result.length}）</button>}</div></div>}<section className="sv-trust" id="school-sources"><h2>資料來源</h2><p>找學校 runtime 使用 7 個 enabled 招生區 CSV；學校詳細頁保留 CSV 原文與來源欄位。</p><p>generated JSON 只是 build 自動產物，不是人工維護資料來源。</p></section></div><dialog ref={drawer} className="sv-drawer"><div className="sv-drawer-head"><strong>調整搜尋條件</strong><button aria-label="關閉篩選" className="sv-button" onClick={() => drawer.current?.close()}>關閉 ×</button></div>{panel("mobile")}<button className="sv-button sv-primary" onClick={() => drawer.current?.close()}>查看 {result.length} 所學校</button></dialog></div>;
}
