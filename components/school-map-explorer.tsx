"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MapRecord = Readonly<{ districtCode: string; districtLabel: string; code: string; name: string; city: string; area: string; address: string }>;
type Payload = Readonly<{ schools: readonly MapRecord[] }>;

export function SchoolMapExplorer({ districtOptions, initialDistrict = "all" }: { districtOptions: readonly { code: string; label: string }[]; initialDistrict?: string }) {
  const [schools, setSchools] = useState<readonly MapRecord[]>([]);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict || "all");
  const [city, setCity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/it_hs/school-directory.json", { headers: { accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error("school_directory"); return response.json() as Promise<Payload>; })
      .then((payload) => { if (active) setSchools(Array.isArray(payload.schools) ? payload.schools : []); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const cities = useMemo(() => [...new Set(schools.filter((school) => district === "all" || school.districtCode === district).map((school) => school.city).filter(Boolean))].sort((left, right) => left.localeCompare(right, "zh-TW")), [district, schools]);
  const filtered = useMemo(() => {
    const needle = normalize(query);
    return schools.filter((school) => {
      const haystack = normalize(`${school.name} ${school.code} ${school.city} ${school.area} ${school.address}`);
      return (!needle || haystack.includes(needle)) && (district === "all" || school.districtCode === district) && (city === "all" || school.city === city);
    }).slice(0, 100);
  }, [city, district, query, schools]);

  return <>
    <section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">學校地圖</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">先把學校位置放進生活半徑。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">從校科目錄查地址、縣市與區域，再開啟 Google Maps 查看實際位置。這裡不臆測路線，地址仍請以學校與官方公告為準。</p></div></section>
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-12"><div className="grid gap-4 p-5 jshs-surface-card md:grid-cols-[1fr_220px_180px] md:p-7"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋學校、地址或代碼<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：高雄、三民、060323" /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => { setDistrict(event.target.value); setCity("all"); }}><option value="all">全部就學區</option>{districtOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">縣市<select value={city} onChange={(event) => setCity(event.target.value)}><option value="all">全部縣市</option>{cities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div><div className="mt-5 flex flex-wrap items-center gap-3"><span className="jshs-chip">顯示 {filtered.length} 所</span><span className="text-xs leading-5 text-slate-500">地址資料來自校科目錄；沒有地址的學校不會補猜位置。</span></div>{loading ? <div className="mt-6 p-8 text-center jshs-surface-card">正在載入學校位置…</div> : null}{loadError ? <div className="mt-6 p-8 text-center jshs-surface-card">學校位置資料暫時無法載入，請稍後再試。</div> : null}{!loading && !loadError ? <div className="mt-7 grid gap-4 md:grid-cols-2">{filtered.map((school) => <article key={`${school.districtCode}:${school.code}`} className="p-5 jshs-surface-card"><p className="text-xs font-black tracking-[.12em] text-[var(--jshs-primary)]">{school.districtLabel} · {school.code}</p><h2 className="mt-2 text-xl font-black">{school.name}</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">{[school.city, school.area].filter(Boolean).join(" · ") || "地區未標示"}</p><p className="mt-2 text-sm leading-6 text-slate-700">{school.address || "CSV 尚未提供地址"}</p><div className="mt-4 flex flex-wrap gap-3"><Link className="text-sm font-black text-[var(--jshs-primary)]" href={`/schools/${school.districtCode}/${school.code}`}>查看學校詳情 →</Link>{school.address ? <a className="text-sm font-black text-[var(--jshs-primary)]" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${school.name} ${school.address}`)}`} target="_blank" rel="noreferrer">開啟 Google Maps ↗</a> : null}</div></article>)}</div> : null}</section>
  </>;
}

function normalize(value: string) {
  return value.replace(/臺/g, "台").trim().toLocaleLowerCase("zh-TW");
}
