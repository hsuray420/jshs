"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SourceBadge } from "@/components/source-badge";

type HistoryRecord = Readonly<{
  districtCode: string;
  districtLabel: string;
  academicYear: string;
  dataStatus: string;
  sourceName: "非官方整理";
  sourceUrl: string;
  code: string;
  name: string;
  program: string;
  city: string;
  area: string;
  departmentsRaw: string;
  referenceScore: string;
  scoreYear: string;
  sourceNote: string;
  sourceType: "community";
}>;

type HistoryPayload = Readonly<{ updatedAt: string; schools: readonly HistoryRecord[] }>;

export function AdmissionHistoryExplorer({ districtOptions, initialDistrict = "all" }: { districtOptions: readonly { code: string; label: string }[]; initialDistrict?: string }) {
  const [schools, setSchools] = useState<readonly HistoryRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict || "all");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    fetch("/it_hs/admission-history.json", { headers: { accept: "application/json" }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`admission_history_${response.status}`);
        return response.json() as Promise<HistoryPayload>;
      })
      .then((payload) => {
        if (!active || !Array.isArray(payload.schools)) throw new Error("admission_history_invalid");
        setSchools(payload.schools.filter((school) => school.sourceType === "community"));
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
        setLoaded(true);
      });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, []);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return schools.filter((school) => {
      const haystack = normalize(`${school.name} ${school.code} ${school.city} ${school.area} ${school.departmentsRaw}`);
      return (!needle || haystack.includes(needle)) && (district === "all" || school.districtCode === district);
    });
  }, [district, query, schools]);

  return <>
    <section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">歷年錄取參考</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">獨立整理的歷年參考資料。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">全部內容都是非官方整理，正式資格、名額與錄取結果請以當年度官方公告為準。</p></div></section>
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-12">
      <div className="grid gap-4 p-5 jshs-surface-card md:grid-cols-[1fr_220px] md:p-7">
        <label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋學校、科系、縣市或代碼<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：中科實驗、普通科、060323" /></label>
        <FilterSelect label="就學區" value={district} onChange={setDistrict} options={[{ code: "all", label: "全部就學區" }, ...districtOptions]} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><SourceBadge sourceType="community" />{loaded ? <span className="text-sm jshs-muted-copy">{filtered.length} 筆</span> : null}<p className="text-xs leading-5 text-slate-500">本頁僅供經驗與趨勢參考；不代表今年錄取保證。</p></div>
      {!loaded ? <div className="mt-6 p-8 text-center jshs-surface-card">正在載入歷年錄取資料…</div> : null}
      {loadError ? <div className="mt-6 p-8 text-center jshs-surface-card"><h2 className="text-xl">歷年資料暫時無法載入</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">請重新載入；如果問題持續，請稍後再試。</p><button type="button" onClick={() => window.location.reload()} className="mt-4 min-h-11 px-4 py-3 text-sm jshs-button-primary">重新載入</button></div> : null}
      {loaded && !loadError ? <div className="mt-7 grid gap-8"><HistoryGroup schools={filtered} /></div> : null}
    </section>
  </>;
}

function HistoryGroup({ schools }: { schools: readonly HistoryRecord[] }) {
  return <section aria-labelledby="history-community"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">社群資料</p><h2 id="history-community" className="mt-2 text-2xl font-black">歷年錄取參考</h2></div><span className="text-sm jshs-muted-copy">{schools.length} 筆</span></div>{schools.length ? <div className="mt-4 grid gap-4 lg:grid-cols-2">{schools.map((school) => <article key={`${school.districtCode}:${school.code}`} className="p-5 jshs-surface-card"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black tracking-[.12em] text-[var(--jshs-primary)]">{school.districtLabel} · {school.code}</p><h3 className="mt-2 text-xl font-black">{school.name}</h3></div><SourceBadge sourceType="community" /></div><p className="mt-3 text-sm leading-6 jshs-muted-copy">{[school.city, school.area, school.program].filter(Boolean).join(" · ")}</p><dl className="mt-4 grid gap-3 sm:grid-cols-2"><HistoryFact label="最低錄取成績／參考資料" value={school.referenceScore} /><HistoryFact label="年度" value={school.scoreYear || "未標示"} /></dl><p className="mt-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-7 text-slate-700">科系：{school.departmentsRaw || "未標示"}</p><p className="mt-4 text-xs leading-5 text-slate-500">資料性質：社群資料；資料來源：{school.sourceNote || "資料檔未提供其他備註"}</p><Link className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]" href={`/schools/${school.districtCode}/${school.code}`}>查看學校詳情 →</Link></article>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-[var(--jshs-border)] p-6 text-sm leading-6 jshs-muted-copy">目前沒有符合條件的社群資料，不以推估資料補空白。</div>}</section>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly { code: string; label: string }[] }) {
  return <label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label>;
}

function HistoryFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><dt className="text-xs font-black text-slate-400">{label}</dt><dd className="mt-2 font-black leading-6 text-[var(--jshs-primary)]">{value}</dd></div>;
}

function normalize(value: string) {
  return value.replace(/臺/g, "台").trim().toLocaleLowerCase("zh-TW");
}
