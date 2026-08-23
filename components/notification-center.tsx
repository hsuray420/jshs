"use client";

import { useState } from "react";

const settings = [["push", "分數到手機推播", "重要試算完成、資料狀態與提醒"], ["line", "LINE 官方帳號整合", "把重要通知送到已連結的 LINE"], ["email", "Email 週報", "每週整理升學進度與待辦"], ["calendar", "重要日期訂閱設定", "目前地區的時程與公告提醒"]] as const;

export function NotificationCenter() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ push: true, calendar: true });
  const [status, setStatus] = useState("");
  function toggle(key: string) { setEnabled((current) => ({ ...current, [key]: !current[key] })); setStatus("設定已保存在目前裝置；需要帳號或第三方授權的通知，啟用後仍會要求確認。"); }
  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="p-6 md:p-8 jshs-surface-card"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">通知與提醒</p><h2 className="mt-2">只收到對你有用的提醒</h2></div><span className="jshs-chip">目前裝置設定</span></div><div className="mt-6 grid gap-3">{settings.map(([id, title, detail]) => <label id={id} key={id} className="flex cursor-pointer items-center gap-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><input type="checkbox" checked={Boolean(enabled[id])} onChange={() => toggle(id)} className="h-5 w-5" /><span className="min-w-0"><strong className="block">{title}</strong><span className="mt-1 block text-sm leading-6 jshs-muted-copy">{detail}</span></span><span className="ml-auto text-xs font-black text-[var(--jshs-primary)]">{enabled[id] ? "已開啟" : "未開啟"}</span></label>)}</div>{status ? <p className="mt-5 text-sm font-bold text-[var(--jshs-success)]" role="status">{status}</p> : null}</div></section>;
}
