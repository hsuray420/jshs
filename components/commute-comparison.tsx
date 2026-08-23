"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CommuteRecord = Readonly<{ districtCode: string; districtLabel: string; code: string; name: string; city: string; area: string }>;
type Payload = Readonly<{ schools: readonly CommuteRecord[] }>;
type CommuteInput = Readonly<{ minutes: number; days: number }>;

export function CommuteComparison({ districtOptions, initialDistrict = "all" }: { districtOptions: readonly { code: string; label: string }[]; initialDistrict?: string }) {
  const [schools, setSchools] = useState<readonly CommuteRecord[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [inputs, setInputs] = useState<Readonly<Record<string, CommuteInput>>>({});
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict || "all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/it_hs/school-directory.json", { headers: { accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error("school_directory"); return response.json() as Promise<Payload>; })
      .then((payload) => { if (active) setSchools(Array.isArray(payload.schools) ? payload.schools : []); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const choices = useMemo(() => { const needle = normalize(query); return schools.filter((school) => (!needle || normalize(`${school.name} ${school.code} ${school.city} ${school.area}`).includes(needle)) && (district === "all" || school.districtCode === district)).slice(0, 60); }, [district, query, schools]);
  const selectedSchools = useMemo(() => selected.map((key) => schools.find((school) => `${school.districtCode}:${school.code}` === key)).filter((school): school is CommuteRecord => Boolean(school)), [schools, selected]);
  const ranked = useMemo(() => selectedSchools.map((school) => ({ school, input: inputs[`${school.districtCode}:${school.code}`] || { minutes: 0, days: 5 }, weekly: (inputs[`${school.districtCode}:${school.code}`]?.minutes || 0) * 2 * (inputs[`${school.districtCode}:${school.code}`]?.days || 5) })).sort((left, right) => right.weekly - left.weekly), [inputs, selectedSchools]);

  function toggle(key: string) {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : current.length >= 4 ? current : [...current, key]);
  }

  function updateInput(key: string, field: keyof CommuteInput, value: string) {
    setInputs((current) => ({ ...current, [key]: { ...(current[key] || { minutes: 0, days: 5 }), [field]: Math.max(0, Number(value) || 0) } }));
  }

  return <>
    <section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">通勤比較</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">用你的實際路線，排出通勤負擔。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">選最多四所學校，再輸入單程分鐘數與每週天數；系統只做算術比較，不代替地圖導航，也不臆測你的出發地。</p></div></section>
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-12"><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><div><div className="p-5 jshs-surface-card"><p className="jshs-eyebrow">選擇學校</p><label className="mt-3 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="學校、縣市或代碼" /></label><label className="mt-3 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => setDistrict(event.target.value)}><option value="all">全部就學區</option>{districtOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label><p className="mt-4 text-xs leading-5 text-slate-500">已選 {selected.length}／4 所。比較只保存於目前頁面。</p><div className="mt-4 grid gap-2">{loading ? <p className="text-sm jshs-muted-copy">正在載入學校…</p> : choices.map((school) => { const key = `${school.districtCode}:${school.code}`; return <label key={key} className="flex items-start gap-3 rounded-xl border border-[var(--jshs-border)] p-3 text-sm"><input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} /><span><strong className="block">{school.name}</strong><small className="text-slate-500">{school.districtLabel} · {school.city}{school.area ? ` · ${school.area}` : ""}</small></span></label>; })}</div></div></div><div><div className="p-5 jshs-surface-card"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">輸入實際時間</p><h2 className="mt-2 text-2xl font-black">每週通勤比較</h2></div><span className="jshs-chip">單程分鐘 × 2 × 每週天數</span></div>{ranked.length ? <div className="mt-5 grid gap-4">{ranked.map(({ school, input, weekly }) => { const key = `${school.districtCode}:${school.code}`; return <article key={key} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{school.name}</h3><p className="text-xs text-slate-500">{school.city} {school.area}</p></div><strong className="text-[var(--jshs-primary)]">每週 {weekly} 分鐘</strong></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">單程分鐘<input type="number" min="0" value={input.minutes || ""} onChange={(event) => updateInput(key, "minutes", event.target.value)} /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">每週天數<input type="number" min="0" max="7" value={input.days || ""} onChange={(event) => updateInput(key, "days", event.target.value)} /></label></div><Link className="mt-3 inline-block text-xs font-black text-[var(--jshs-primary)]" href={`/schools/${school.districtCode}/${school.code}`}>查看學校資料 →</Link></article>; })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[var(--jshs-border)] p-8 text-center text-sm leading-6 jshs-muted-copy">先在左側選擇學校，最多四所。</div>}<p className="mt-5 text-xs leading-6 text-slate-500">結果只反映你輸入的單程時間與到校天數；實際路線、轉乘、天候與校車資訊請另行核對。</p></div></div></div></section>
  </>;
}

function normalize(value: string) {
  return value.replace(/臺/g, "台").trim().toLocaleLowerCase("zh-TW");
}
