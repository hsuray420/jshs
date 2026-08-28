"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SourceBadge } from "@/components/source-badge";

type CompareSchool = Readonly<{ districtCode: string; districtLabel: string; code: string; name: string; city: string; area: string; program: string; ownership: string; departmentsRaw: string; quota: string; academicYear: string; sourceName: string }>;
type Payload = Readonly<{ schools?: readonly CompareSchool[] }>;

export function SchoolComparisonExplorer({ districtOptions, initialDistrict = "all" }: { districtOptions: readonly { code: string; label: string }[]; initialDistrict?: string }) {
  const [schools, setSchools] = useState<readonly CompareSchool[]>([]);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict || "all");
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/it_hs/school-directory.json", { headers: { accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error("school_directory"); return response.json() as Promise<Payload>; })
      .then((payload) => { if (active) setSchools(Array.isArray(payload.schools) ? payload.schools : []); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadToken]);

  function retry() {
    setLoading(true);
    setError(false);
    setReloadToken((value) => value + 1);
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("zh-TW");
    return schools.filter((school) => {
      const haystack = `${school.name} ${school.code} ${school.city} ${school.area} ${school.departmentsRaw}`.toLocaleLowerCase("zh-TW");
      return (district === "all" || school.districtCode === district) && (!needle || haystack.includes(needle));
    }).slice(0, 80);
  }, [district, query, schools]);

  const selectedSchools = useMemo(() => selected.map((key) => schools.find((school) => schoolKey(school) === key)).filter((school): school is CompareSchool => Boolean(school)), [schools, selected]);

  function toggle(school: CompareSchool) {
    const key = schoolKey(school);
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : current.length >= 4 ? current : [...current, key]);
  }

  return <>
    <section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">找學校 · 學校比較</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">把 2～4 所校科放在一起比較。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">選擇學校後並排查看學制、公私立、科別、招生名額與資料年度；不同欄位保留各自的資料來源。</p></div></section>
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-12">
      <div className="grid gap-4 p-5 jshs-surface-card md:grid-cols-[1fr_220px]"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋學校、科別或代碼<input value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => { setDistrict(event.target.value); setSelected([]); }}><option value="all">全部就學區</option>{districtOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="jshs-muted-copy">{loading ? "正在載入學校資料…" : `已選 ${selectedSchools.length}／4 所`}</span>{selected.length ? <button type="button" onClick={() => setSelected([])} className="min-h-11 px-3 py-2 text-sm jshs-button-secondary">清除比較清單</button> : null}</div>
      {error ? <div className="mt-5 p-6 jshs-surface-card"><p className="text-sm leading-6 text-red-700">學校資料暫時無法載入。</p><button type="button" onClick={retry} className="mt-4 min-h-11 px-4 py-3 text-sm jshs-button-primary">重新載入</button></div> : null}
      {loading ? <div className="mt-5 grid gap-3 md:grid-cols-2"><div className="h-32 animate-pulse rounded-2xl bg-[var(--jshs-muted-surface)]" /><div className="h-32 animate-pulse rounded-2xl bg-[var(--jshs-muted-surface)]" /></div> : null}
      {!loading && !error ? <div className="mt-5 grid gap-3 md:grid-cols-2">{filtered.map((school) => { const selectedSchool = selected.includes(schoolKey(school)); return <label key={schoolKey(school)} className={`flex cursor-pointer items-start gap-3 p-5 jshs-surface-card ${selectedSchool ? "ring-2 ring-[var(--jshs-primary)]" : ""}`}><input type="checkbox" checked={selectedSchool} disabled={!selectedSchool && selected.length >= 4} onChange={() => toggle(school)} /><span className="min-w-0"><span className="block text-xs font-black text-[var(--jshs-primary)]">{school.districtLabel} · {school.code}</span><strong className="mt-2 block text-lg">{school.name}</strong><span className="mt-1 block text-sm text-slate-600">{[school.city, school.area, school.program, school.ownership].filter(Boolean).join(" · ")}</span></span></label>; })}{!filtered.length ? <p className="p-6 text-sm leading-6 jshs-muted-copy">目前沒有符合條件的學校。</p> : null}</div> : null}
      <ComparisonPanel schools={selectedSchools} />
    </section>
  </>;
}

function ComparisonPanel({ schools }: { schools: readonly CompareSchool[] }) {
  if (schools.length < 2) return <div className="mt-8 rounded-2xl border border-dashed border-[var(--jshs-border)] p-6 text-sm leading-7 jshs-muted-copy">請至少選擇 2 所學校／校科，才會顯示並排比較。</div>;
  const rows: Array<[string, (school: CompareSchool) => string]> = [["學校類型", (school) => school.program || "資料未提供"], ["公私立", (school) => school.ownership || "資料未提供"], ["科別", (school) => school.departmentsRaw || "資料未提供"], ["招生名額", (school) => school.quota || "目前沒有可回查的名額資料"], ["資料年度", (school) => `${school.academicYear} 學年度`], ["整理來源", (school) => school.sourceName || "資料來源未標示"]];
  return <section className="mt-8" aria-labelledby="comparison-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">比較結果</p><h2 id="comparison-title" className="mt-2 text-2xl">{schools.length} 所學校／校科</h2></div><SourceBadge sourceType="jshs_curated" /></div><div className="mt-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${schools.length}, minmax(0, 1fr))` }}>{schools.map((school) => <article key={schoolKey(school)} className="min-w-0 p-5 jshs-surface-card"><h3 className="text-xl">{school.name}</h3><p className="mt-1 text-xs text-slate-500">{school.districtLabel} · {school.code}</p><Link href={`/schools/${school.districtCode}/${school.code}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-[var(--jshs-primary)]">查看學校詳情 →</Link></article>)}</div><div className="mt-3 grid gap-3">{rows.map(([label, value]) => <div key={label} className="grid gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4" style={{ gridTemplateColumns: `minmax(6rem,.6fr) repeat(${schools.length}, minmax(0, 1fr))` }}><strong>{label}</strong>{schools.map((school) => <span key={schoolKey(school)} className="break-words text-sm leading-6 text-slate-700">{value(school)}</span>)}</div>)}</div><p className="mt-4 text-xs leading-6 text-slate-500">比較中的資料是 JSHS 整理；歷年錄取、通勤、費用與社群內容請從各自功能查看並保留來源標示。</p></section>;
}

function schoolKey(school: CompareSchool) { return `${school.districtCode}:${school.code}`; }
