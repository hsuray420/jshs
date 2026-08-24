"use client";

import { useState } from "react";
import type { MemberSession } from "@/lib/member-auth";

export function AccountCenter({ member }: { member: MemberSession | null }) {
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [status, setStatus] = useState("");

  function exportData() {
    const data = Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith("jshs")).map((key) => [key, localStorage.getItem(key)]));
    const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "jshs-我的資料.json"; link.click(); URL.revokeObjectURL(url); setStatus("已匯出目前裝置上的 JSHS 資料。");
  }

  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="grid gap-4 md:grid-cols-2"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">LINE 會員</p><h2 className="mt-2">{member ? `嗨，${member.displayName}` : "使用 LINE 註冊／登入"}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">查學校、時間日程、資格檢測與知識中心可以直接使用。{member ? "你已完成 LINE 會員註冊，LINE 身分只在後端保存。" : "登入後可將會員資料與未來的跨裝置功能連結。"}</p>{member ? <><p className="mt-5 text-sm font-black text-[var(--jshs-success)]">LINE 會員已登入</p><form action="/api/line/logout" method="post"><button type="submit" className="mt-4 px-4 py-3 text-sm jshs-button-secondary">登出</button></form></> : <a href="/api/line/login/start" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">使用 LINE 註冊／登入</a>}{status ? <p className="mt-3 text-sm text-[var(--jshs-success)]" role="status">{status}</p> : null}</article><article id="teacher" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">工作模式</p><h2 className="mt-2">切換你的使用情境</h2><div className="mt-4 flex gap-2">{[["student", "學生／家庭"], ["teacher", "老師／輔導室"]].map(([value, label]) => <button key={value} type="button" onClick={() => setMode(value as typeof mode)} className={`px-3 py-2 text-sm jshs-button ${mode === value ? "jshs-button-primary" : "jshs-button-secondary"}`}>{label}</button>)}</div><p className="mt-4 text-sm leading-7 jshs-muted-copy">{mode === "teacher" ? "批次模式規劃中；目前可用搜尋、資料來源與待辦頁面協助班級討論。" : "以自己的學校、成績與志願規劃為主。"}</p></article><article id="data" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">匯入／匯出資料</p><h2 className="mt-2">掌握自己的資料</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">匯出只包含目前瀏覽器中以 JSHS 開頭保存的偏好與進度，不包含密碼或第三方帳號資料。</p><button type="button" onClick={exportData} className="mt-5 px-4 py-3 text-sm jshs-button-secondary">匯出目前資料</button></article><article id="siblings" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">手足資料切換</p><h2 className="mt-2">每位學生各自一份規劃</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">目前本機模式會以同一瀏覽器保存單一規劃；多人帳號與手足切換會在登入同步功能開放後提供。</p><span className="mt-5 inline-flex jshs-chip">目前：單一學生模式</span></article></div></section>;
}
