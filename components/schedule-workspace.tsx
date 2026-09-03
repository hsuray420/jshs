"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { readStoredDistrict, subscribeToDistrict, type DistrictCode } from "@/lib/district-context";
import { getDistrictAdmissionSchedule, nationalAdmissionSchedule, type AdmissionScheduleStatus } from "@/lib/admission-schedules";
import { defaultProgress, PROGRESS_STORAGE_KEY, readProgress, type ProgressState } from "@/lib/progress";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR } from "@/lib/trust";
import scheduleTasksContent from "@/content/schedule/tasks.json";

export type ScheduleView = "overview" | "timeline" | "now" | "tasks" | "open-days";
type ImportantDate = { id: string; title: string; description: string; eventDate?: string; status?: AdmissionScheduleStatus; sourcePages?: "I" | "II" | "i" | "ii" | "iii"; sourceUrl?: string };
type OpenDay = { id: string; school: string; title: string; eventDate: string; eventTime: string; location: string; sourceUrl: string; notes: string; done: boolean };
type UserTask = { id: string; title: string; done: boolean };

const fallbackTasks = scheduleTasksContent;

const statusLabels: Record<AdmissionScheduleStatus, string> = {
  confirmed: "已公告",
  pending: "待公告",
  previous_year_reference: "上年度參考",
  provisional: "暫定，請再核對",
};

