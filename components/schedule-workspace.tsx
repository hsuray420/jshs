"use client";
import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { getDistrictLabel, readStoredDistrict, subscribeToDistrict, type DistrictCode } from "@/lib/district-context";
import { getDistrictAdmissionSchedule } from "@/lib/admission-schedules";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR } from "@/lib/trust";

export type ScheduleView = "overview" | "countdown" | "timeline" | "now" | "tasks" | "compare" | "open-days" | "export";
type ImportantDate = { id: string; title: string; description: string; eventDate: string; sendAt?: string; status?: "confirmed" | "pending" | "previous_year_reference" | "provisional"; sourcePages?: "I" | "II" | "i" | "ii" | "iii" };
type OpenDay = { id: string; school: string; eventDate: string; url: string; notes: string };

const targetDate = new Date("2027-05-15T08:00:00+08:00");
const fallbackImportantDates: ImportantDate[] = [
  { id: "fallback-exam", title: "國中教育會考", description: "確認准考證、應試用品與交通安排。", eventDate: "2027-05-15", sendAt: "2027-05-15T00:00:00.000Z" },
  { id: "fallback-admission", title: "確認免試入學簡章", description: "核對志願選填、報名與放榜時程。", eventDate: "2027-06-01", sendAt: "2027-06-01T01:00:00.000Z" },
];
const fallbackTasks = [
  { id: "read-rules", title: "讀完適用就學區規則", detail: "確認比序項目、志願數量與重要截止日。" },
  { id: "try-schools", title: "建立三層候選校科", detail: "至少各放一個挑戰、適中與穩定選項。" },
  { id: "check-score", title: "完成一次成績試算", detail: "留下年度、區域與待補欄位，避免混用規則。" },
  { id: "family-meeting", title: "完成一次家庭討論", detail: "記下學生想要的學習內容與家庭需要確認的條件。" },
] as const;

