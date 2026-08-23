"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { getDistrictLabel, readStoredDistrict, subscribeToDistrict, type DistrictCode } from "@/lib/district-context";

const targetDate = new Date("2027-05-15T08:00:00+08:00");
const tasks = [
  ["read-rules", "讀完適用就學區規則", "確認比序項目、志願數量與重要截止日。"],
  ["try-schools", "建立三層候選校科", "至少各放一個挑戰、適中與穩定選項。"],
  ["check-score", "完成一次成績試算", "留下年度、區域與待補欄位，避免混用規則。"],
  ["family-meeting", "完成一次家庭討論", "記下學生想要的學習內容與家庭需要確認的條件。"],
] as const;

export function ScheduleWorkspace() {
  const district = useSyncExternalStore(subscribeToDistrict, readStoredDistrict, () => "") as DistrictCode | "";
  const [now, setNow] = useState(() => new Date());
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(window.localStorage.getItem("jshs_schedule_tasks") || "{}") as Record<string, boolean>; } catch { return {}; }
  });
  const [compare, setCompare] = useState(["ct", "tp"]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingDays = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / 86_400_000));
  const districtInfo = district ? districtMetadata.districts[district] : null;
  const completed = tasks.filter(([id]) => done[id]).length;
  const currentTask = tasks.find(([id]) => !done[id]) || tasks[tasks.length - 1];
  const districtRows = useMemo(() => compare.map((code) => ({ code, info: districtMetadata.districts[code as keyof typeof districtMetadata.districts] })), [compare]);

  function toggleTask(id: string) {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    window.localStorage.setItem("jshs_schedule_tasks", JSON.stringify(next));
  }

  function exportCalendar() {
    const events = [
      ["20270515", "國中教育會考", "會考第一天，請以當年度准考證與官方公告為準"],
      ["20270601", "確認免試入學簡章", "核對志願選填、報名與放榜時程"],
      ["20270615", "家庭志願最終檢核", "確認區域、年度、志願順序與官方資料"],
    ].map(([date, title, description]) => `BEGIN:VEVENT\nDTSTART;VALUE=DATE:${date}\nSUMMARY:${title}\nDESCRIPTION:${description}\nEND:VEVENT`).join("\n");
    const blob = new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//JSHS//Admission Calendar//ZH\n${events}\nEND:VCALENDAR`], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "jshs-升學日程.ics"; anchor.click(); URL.revokeObjectURL(url);
    setStatus("已下載個人化行事曆，可匯入手機或 Google Calendar。日期仍請以官方公告更新。");
  }

  return <>
    <section className="jshs-hero-section"><div className="mx-auto w-[min(1160px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">時間日程中心</p><h1 className="mt-3 max-w-4xl">把「還來得及嗎」變成下一個可完成的日期。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">未選就學區時先看全國共通節點；選定後，重要時程會帶入目前的 {getDistrictLabel(district)} 情境。</p></div></section>
    <section id="countdown" className="mx-auto grid w-[min(1160px,calc(100%-32px))] gap-4 py-8 md:grid-cols-[1.2fr_.8fr]"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">全年倒數計時</p><div className="mt-2 flex flex-wrap items-end gap-4"><strong className="text-6xl text-[var(--jshs-primary)]">{remainingDays}</strong><span className="pb-2 text-lg">天後是 116 年國中教育會考<br /><small className="jshs-muted-copy">預定 2027 年 5 月 15 日 · {targetDate.toLocaleDateString("zh-TW")}</small></span></div><p className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">倒數是時間管理參考，不代表正式報名或考試日期已完整公告。涉及權益的日期請以招生單位最新公告為準。</p></article><article id="now" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">我現在該做什麼</p><h2 className="mt-2 text-2xl">{currentTask[1]}</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">{currentTask[2]}</p><p className="mt-5 text-sm font-black text-[var(--jshs-primary)]">目前完成 {completed}／{tasks.length} 項</p></article></section>
    <section id="timeline" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">重要時程總覽</p><h2 className="mt-2">{districtInfo ? `${districtInfo.label} · ${districtInfo.academicYear} 學年度` : "全國共通節點"}</h2></div><span className="jshs-data-tag is-reference">{districtInfo?.dataStatus === "ready" ? "區域資料已校核" : "未選區，先看共通資料"}</span></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[["2026/08", "理解規則與選擇方向", "閱讀入學規則、認識學制，開始建立問題清單。", "現在"], ["2027/05/15–16", "國中教育會考", "確認准考證、應試用品與交通安排。", "預定"], ["公告後", "志願選填與放榜", "依所在區域的簡章完成正式選填，不以本站試算代替送出。", "待公告"]].map(([date, title, detail, status]) => <article key={title} className="p-5 jshs-surface-card"><span className="text-sm font-black text-[var(--jshs-primary)]">{date}</span><h3 className="mt-2">{title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{detail}</p><span className="mt-4 jshs-chip">{status}</span></article>)}</div></section>
    <section id="tasks" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><div className="flex items-end justify-between gap-3"><div><p className="jshs-eyebrow">升學待辦清單</p><h2 className="mt-2">完成一件，再往下一件</h2></div><span className="text-sm jshs-muted-copy">保存在目前裝置</span></div><div className="mt-5 grid gap-3">{tasks.map(([id, title, detail]) => <label key={id} className="flex cursor-pointer items-start gap-4 p-5 jshs-surface-card"><input type="checkbox" checked={Boolean(done[id])} onChange={() => toggleTask(id)} className="mt-1 h-5 w-5" /><span><strong className={done[id] ? "line-through opacity-60" : ""}>{title}</strong><span className="mt-1 block text-sm leading-6 jshs-muted-copy">{detail}</span></span></label>)}</div></section>
    <section id="compare" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><p className="jshs-eyebrow">各就學區時程差異比較</p><h2 className="mt-2">把兩個地區放在一起看</h2><div className="mt-4 flex flex-wrap gap-2">{["ct", "tp", "ilan", "hsinchu-miaoli", "kaohsiung"].map((code) => <button key={code} type="button" onClick={() => setCompare((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code].slice(-2))} className={`px-3 py-2 text-sm jshs-button ${compare.includes(code) ? "jshs-button-primary" : "jshs-button-secondary"}`}>{districtMetadata.districts[code as keyof typeof districtMetadata.districts].label}</button>)}</div><div className="mt-5 grid gap-3 md:grid-cols-2">{districtRows.map(({ code, info }) => <article key={code} className="p-5 jshs-surface-card"><div className="flex items-center justify-between gap-3"><h3>{info.label}</h3><span className="jshs-chip">{info.academicYear} 學年度</span></div><p className="mt-3 text-sm leading-6 jshs-muted-copy">{info.tasks?.join("；") || "請以該區委員會公告為準"}</p><a className="mt-4 block text-sm text-[var(--jshs-primary)]" href={info.sourceUrl} target="_blank" rel="noreferrer">查看官方來源 ↗</a></article>)}</div></section>
    <section id="open-days" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><div className="grid gap-4 md:grid-cols-2"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">校園開放日行事曆</p><h2 className="mt-2">先收進規劃，再等學校公告</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">目前公開資料尚未統一提供全國開放日清單。找到感興趣的學校後，請從學校官方網站確認日期，並把網址與備註放進我的志願。</p><a href="/schools" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">開始查學校 →</a></article><article id="export" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">個人化行事曆匯出</p><h2 className="mt-2">帶走你的下一步</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">匯出共通節點與目前階段提醒；匯入後仍可自行修改。</p><button type="button" onClick={exportCalendar} className="mt-5 px-4 py-3 text-sm jshs-button-primary">下載 ICS 行事曆</button>{status ? <p className="mt-3 text-sm font-bold text-[var(--jshs-success)]" role="status">{status}</p> : null}</article></div></section>
  </>;
}