export function ScheduleWorkspace({ view = "overview" }: { view?: ScheduleView }) {
  const district = useSyncExternalStore(subscribeToDistrict, readStoredDistrict, () => "") as DistrictCode | "";
  const [now, setNow] = useState(() => new Date());
  const [progress, setProgress] = useState<ProgressState>(defaultProgress);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [scheduleTasks, setScheduleTasks] = useState(fallbackTasks);
  const [userTasks, setUserTasks] = useState<UserTask[]>(() => typeof window === "undefined" ? [] : readJson("jshs_user_tasks", []));
  const [openDays, setOpenDays] = useState<OpenDay[]>(() => typeof window === "undefined" ? [] : readJson("jshs_schedule_open_days", []));
  const [newTask, setNewTask] = useState("");
  const [newOpenDay, setNewOpenDay] = useState({ school: "", title: "", eventDate: "", eventTime: "", location: "", sourceUrl: "", notes: "" });
  const [compare, setCompare] = useState(["ct", "tp"]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    const syncProgress = () => setProgress(readProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)));
    syncProgress();
    window.addEventListener("storage", syncProgress);
    window.addEventListener("jshs-progress", syncProgress);
    fetch("/api/schedule", { headers: { accept: "application/json" } }).then(async (response) => {
      if (!response.ok) return null;
      return await response.json() as { dates?: ImportantDate[]; tasks?: typeof fallbackTasks };
    }).then((payload) => {
      if (payload?.dates?.length) setImportantDates(payload.dates.map((item) => ({ ...item, status: item.status || "pending" })));
      if (payload?.tasks?.length) setScheduleTasks(payload.tasks);
    }).catch(() => setMessage("官方時程暫時無法載入，請稍後重新整理。"));
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", syncProgress);
      window.removeEventListener("jshs-progress", syncProgress);
    };
  }, []);

  const districtSchedule = useMemo(() => getDistrictAdmissionSchedule(district).map((item) => ({ ...item, status: "previous_year_reference" as const })), [district]);
  const displayedDates = useMemo(() => [...nationalAdmissionSchedule, ...(districtSchedule.length ? districtSchedule : importantDates)], [districtSchedule, importantDates]);
  const districtInfo = district ? districtMetadata.districts[district] : null;
  const nextDate = displayedDates.filter((item) => item.eventDate && new Date(item.eventDate + "T23:59:59+08:00").getTime() >= now.getTime()).sort((a, b) => (a.eventDate || "").localeCompare(b.eventDate || ""))[0];
  const confirmedExam = displayedDates.find((item) => item.status === "confirmed" && item.title.includes("會考") && item.eventDate);
  const remainingDays = confirmedExam?.eventDate ? Math.max(0, Math.ceil((new Date(confirmedExam.eventDate + "T08:00:00+08:00").getTime() - now.getTime()) / 86_400_000)) : null;
  const districtRows = useMemo(() => compare.map((code) => ({ code, info: districtMetadata.districts[code as keyof typeof districtMetadata.districts] })), [compare]);
  const systemTasks = scheduleTasks.map((task) => ({ ...task, done: task.id === "read-rules" ? Boolean(district && hasStoredValue("jshs_rule_intro_seen:" + district, "1")) : task.id === "check-score" ? hasStoredValue("jshs_score_latest") : task.id === "try-schools" ? progress.schoolSearch : task.id === "make-planner" ? progress.planner : false }));

  function toggleUserTask(id: string) {
    const next = userTasks.map((task) => task.id === id ? { ...task, done: !task.done } : task);
    setUserTasks(next);
    window.localStorage.setItem("jshs_user_tasks", JSON.stringify(next));
  }

  function addUserTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim().slice(0, 120);
    if (!title) return;
    const next = [...userTasks, { id: crypto.randomUUID(), title, done: false }];
    setUserTasks(next);
    window.localStorage.setItem("jshs_user_tasks", JSON.stringify(next));
    setNewTask("");
  }

  function editUserTask(id: string, title: string) {
    const next = userTasks.map((task) => task.id === id ? { ...task, title } : task);
    setUserTasks(next);
    window.localStorage.setItem("jshs_user_tasks", JSON.stringify(next));
  }

  function removeUserTask(id: string) {
    const next = userTasks.filter((task) => task.id !== id);
    setUserTasks(next);
    window.localStorage.setItem("jshs_user_tasks", JSON.stringify(next));
  }

  function addOpenDay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const school = newOpenDay.school.trim();
    if (!school || !newOpenDay.eventDate) {
      setMessage("請填寫學校名稱與開放日期。");
      return;
    }
    const next = [...openDays, { id: crypto.randomUUID(), school, title: newOpenDay.title.trim() || "校園開放日", eventDate: newOpenDay.eventDate, eventTime: newOpenDay.eventTime.trim(), location: newOpenDay.location.trim(), sourceUrl: newOpenDay.sourceUrl.trim(), notes: newOpenDay.notes.trim(), done: false }].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    setOpenDays(next);
    window.localStorage.setItem("jshs_schedule_open_days", JSON.stringify(next));
    setNewOpenDay({ school: "", title: "", eventDate: "", eventTime: "", location: "", sourceUrl: "", notes: "" });
    setMessage("已加入個人校園開放日紀錄。來源與日期請自行持續核對。 ");
  }

  function removeOpenDay(id: string) {
    const next = openDays.filter((item) => item.id !== id);
    setOpenDays(next);
    window.localStorage.setItem("jshs_schedule_open_days", JSON.stringify(next));
    setMessage("已移除這筆校園開放日。");
  }

  function updateOpenDay(id: string, patch: Partial<OpenDay>) {
    const next = openDays.map((item) => item.id === id ? { ...item, ...patch } : item).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    setOpenDays(next);
    window.localStorage.setItem("jshs_schedule_open_days", JSON.stringify(next));
  }

  function exportCalendar(selectedDates = displayedDates) {
    const events = [...selectedDates.filter((item) => item.eventDate).map((item) => calendarEvent(item.eventDate || "", item.title, item.description)), ...openDays.map((item) => calendarEvent(item.eventDate, `${item.school} ${item.title}`, [item.eventTime, item.location, item.notes, item.sourceUrl].filter(Boolean).join("\n")))].join("\n");
    const content = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//JSHS//Admission Calendar//ZH\n" + events + "\nEND:VCALENDAR";
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jshs-" + SERVICE_YEAR + "-升學日程.ics";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("已下載 ICS；官方日期更新後，先前匯出的檔案不會自動同步。");
  }

  return <>
    <section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">{SERVICE_YEAR} 學年度 · 升學日程</p><h1 className="mt-3 max-w-4xl">把現在要做的事，放在看得懂的時間線上。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">這裡是個人化工具；日期的正式效力仍以官方招生單位公告為準。{districtInfo ? "目前情境：" + districtInfo.label + "。" : "先選定就學區後，會帶入相應資料。"}</p></div></section>
    {view === "overview" ? <Overview district={district} districtInfo={districtInfo} nextDate={nextDate} remainingDays={remainingDays} systemTasks={systemTasks} progress={progress} /> : null}
    {view === "timeline" ? <Timeline displayedDates={displayedDates} districtInfo={districtInfo} compare={compare} districtRows={districtRows} onToggleCompare={(code) => setCompare((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code].slice(-3))} onExport={(item) => exportCalendar(item ? [item] : displayedDates)} openDays={openDays.length} /> : null}
    {view === "now" ? <Now progress={progress} district={district} systemTasks={systemTasks} nextDate={nextDate} /> : null}
    {view === "tasks" ? <Tasks systemTasks={systemTasks} userTasks={userTasks} newTask={newTask} onNewTask={setNewTask} onAddTask={addUserTask} onToggleUserTask={toggleUserTask} onEdit={editUserTask} onRemove={removeUserTask} /> : null}
    {view === "open-days" ? <OpenDays now={now} openDays={openDays} newOpenDay={newOpenDay} onNewOpenDay={setNewOpenDay} onAdd={addOpenDay} onRemove={removeOpenDay} onUpdate={updateOpenDay} message={message} /> : null}
    {view === "timeline" ? <p className="mx-auto w-[min(1120px,calc(100%-32px))] pb-10 text-sm leading-6 text-amber-900" role="status">行事曆匯出完成後，若官方日期更新，原本匯出的 ICS 不會自動更新。</p> : null}
    {message && view !== "open-days" ? <p className="mx-auto w-[min(1120px,calc(100%-32px))] pb-8 text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}
  </>;
}