export function ScheduleWorkspace({ view = "overview" }: { view?: ScheduleView }) {
  const district = useSyncExternalStore(subscribeToDistrict, readStoredDistrict, () => "") as DistrictCode | "";
  const [now, setNow] = useState(() => new Date());
  const [done, setDone] = useState<Record<string, boolean>>(() => typeof window === "undefined" ? {} : readJson("jshs_schedule_tasks", {}));
  const [compare, setCompare] = useState(["ct", "tp"]);
  const [status, setStatus] = useState("");
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(fallbackImportantDates);
  const [scheduleTasks, setScheduleTasks] = useState(fallbackTasks);
  const [openDays, setOpenDays] = useState<OpenDay[]>(() => typeof window === "undefined" ? [] : readJson("jshs_schedule_open_days", []));
  const [newOpenDay, setNewOpenDay] = useState({ school: "", eventDate: "", url: "", notes: "" });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    fetch("/api/schedule", { headers: { accept: "application/json" } }).then(async (response) => {
      if (!response.ok) return null;
      return await response.json() as { dates?: ImportantDate[]; tasks?: typeof fallbackTasks };
    }).then((payload) => {
      if (payload?.dates?.length) setImportantDates(payload.dates);
      if (payload?.tasks?.length) setScheduleTasks(payload.tasks);
    }).catch(() => undefined);
    return () => window.clearInterval(timer);
  }, []);

  const districtSchedule = getDistrictAdmissionSchedule(district);
  const displayedDates: ImportantDate[] = districtSchedule.length ? districtSchedule : importantDates;
  const examDate = displayedDates.find((item) => item.title.includes("會考"));
  const countdownTarget = examDate ? new Date(`${examDate.eventDate}T08:00:00+08:00`) : targetDate;
  const remainingDays = Math.max(0, Math.ceil((countdownTarget.getTime() - now.getTime()) / 86_400_000));
  const districtInfo = district ? districtMetadata.districts[district] : null;
  const completed = scheduleTasks.filter(({ id }) => done[id]).length;
  const currentTask = scheduleTasks.find(({ id }) => !done[id]) || scheduleTasks[scheduleTasks.length - 1];
  const nextDate = displayedDates.filter((item) => new Date(`${item.eventDate}T23:59:59+08:00`).getTime() >= now.getTime()).sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0];
  const districtRows = useMemo(() => compare.map((code) => ({ code, info: districtMetadata.districts[code as keyof typeof districtMetadata.districts] })), [compare]);

  function toggleTask(id: string) {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    window.localStorage.setItem("jshs_schedule_tasks", JSON.stringify(next));
  }

  function addOpenDay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const school = newOpenDay.school.trim();
    if (!school || !newOpenDay.eventDate) {
      setStatus("請填寫學校名稱與開放日期。");
      return;
    }
    const next = [...openDays, { id: crypto.randomUUID(), school, eventDate: newOpenDay.eventDate, url: newOpenDay.url.trim(), notes: newOpenDay.notes.trim() }].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    setOpenDays(next);
    window.localStorage.setItem("jshs_schedule_open_days", JSON.stringify(next));
    setNewOpenDay({ school: "", eventDate: "", url: "", notes: "" });
    setStatus("已加入校園開放日，可在匯出頁一起下載。");
  }

  function removeOpenDay(id: string) {
    const next = openDays.filter((item) => item.id !== id);
    setOpenDays(next);
    window.localStorage.setItem("jshs_schedule_open_days", JSON.stringify(next));
    setStatus("已移除這筆校園開放日。");
  }

  function exportCalendar() {
    const events = [
      ...displayedDates.map(({ eventDate, title, description }) => calendarEvent(eventDate, title, description)),
      ...openDays.map(({ eventDate, school, notes, url }) => calendarEvent(eventDate, `${school} 校園開放日`, [notes, url].filter(Boolean).join("\n"))),
    ].join("\n");
    const blob = new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//JSHS//Admission Calendar//ZH\n${events}\nEND:VCALENDAR`], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "jshs-升學日程.ics"; anchor.click(); URL.revokeObjectURL(url);
    setStatus("已下載個人化行事曆，可匯入手機或 Google Calendar。日期仍請以官方公告更新。");
  }

  return <>
    <section className="jshs-hero-section"><div className="mx-auto w-[min(1160px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">{SERVICE_YEAR} 學年度 · 時間日程中心</p><h1 className="mt-3 max-w-4xl">把「還來得及嗎」變成下一個可完成的日期。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">未選就學區時先看共通節點；選定後，重要時程會帶入目前的 {getDistrictLabel(district)} 情境。{districtSchedule.length ? `目前顯示 ${SOURCE_ACADEMIC_YEAR} 學年度官方來源，${SERVICE_YEAR} 正式時程待公告。` : ""}</p></div></section>
    {view === "overview" || view === "countdown" ? <section id="countdown" className="mx-auto grid w-[min(1160px,calc(100%-32px))] gap-4 py-8 md:grid-cols-[1.2fr_.8fr]"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">全年倒數計時</p><div className="mt-2 flex flex-wrap items-end gap-4"><strong className="text-6xl text-[var(--jshs-primary)]">{remainingDays}</strong><span className="pb-2 text-lg">天後是國中教育會考<br /><small className="jshs-muted-copy">預定 {examDate?.eventDate || "2027-05-15"} · {countdownTarget.toLocaleDateString("zh-TW")}</small></span></div><p className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">倒數是時間管理參考，不代表正式報名或考試日期已完整公告。涉及權益的日期請以招生單位最新公告為準。</p></article></section> : null}
    {view === "overview" || view === "now" ? <section id="now" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">我現在該做什麼</p><h2 className="mt-2 text-2xl">{currentTask.title}</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">{currentTask.detail}</p><p className="mt-5 text-sm font-black text-[var(--jshs-primary)]">目前完成 {completed}／{scheduleTasks.length} 項</p>{nextDate ? <p className="mt-3 text-sm leading-6 jshs-muted-copy">下一個日期：{nextDate.eventDate} · {nextDate.title}</p> : null}</article></section> : null}
    {view === "overview" || view === "timeline" ? <section id="timeline" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">重要時程總覽</p><h2 className="mt-2">{districtInfo ? `${districtInfo.label} · ${districtInfo.academicYear} 學年度` : "全國共通節點"}</h2></div><span className="jshs-data-tag is-reference">{districtInfo?.dataStatus === "ready" ? "區域資料已校核" : "未選區，先看共通資料"}</span></div>{districtSchedule.length ? <p className="mt-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">本頁僅顯示{districtInfo?.label}簡章重要日程表；項目、日期、說明與來源頁碼均已逐欄核對，狀態：<strong className="text-[var(--jshs-success)]">已確認</strong>。</p> : null}<div className="mt-5 grid gap-3 md:grid-cols-3">{displayedDates.map((item) => <article key={item.id} className="p-5 jshs-surface-card"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-black text-[var(--jshs-primary)]">{item.eventDate}</span>{item.status ? <span className="jshs-chip">{item.status === "confirmed" ? "已確認" : "待核對"} · 頁 {item.sourcePages}</span> : <span className="jshs-chip">後台公告</span>}</div><h3 className="mt-2">{item.title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{item.description}</p></article>)}</div></section> : null}
    {view === "overview" || view === "tasks" ? <section id="tasks" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><div className="flex items-end justify-between gap-3"><div><p className="jshs-eyebrow">升學待辦清單</p><h2 className="mt-2">完成一件，再往下一件</h2></div><span className="text-sm jshs-muted-copy">保存在目前裝置 · 內容由後台管理</span></div><div className="mt-5 grid gap-3">{scheduleTasks.map(({ id, title, detail }) => <label key={id} className="flex cursor-pointer items-start gap-4 p-5 jshs-surface-card"><input type="checkbox" checked={Boolean(done[id])} onChange={() => toggleTask(id)} className="mt-1 h-5 w-5" /><span><strong className={done[id] ? "line-through opacity-60" : ""}>{title}</strong><span className="mt-1 block text-sm leading-6 jshs-muted-copy">{detail}</span></span></label>)}</div></section> : null}
    {view === "overview" || view === "compare" ? <section id="compare" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><p className="jshs-eyebrow">各就學區時程差異比較</p><h2 className="mt-2">把兩個地區放在一起看</h2><div className="mt-4 flex flex-wrap gap-2">{["ct", "tp", "ilan", "hsinchu-miaoli", "kaohsiung"].map((code) => <button key={code} type="button" onClick={() => setCompare((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code].slice(-2))} className={`px-3 py-2 text-sm jshs-button ${compare.includes(code) ? "jshs-button-primary" : "jshs-button-secondary"}`}>{districtMetadata.districts[code as keyof typeof districtMetadata.districts].label}</button>)}</div><div className="mt-5 grid gap-3 md:grid-cols-2">{districtRows.map(({ code, info }) => <article key={code} className="p-5 jshs-surface-card"><div className="flex items-center justify-between gap-3"><h3>{info.label}</h3><span className="jshs-chip">{info.academicYear} 學年度</span></div><p className="mt-3 text-sm leading-6 jshs-muted-copy">{info.tasks?.join("；") || "請以該區委員會公告為準"}</p><a className="mt-4 block text-sm text-[var(--jshs-primary)]" href={info.sourceUrl} target="_blank" rel="noreferrer">查看官方來源 ↗</a></article>)}</div></section> : null}
    {view === "overview" || view === "open-days" ? <section id="open-days" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><div className="grid gap-4 md:grid-cols-[.9fr_1.1fr]"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">校園開放日行事曆</p><h2 className="mt-2">把想參訪的學校先收進來</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">日期由你依學校官方公告輸入，會保存在目前裝置，也能在匯出頁與升學節點一起下載。</p><form className="mt-5 grid gap-3" onSubmit={addOpenDay}><label className="grid gap-1 text-sm font-black">學校名稱<input value={newOpenDay.school} onChange={(event) => setNewOpenDay((current) => ({ ...current, school: event.target.value }))} placeholder="例如：○○高工" required /></label><label className="grid gap-1 text-sm font-black">開放日期<input type="date" value={newOpenDay.eventDate} onChange={(event) => setNewOpenDay((current) => ({ ...current, eventDate: event.target.value }))} required /></label><label className="grid gap-1 text-sm font-black">官方公告網址<input type="url" value={newOpenDay.url} onChange={(event) => setNewOpenDay((current) => ({ ...current, url: event.target.value }))} placeholder="https://…" /></label><label className="grid gap-1 text-sm font-black">備註<textarea value={newOpenDay.notes} onChange={(event) => setNewOpenDay((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="集合時間、攜帶資料…" /></label><button type="submit" className="px-4 py-3 text-sm jshs-button-primary">新增開放日</button></form></article><article className="p-6 jshs-surface-card"><div className="flex items-center justify-between gap-3"><h2>我的開放日清單</h2><span className="jshs-chip">{openDays.length} 筆</span></div>{openDays.length ? <div className="mt-4 grid gap-3">{openDays.map((item) => <div key={item.id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><strong>{item.school}</strong><p className="mt-1 text-sm text-[var(--jshs-primary)]">{item.eventDate}</p></div><button type="button" onClick={() => removeOpenDay(item.id)} className="text-xs font-black text-[var(--jshs-danger)]">移除</button></div>{item.notes ? <p className="mt-2 text-sm leading-6 jshs-muted-copy">{item.notes}</p> : null}{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs text-[var(--jshs-primary)]">查看官方公告 ↗</a> : null}</div>)}</div> : <p className="mt-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">尚未加入資料，請以學校官方公告為準。</p>}</article></div></section> : null}
    {view === "overview" || view === "export" ? <section id="export" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">個人化行事曆匯出</p><h2 className="mt-2">帶走你的下一步</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">匯出 {displayedDates.length} 個升學節點與 {openDays.length} 個校園開放日；匯入後仍可自行修改。</p><button type="button" onClick={exportCalendar} className="mt-5 px-4 py-3 text-sm jshs-button-primary">下載 ICS 行事曆</button>{status ? <p className="mt-3 text-sm font-bold text-[var(--jshs-success)]" role="status">{status}</p> : null}</article></section> : null}
  </>;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    return parsed === null ? fallback : parsed as T;
  } catch { return fallback; }
}

function calendarEvent(date: string, summary: string, description: string) {
  return `BEGIN:VEVENT\nDTSTART;VALUE=DATE:${date.replaceAll("-", "")}\nSUMMARY:${escapeIcs(summary)}\nDESCRIPTION:${escapeIcs(description)}\nEND:VEVENT`;
}

function escapeIcs(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}
