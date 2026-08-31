"use client";

import { useEffect, useState } from "react";
import type { MemberSession } from "@/lib/member-auth";

export function AccountCenter({ member, error, registered = false }: { member: MemberSession | null; error?: string; registered?: boolean }) {
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [status, setStatus] = useState("");
  const [officialLineUrl, setOfficialLineUrl] = useState("");

  useEffect(() => {
    fetch("/api/site-config", { headers: { accept: "application/json" } }).then(async (response) => response.ok ? await response.json() as { official_line_url?: string } : null).then((config) => { if (config?.official_line_url) setOfficialLineUrl(config.official_line_url); }).catch(() => undefined);
  }, []);

  function exportData() {
    const data = Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith("jshs")).map((key) => [key, localStorage.getItem(key)]));
    const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "jshs-我的資料.json"; link.click(); URL.revokeObjectURL(url); setStatus("已匯出目前裝置上的 JSHS 資料。");
  }

  const friendRequired = error === "line_friend_required";
  const friendSetup = error === "line_friend_check_setup";
  const friendLink = officialLineUrl || "/api/line/login/start";
  const accountError = { line_callback: ["登入取消", "你已取消登入或 LINE 沒有回傳完整資料；可繼續使用本機工具，稍後再試。"], line_state: ["登入逾時", "這次登入工作階段已失效，請重新開始登入。"], line_failed: ["服務暫時失敗", "LINE 登入服務暫時無法完成，請稍後再試。"], line_friend_check_setup: ["服務尚未設定", "會員好友驗證尚未設定完成；本機工具仍可正常使用。"], session_expired: ["登入工作階段已失效", "請重新登入；未登入時仍可使用保存在此裝置的工具。"] }[error || ""];
  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="grid gap-4 md:grid-cols-2"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">LINE 會員</p><h2 className="mt-2">{member ? `嗨，${member.displayName}` : "使用 LINE 註冊／登入"}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">登入後可同步你的規劃進度與試算紀錄；未登入時仍可使用本機工具。</p>{accountError ? <p role="alert" className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong className="block">{accountError[0]}</strong>{accountError[1]}</p> : null}{friendRequired ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="alert"><strong className="block">請先加入官方 LINE 好友</strong><a href={friendLink} target={officialLineUrl ? "_blank" : undefined} rel={officialLineUrl ? "noreferrer" : undefined} className="mt-4 inline-flex px-4 py-3 font-black jshs-button-primary">加入官方 LINE 好友</a><a href="/api/line/login/start" className="mt-3 block font-black text-[var(--jshs-primary)] underline">重新確認好友資格</a></div> : null}{registered ? <p className="mt-5 text-sm font-bold text-emerald-800" role="status">LINE 會員已完成登入，好友資格已確認。</p> : null}{member ? <form action="/api/line/logout" method="post"><button type="submit" className="mt-4 px-4 py-3 text-sm jshs-button-secondary">登出</button></form> : <a href="/api/line/login/start" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">使用 LINE 註冊／登入</a>}{status ? <p className="mt-3 text-sm text-[var(--jshs-success)]" role="status">{status}</p> : null}</article><article id="teacher" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">工作模式</p><h2 className="mt-2">切換你的使用情境</h2><div className="mt-4 flex gap-2">{[["student", "學生／家庭"], ["teacher", "老師／輔導室"]].map(([value, label]) => <button key={value} type="button" onClick={() => setMode(value as typeof mode)} className={`px-3 py-2 text-sm jshs-button ${mode === value ? "jshs-button-primary" : "jshs-button-secondary"}`}>{label}</button>)}</div></article><article id="data" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">匯入／匯出資料</p><h2 className="mt-2">掌握自己的資料</h2><button type="button" onClick={exportData} className="mt-5 px-4 py-3 text-sm jshs-button-secondary">匯出目前資料</button></article></div></section>;
}
