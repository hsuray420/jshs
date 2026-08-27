"use client";

import { useEffect, useState } from "react";
import { NotificationCenter } from "@/components/notification-center";

type Feature = "push" | "line" | "email" | "calendar";
type DateItem = { id: string; title: string; description: string; eventDate: string };

export function NotificationFeatureWorkspace({ feature, isMember }: { feature: Feature; isMember: boolean }) {
  const [officialLineUrl, setOfficialLineUrl] = useState("");
  const [dates, setDates] = useState<DateItem[]>([]);
  useEffect(() => {
    if (feature === "line") fetch("/api/site-config").then((response) => response.json() as Promise<{ official_line_url?: string }>).then((payload) => setOfficialLineUrl(payload.official_line_url || "")).catch(() => undefined);
    if (feature === "calendar") fetch("/api/schedule").then((response) => response.json() as Promise<{ dates?: DateItem[] }>).then((payload) => setDates(payload.dates || [])).catch(() => undefined);
  }, [feature]);
  if (feature === "calendar") return <section className="mx-auto w-[min(1160px,calc(100%-32px))] pb-12"><div className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">重要日期訂閱</p><h2 className="mt-2">選擇要追蹤的升學日期</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">日期由後台維護；涉及報名權益時請再次核對官方公告。</p><div className="mt-6 grid gap-3">{dates.length ? dates.map((item) => <article key={item.id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><strong className="block">{item.title}</strong><span className="mt-1 block text-sm font-bold text-[var(--jshs-primary)]">{item.eventDate}</span><p className="mt-2 text-sm leading-6 jshs-muted-copy">{item.description}</p></article>) : <p className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">目前無法讀取日期，請稍後再試。</p>}</div><div className="mt-6 flex flex-wrap gap-3"><a href="/schedule/open-days" className="px-4 py-3 text-sm jshs-button-secondary">管理我的開放日</a><a href="/schedule/export" className="px-4 py-3 text-sm jshs-button-primary">匯出行事曆</a></div></div><NotificationCenter isMember={isMember} focus={["important_date_enabled"]} title="開通重要日期 LINE 提醒" intro="開通後，後台發布的日期提醒會透過 LINE 發送。" /></section>;
  if (feature === "line") return <><NotificationCenter isMember={isMember} title="連結 LINE 並管理通知" intro="先加入官方 LINE 好友，再使用 LINE 登入；完成後可在這裡開通通知分類。" />{officialLineUrl ? <section className="mx-auto w-[min(1160px,calc(100%-32px))] pb-12"><a className="inline-flex px-4 py-3 text-sm jshs-button-secondary" href={officialLineUrl} target="_blank" rel="noreferrer">加入官方 LINE 好友 ↗</a></section> : null}</>;
  if (feature === "email") return <NotificationCenter isMember={isMember} focus={["weekly_report_enabled"]} title="管理 LINE 週報訂閱" intro="Email 週報已改為 LINE 每週摘要；會員可隨時開啟或關閉。" />;
  return <NotificationCenter isMember={isMember} focus={["score_calculated_enabled", "planner_finalized_enabled", "important_date_enabled"]} title="管理手機 LINE 推播" intro="重要結果與規劃狀態會透過 LINE 官方帳號提醒你。" />;
}
