"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SourceType = "official" | "school_official" | "committee_official" | "community" | "jshs_derived";
type HistoryRecord = Readonly<{ id: string; district: string; schoolCode: string; schoolName: string; programCode: string; programName: string; schoolYear: string; recordType: string; scoreValue: string; scoreLabel: string; sourceType: SourceType; sourceTitle: string; sourceUrl: string; verifiedAt: string; notes: string }>;
type Payload = Readonly<{ records?: readonly HistoryRecord[] }>;
const officialTypes = new Set<SourceType>(["official", "school_official", "committee_official"]);
const sourceLabels: Record<SourceType, string> = { official: "官方資料", school_official: "學校官方資料", committee_official: "招生委員會官方資料", community: "社群參考資料", jshs_derived: "JSHS 整理資料" };

export function AdmissionHistoryExplorer({ districtOptions, initialDistrict = "all" }: { districtOptions: readonly { code: string; label: string }[]; initialDistrict?: string }) {
  const [records, setRecords] = useState<readonly HistoryRecord[]>([]);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict || "all");
  const [school, setSchool] = useState("all");
  const [program, setProgram] = useState("all");
  const [year, setYear] = useState("all");
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [errorKind, setErrorKind] = useState<"service" | "invalid">("service");
  const [reloadToken, setReloadToken] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/it_hs/historical-records.json", { headers: { accept: "application/json" } })
      .then(async (response) => { if (!response.ok) throw new Error("history_unavailable"); return response.json() as Promise<Payload>; })
      .then((payload) => {
        if (!Array.isArray(payload.records)) throw new Error("history_invalid");
        if (active) { setRecords(payload.records); setState("success"); }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorKind(error instanceof SyntaxError || (error instanceof Error && error.message === "history_invalid") ? "invalid" : "service");
        setState("error");
      });
    return () => { active = false; };
  }, [reloadToken]);
  const filtered = useMemo(() => records.filter((record) => {
    const text = `${record.schoolName} ${record.schoolCode} ${record.programName}`.toLocaleLowerCase("zh-TW");
    return (!query.trim() || text.includes(query.trim().toLocaleLowerCase("zh-TW"))) && (district === "all" || record.district === district) && (school === "all" || record.schoolCode === school) && (program === "all" || record.programCode === program) && (year === "all" || record.schoolYear === year);
  }), [district, program, query, records, school, year]);
  const schools = useMemo(() => [...new Map(records.filter((record) => district === "all" || record.district === district).map((record) => [record.schoolCode, record])).values()].sort((a, b) => a.schoolName.localeCompare(b.schoolName, "zh-TW")), [district, records]);
  const programs = [...new Map(records.map((record) => [record.programCode, record.programName])).entries()].sort((a, b) => a[1].localeCompare(b[1], "zh-TW"));
  const years = [...new Set(records.map((record) => record.schoolYear).filter(Boolean))].sort().reverse();
  const official = filtered.filter((record) => officialTypes.has(record.sourceType));
  const community = filtered.filter((record) => !officialTypes.has(record.sourceType));
  const retry = () => { setState("loading"); setReloadToken((value) => value + 1); };
  const error = errorKind === "invalid" ? { title: "歷年資料格式無法辨識", body: "資料服務有回應，但格式不符合預期；這不是沒有資料。" } : { title: "歷年資料暫時無法載入", body: "資料服務暫時失敗；這不是沒有資料，請稍後重試。" };
  return <><section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">歷年錄取資料探索</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">資料來源與年度必須先分開。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">官方歷史資料與社群參考資料不會混在同一個結果中。歷史資料不等於今年錄取預測。</p></div></section><section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-12"><div className="grid gap-3 p-5 jshs-surface-card md:grid-cols-5"><label className="grid gap-2 text-sm font-black">搜尋<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="學校、科別或代碼" /></label><Select label="就學區" value={district} onChange={(value) => { setDistrict(value); setSchool("all"); }} options={[["all", "全部就學區"], ...districtOptions.map((item) => [item.code, item.label] as const)]} /><Select label="學校" value={school} onChange={setSchool} options={[["all", "全部學校"], ...schools.map((item) => [item.schoolCode, item.schoolName] as const)]} /><Select label="科別" value={program} onChange={setProgram} options={[["all", "全部科別"], ...programs]} /><Select label="年度" value={year} onChange={setYear} options={[["all", "全部年度"], ...years.map((item) => [item, item] as const)]} /></div>{state === "loading" ? <StateCard title="正在載入歷年資料" body="正在讀取可回查的歷史紀錄。" /> : null}{state === "error" ? <StateCard title={error.title} body={error.body} action={<button type="button" onClick={retry} className="px-4 py-3 text-sm jshs-button-primary">重新載入</button>} /> : null}{state === "success" ? <div className="mt-7 grid gap-8"><HistorySection title="官方資料" description="可回查官方、學校或招生委員會來源的歷史紀錄。" records={official} empty="目前沒有找到這個年度的官方歷史資料。" /><HistorySection title="社群參考資料" description="另有社群參考紀錄；它不是官方門檻，也不能用於今年錄取預測。" records={community} empty="目前沒有符合條件的社群參考紀錄。" /></div> : null}</section></>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }) { return <label className="grid gap-2 text-sm font-black">{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
function StateCard({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) { return <div className="mt-6 rounded-2xl border border-dashed border-[var(--jshs-border)] p-7 text-center"><h2 className="text-xl">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p>{action ? <div className="mt-4">{action}</div> : null}</div>; }
function HistorySection({ title, description, records, empty }: { title: string; description: string; records: readonly HistoryRecord[]; empty: string }) { return <section><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">{title}</p><h2 className="mt-2 text-2xl">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{description}</p></div><span className="jshs-chip">{records.length} 筆</span></div>{records.length ? <div className="mt-4 grid gap-4 lg:grid-cols-2">{records.map((record) => <article key={record.id} className="p-5 jshs-surface-card"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-[var(--jshs-primary)]">{record.schoolYear} · {record.schoolCode}</p><h3 className="mt-2 text-xl">{record.schoolName}</h3></div><span className="jshs-chip">{sourceLabels[record.sourceType]}</span></div><p className="mt-3 text-sm">{record.programName} · {record.scoreLabel}：<strong>{record.scoreValue}</strong></p><p className="mt-3 text-xs leading-5 text-slate-500">{record.sourceTitle} · 最後核對 {record.verifiedAt}</p><p className="mt-2 text-xs leading-5 jshs-muted-copy">{record.notes}</p><div className="mt-4 flex flex-wrap gap-3">{record.sourceUrl ? <a href={record.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-black text-[var(--jshs-primary)]">查看原始來源 ↗</a> : <span className="text-sm text-slate-500">此社群紀錄沒有官方原始來源。</span>}<Link href={`/schools/${record.district}/${record.schoolCode}`} className="text-sm font-black text-[var(--jshs-primary)]">查看學校 →</Link></div></article>)}</div> : <StateCard title={empty} body="請調整篩選，或查看另一個資料區塊。" />}</section>; }