function Overview({ district, districtInfo, nextDate, remainingDays, systemTasks, progress }: { district: string; districtInfo: { label: string } | null; nextDate?: ImportantDate; remainingDays: number | null; systemTasks: readonly (typeof fallbackTasks[number] & { done: boolean })[]; progress: ProgressState }) {
  const completed = systemTasks.filter((task) => task.done).length;
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] space-y-5 py-8"><div className="grid gap-4 md:grid-cols-3"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">服務年度</p><h2 className="mt-2 text-3xl">{SERVICE_YEAR} 學年度</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">{districtInfo ? districtInfo.label : "尚未設定就學區"}</p></article><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">會考倒數</p><h2 className="mt-2 text-3xl">{remainingDays === null ? "待公告" : remainingDays + " 天"}</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">{remainingDays === null ? "116 學年度正式日期尚未由本站確認。" : "僅作個人時間管理參考。"}</p></article><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">下一個重要日期</p><h2 className="mt-2 text-xl">{nextDate?.title || "目前沒有已載入日期"}</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">{nextDate?.eventDate || "請到重要時程查看待公告狀態。"}</p></article></div><div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">目前階段</p><h2 className="mt-2 text-2xl">{district ? "先完成規則、試算與校科探索" : "先設定就學區"}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">{district ? "下一步會依你的進度，從規則、成績、校科與志願中挑選。" : "設定後，算成績與日程會使用相同的就學區情境。"}</p><Link href={district ? "/schedule/now" : "/schools"} className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">{district ? "查看現在該做什麼 →" : "到找學校設定 →"}</Link></article><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">完成進度</p><h2 className="mt-2 text-2xl">{completed} / {systemTasks.length}</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">{progress.calculator ? "已完成最近一次試算。" : "完成的功能會自動同步到系統待辦。"}</p><Link href="/schedule/tasks" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-secondary">查看我的待辦 →</Link></article></div><div className="p-6 jshs-surface-card"><p className="jshs-eyebrow">近期系統待辦</p><div className="mt-4 grid gap-2 md:grid-cols-2">{systemTasks.slice(0, 4).map((task) => <Link key={task.id} href={task.done ? "/schedule/tasks" : task.id === "check-score" ? "/tools" : task.id === "try-schools" ? "/schools" : task.id === "make-planner" ? "/planner" : "/tools/rules"} className="rounded-xl bg-[var(--jshs-muted-surface)] p-4"><strong>{task.done ? "✓ " : ""}{task.title}</strong><span className="mt-1 block text-sm leading-6 jshs-muted-copy">{task.detail}</span></Link>)}</div></div></section>;
}

