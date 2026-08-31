"use client";

import { useState } from "react";
import { getOfficialInformationRecords, officialInformationTypes, type OfficialInformationRecord } from "@/lib/official-information";

const typeLabels = { guide: "簡章", schedule: "時程", announcement: "公告", rule: "規則", platform: "官方入口", other: "其他" } as const;
export function OfficialInformationExplorer({ mode = "library" }: { mode?: "library" | "news" }) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [year, setYear] = useState("all");
  const [type, setType] = useState("all");
  const [issuer, setIssuer] = useState("all");
  const records = getOfficialInformationRecords();
  const districts = [...new Map(records.map((record) => [record.district, record.title.replace(/官方招生資訊入口|免試入學簡章/g, "")])).entries()];
  const years = [...new Set(records.map((record) => record.schoolYear).filter(Boolean))].sort().reverse();
  const issuers = [...new Set(records.map((record) => record.issuer))].sort();
  const filtered = records.filter((record) => {
    const text = `${record.title} ${record.issuer} ${record.summary}`.toLocaleLowerCase("zh-TW");
    return (!query.trim() || text.includes(query.trim().toLocaleLowerCase("zh-TW"))) && (district === "all" || record.district === district) && (year === "all" || record.schoolYear === year) && (type === "all" || record.type === type) && (issuer === "all" || record.issuer === issuer);
  });
  const announcements = filtered.filter((record) => record.type === "announcement");
  const displayed = mode === "news" ? announcements : filtered;
  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-8 md:py-12"><div className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">官方資訊資料庫</p><h1 className="mt-2">{mode === "news" ? "官方資訊入口" : "官方簡章與規則"}</h1><p className="mt-3 max-w-3xl text-sm leading-7 jshs-muted-copy">{mode === "news" ? "目前尚未建立可驗證的公告收錄流程，因此本頁不把官方入口網站偽裝成最新公告。請使用下方篩選查看已登錄的官方資訊。": "官方原始資訊與 JSHS 整理內容會分開標記；115 文件不會被改寫為 116 正式資料。"}</p><div className="mt-6 grid gap-3 md:grid-cols-3"><label className="grid gap-2 text-sm font-black">搜尋<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="標題、發布單位或關鍵字" /></label><Select label="就學區" value={district} onChange={setDistrict} options={[["all", "全部就學區"], ...districts]} /><Select label="學年度" value={year} onChange={setYear} options={[["all", "全部學年度"], ...years.map((item) => [item, item] as const)]} /><Select label="資料類型" value={type} onChange={setType} options={[["all", "全部類型"], ...officialInformationTypes.map((item) => [item, typeLabels[item]] as const)]} /><Select label="發布單位" value={issuer} onChange={setIssuer} options={[["all", "全部發布單位"], ...issuers.map((item) => [item, item] as const)]} /><div className="grid content-end text-sm jshs-muted-copy">發布日期：資料尚未提供時明確顯示「未提供」。</div></div>{mode === "news" && !announcements.length ? <Empty title="目前沒有可驗證的官方公告紀錄。" body="官方入口不是公告紀錄；待有公告 ingestion 與來源校核後才會在這裡顯示。" /> : null}{mode === "library" && !displayed.length ? <Empty title="目前沒有符合條件的官方資訊。" body="請調整搜尋與篩選條件。" /> : null}{displayed.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{displayed.map((record) => <RecordCard key={record.id} record={record} />)}</div> : null}</div></section>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }) { return <label className="grid gap-2 text-sm font-black">{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
function Empty({ title, body }: { title: string; body: string }) { return <div className="mt-6 rounded-2xl border border-dashed p-7 text-center"><h2 className="text-xl">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p></div>; }
function RecordCard({ record }: { record: OfficialInformationRecord }) { return <article className="p-5 jshs-surface-card"><div className="flex items-start justify-between gap-3"><span className="jshs-chip">{record.sourceType === "official_original" ? "官方原始資訊" : "JSHS 整理內容"}</span><span className="jshs-chip">{typeLabels[record.type]}</span></div><h2 className="mt-3 text-xl">{record.title}</h2><dl className="mt-4 grid gap-1 text-sm leading-6 text-slate-600"><div>發布單位：{record.issuer}</div><div>就學區：{record.district}</div><div>學年度：{record.schoolYear || "未提供"}</div><div>發布日期：{record.publishDate || "未提供"}</div><div>更新日期：{record.updatedAt}</div></dl><p className="mt-3 text-sm leading-6 jshs-muted-copy">{record.summary}</p><a href={record.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]">查看原始來源 ↗</a></article>; }