function Timeline({ displayedDates, districtInfo, compare, districtRows, onToggleCompare, onExport, openDays }: { displayedDates: readonly ImportantDate[]; districtInfo: { label: string; academicYear: string; sourceUrl: string } | null; compare: readonly string[]; districtRows: readonly { code: string; info: (typeof districtMetadata.districts)[keyof typeof districtMetadata.districts] }[]; onToggleCompare: (code: string) => void; onExport: (item?: ImportantDate) => void; openDays: number }) {
  const comparisonOptions = ["ct", "tp", "ilan", "hsinchu-miaoli", "kaohsiung"];
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">升學日程 · 重要時程</p><h2 className="mt-2">{districtInfo ? districtInfo.label : "全國共通節點"}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">來源年度 {SOURCE_ACADEMIC_YEAR} 的日期會標示為上年度參考；116 正式日期待公告時不會顯示成已確認。</p></div><button type="button" onClick={() => onExport()} className="min-h-11 px-4 py-3 text-sm jshs-button-primary">加入行事曆（ICS）</button></div><div className="mt-6 grid gap-3">{displayedDates.length ? displayedDates.map((item) => { const action = getEventAction(item); const sourceUrl = item.sourceUrl || (item.status === "previous_year_reference" ? districtInfo?.sourceUrl : undefined); return <details key={item.id} className="p-5 jshs-surface-card"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-black text-[var(--jshs-primary)]">{item.eventDate || "日期待公告"}</span><span className="jshs-chip">{item.status ? statusLabels[item.status] : "待公告"}</span><h3 className="text-lg">{item.title}</h3></div></summary><div className="mt-4 border-t border-[var(--jshs-border)] pt-4 text-sm leading-7"><p className="jshs-muted-copy">{item.description}</p><dl className="mt-4 grid gap-3 rounded-xl bg-[var(--jshs-muted-surface)] p-4"><div><dt className="font-black text-slate-700">現在要做什麼</dt><dd className="jshs-muted-copy">{action.detail}</dd></div><div><dt className="font-black text-slate-700">官方來源</dt><dd>{sourceUrl ? <a className="font-bold text-[var(--jshs-primary)]" href={sourceUrl} target="_blank" rel="noreferrer">開啟官方來源 ↗</a> : <span className="jshs-muted-copy">目前沒有可回查的官方連結。</span>}{item.sourcePages ? <span className="ml-2 text-slate-500">來源頁碼：{item.sourcePages}</span> : null}</dd></div></dl><div className="mt-4 flex flex-wrap gap-3"><Link href={action.href} className="inline-flex min-h-11 items-center px-3 py-2 text-sm jshs-button-secondary">{action.label} →</Link>{item.eventDate ? <button type="button" onClick={() => onExport(item)} className="min-h-11 px-3 py-2 text-sm jshs-button-secondary">加入這個日期</button> : null}</div></div></details>; }) : <div className="p-6 jshs-surface-card"><h3 className="text-lg">116 正式時程待公告</h3><p className="mt-2 text-sm leading-7 jshs-muted-copy">目前沒有可標示為 116 已公告的日期；請到官方資訊查看各區原始來源。</p></div>}</div><section className="mt-8 p-6 jshs-surface-card"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">就學區時程比較</p><h2 className="mt-2">加入另一區比較（最多 3 區）</h2></div><span className="text-sm jshs-muted-copy">{compare.length} / 3</span></div><div className="mt-4 flex flex-wrap gap-2">{comparisonOptions.map((code) => <button key={code} type="button" onClick={() => onToggleCompare(code)} className={"min-h-11 px-3 py-2 text-sm jshs-button " + (compare.includes(code) ? "jshs-button-primary" : "jshs-button-secondary")}>{districtMetadata.districts[code as keyof typeof districtMetadata.districts].label}</button>)}</div><div className="mt-5 grid gap-3 md:grid-cols-3">{districtRows.map(({ code, info }) => <article key={code} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><h3>{info.label}</h3><span className="mt-1 block text-xs text-slate-500">{info.academicYear} 學年度 · {info.dataStatus === "ready" ? "已整理" : "參考"}</span><p className="mt-3 text-sm leading-6 jshs-muted-copy">{info.tasks?.[0] || "請以該區官方公告為準"}</p><a className="mt-3 block text-sm font-black text-[var(--jshs-primary)]" href={info.sourceUrl} target="_blank" rel="noreferrer">查看官方來源 ↗</a></article>)}</div></section><p className="mt-4 text-sm leading-6 text-slate-600">我的校園開放日：{openDays} 筆；如需加入，請從找學校 → 校園開放日管理。</p></section>;
}

function getEventAction(item: ImportantDate) {
  if (item.title.includes("會考")) return { detail: "查看會考相關官方公告，確認報名、應試與後續日期。", href: "/admission-guides/schedule", label: "查看官方招生時程" };
  if (item.title.includes("志願") || item.title.includes("選填")) return { detail: "確認選填期間與資格資料，開放後前往正式官方平台操作。", href: "/planner/official-platform", label: "前往官方選填平台" };
  if (item.title.includes("簡章") || item.title.includes("報名")) return { detail: "閱讀適用區域的正式簡章，整理報名需要的資料。", href: "/admission-guides", label: "查看官方簡章與規則" };
  return { detail: "回查官方公告，依事件說明確認自己是否需要準備或完成下一項手續。", href: "/admission-guides/schedule", label: "查看官方招生時程" };
}

function Now({ progress, district, systemTasks, nextDate }: { progress: ProgressState; district: string; systemTasks: readonly (typeof fallbackTasks[number] & { done: boolean })[]; nextDate?: ImportantDate }) {
  const next = !district ? { title: "設定我的就學區", detail: "先到找學校選擇就學區，後續規則、學校與日程會使用同一情境。", href: "/schools" } : !progress.calculator ? { title: "完成第一次積分試算", detail: "目前 15 / 15 區皆可使用 115 規則參考試算；116 正式規則待公告。", href: "/tools" } : !progress.schoolSearch ? { title: "收藏有興趣的校科", detail: "比較學制、群科、通勤與歷年錄取參考。", href: "/schools" } : !progress.planner ? { title: "建立我的志願清單", detail: "可以自己排，也可以看系統推薦；兩邊共用同一份資料。", href: "/planner" } : { title: "完成志願健檢", detail: "查看志願分布、資格、資料完整度、通勤與規則提示。", href: "/planner/custom?panel=health-check" };
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><div className="grid gap-5 md:grid-cols-[1.1fr_.9fr]"><article className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">現在該做什麼</p><h2 className="mt-3 text-3xl">{next.title}</h2><p className="mt-4 text-sm leading-7 jshs-muted-copy">{next.detail}</p><Link href={next.href} className="mt-6 inline-flex px-5 py-3 text-sm jshs-button-primary">直接前往 →</Link></article><aside className="p-6 jshs-surface-card"><p className="jshs-eyebrow">同步依據</p><ul className="mt-4 grid gap-3 text-sm">{[["就學區", district ? "已設定" : "尚未設定"], ["積分試算", progress.calculator ? "已完成" : "尚未完成"], ["校科探索", progress.schoolSearch ? "已開始" : "尚未開始"], ["志願清單", progress.planner ? "已建立" : "尚未建立"]].map(([label, value]) => <li key={label} className="flex justify-between gap-3 border-b border-[var(--jshs-border)] pb-3"><span className="jshs-muted-copy">{label}</span><strong>{value}</strong></li>)}</ul>{nextDate ? <p className="mt-5 text-sm leading-6 jshs-muted-copy">最近日期：{nextDate.eventDate || "待公告"} · {nextDate.title}</p> : null}</aside></div><div className="mt-6 grid gap-3 md:grid-cols-2">{systemTasks.map((task) => <Link key={task.id} href={task.done ? "/schedule/tasks" : task.id === "check-score" ? "/tools" : task.id === "try-schools" ? "/schools" : task.id === "make-planner" ? "/planner" : "/tools/rules"} className="p-5 jshs-surface-card"><strong>{task.done ? "✓ " : ""}{task.title}</strong><p className="mt-2 text-sm leading-6 jshs-muted-copy">{task.detail}</p></Link>)}</div></section>;
}

function Tasks({ systemTasks, userTasks, newTask, onNewTask, onAddTask, onToggleUserTask, onEdit, onRemove }: { systemTasks: readonly (typeof fallbackTasks[number] & { done: boolean })[]; userTasks: readonly UserTask[]; newTask: string; onNewTask: (value: string) => void; onAddTask: (event: FormEvent<HTMLFormElement>) => void; onToggleUserTask: (id: string) => void; onEdit: (id: string, title: string) => void; onRemove: (id: string) => void }) {
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState("");
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><div className="grid gap-5 lg:grid-cols-2"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">系統建議待辦</p><h2 className="mt-2 text-2xl">系統建議待辦</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">由網站完成進度自動同步，不能當作自訂任務刪除。</p><div className="mt-5 grid gap-3">{systemTasks.map((task) => <Link key={task.id} href={task.done ? "/schedule/tasks" : task.id === "check-score" ? "/tools" : task.id === "try-schools" ? "/schools" : task.id === "make-planner" ? "/planner" : "/tools/rules"} className="flex items-start gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><span className="mt-0.5">{task.done ? "✓" : "○"}</span><span><strong>{task.title}</strong><span className="mt-1 block text-sm leading-6 jshs-muted-copy">{task.detail}</span></span></Link>)}</div></article><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">我的待辦</p><h2 className="mt-2 text-2xl">我的待辦</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">此待辦目前儲存在這台裝置。重新整理與返回頁面後會保留。</p><form className="mt-5 flex gap-2" onSubmit={onAddTask}><label className="sr-only" htmlFor="new-user-task">新增待辦</label><input id="new-user-task" value={newTask} onChange={(event) => onNewTask(event.target.value)} maxLength={120} className="min-w-0 flex-1" aria-label="新增自訂待辦" /><button type="submit" className="min-h-11 px-4 py-3 text-sm jshs-button-primary">新增</button></form><div className="mt-4 grid gap-2">{userTasks.map((task) => <article key={task.id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-start gap-3"><input aria-label={`完成 ${task.title}`} type="checkbox" checked={task.done} onChange={() => onToggleUserTask(task.id)} className="mt-1 h-5 w-5" />{editing === task.id ? <input aria-label="編輯待辦" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={120} className="min-w-0 flex-1" /> : <span className={`min-w-0 flex-1 ${task.done ? "line-through opacity-60" : ""}`}>{task.title}</span>}<div className="flex gap-2 text-sm"><button type="button" onClick={() => editing === task.id ? (onEdit(task.id, draft.trim().slice(0, 120) || task.title), setEditing("")) : (setEditing(task.id), setDraft(task.title))} className="font-black text-[var(--jshs-primary)]">{editing === task.id ? "儲存" : "編輯"}</button><button type="button" onClick={() => setDeleting(task.id)} className="font-black text-[var(--jshs-danger)]">刪除</button></div></div>{deleting === task.id ? <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><span>確認刪除這筆待辦？</span><button type="button" onClick={() => onRemove(task.id)} className="font-black text-[var(--jshs-danger)]">確認刪除</button><button type="button" onClick={() => setDeleting("")}>取消</button></div> : null}</article>)}{!userTasks.length ? <p className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">目前沒有自訂待辦。</p> : null}</div></article></div></section>;
}

function OpenDays({ now, openDays, newOpenDay, onNewOpenDay, onAdd, onRemove, onUpdate, message }: { now: Date; openDays: readonly OpenDay[]; newOpenDay: Omit<OpenDay, "id" | "done">; onNewOpenDay: (value: Omit<OpenDay, "id" | "done">) => void; onAdd: (event: FormEvent<HTMLFormElement>) => void; onRemove: (id: string) => void; onUpdate: (id: string, patch: Partial<OpenDay>) => void; message: string }) {
  const [editing, setEditing] = useState("");
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">找學校 · 個人規劃</p><h2 className="mt-2 text-2xl">校園開放日紀錄</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">這不是官方活動資料庫；每一筆都是使用者提供的個人紀錄，請自行依學校官方公告核對活動來源。</p><form className="mt-5 grid gap-3" onSubmit={onAdd}>{([['school','學校名稱','text'],['title','活動名稱','text'],['eventDate','日期','date'],['eventTime','時間','time'],['location','地點','text'],['sourceUrl','來源網址','url'],['notes','備註','text']] as const).map(([key,label,type]) => <label key={key} className="grid gap-1 text-sm font-black">{label}<input type={type} value={newOpenDay[key]} onChange={(event) => onNewOpenDay({ ...newOpenDay, [key]: event.target.value })} required={key === "school" || key === "eventDate"} /></label>)}<button type="submit" className="min-h-11 px-4 py-3 text-sm jshs-button-primary">新增開放日個人紀錄</button></form></article><article className="p-6 jshs-surface-card"><div className="flex items-center justify-between gap-3"><h2 className="text-2xl">我的開放日</h2><span className="jshs-chip">{openDays.length} 筆</span></div><div className="mt-5 grid gap-3">{openDays.map((item) => <article key={item.id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><strong>{item.school} · {item.title}</strong><span className="mt-1 block text-sm text-[var(--jshs-primary)]">{item.eventDate}{item.eventTime ? ` ${item.eventTime}` : ""} · {item.done ? "已完成" : new Date(`${item.eventDate}T23:59:59`).getTime() < now.getTime() ? "已過期" : "待參加"}</span></div><div className="flex gap-2"><button type="button" onClick={() => setEditing(editing === item.id ? "" : item.id)} className="text-sm font-black text-[var(--jshs-primary)]">編輯</button><button type="button" onClick={() => onRemove(item.id)} className="text-sm font-black text-[var(--jshs-danger)]">刪除</button></div></div>{editing === item.id ? <div className="mt-3 grid gap-2">{([['school','學校名稱'],['title','活動名稱'],['eventTime','時間'],['location','地點'],['sourceUrl','來源網址'],['notes','備註']] as const).map(([key,label]) => <label key={key} className="grid gap-1 text-sm">{label}<input defaultValue={item[key]} onBlur={(event) => onUpdate(item.id, { [key]: event.target.value })} /></label>)}</div> : <><p className="mt-2 text-sm leading-6 jshs-muted-copy">{[item.location, item.notes].filter(Boolean).join(" · ") || "個人紀錄"}</p>{item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-black text-[var(--jshs-primary)]">查看來源 ↗</a> : <span className="mt-2 inline-block text-sm text-slate-500">個人紀錄</span>}<button type="button" onClick={() => onUpdate(item.id, { done: !item.done })} className="ml-4 text-sm font-black text-[var(--jshs-primary)]">{item.done ? "取消完成" : "完成"}</button></>}</article>)}{!openDays.length ? <p className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">目前沒有已加入的活動。</p> : null}</div>{message ? <p className="mt-4 text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}</article></div></section>;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    return parsed === null ? fallback : parsed as T;
  } catch {
    return fallback;
  }
}

function hasStoredValue(key: string, expected?: string) {
  if (typeof window === "undefined") return false;
  const value = window.localStorage.getItem(key);
  return expected === undefined ? Boolean(value) : value === expected;
}

function calendarEvent(date: string, summary: string, description: string) {
  return "BEGIN:VEVENT\nDTSTART;VALUE=DATE:" + date.replaceAll("-", "") + "\nSUMMARY:" + escapeIcs(summary) + "\nDESCRIPTION:" + escapeIcs(description) + "\nEND:VEVENT";
}

function escapeIcs(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}
