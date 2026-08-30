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
  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="grid gap-4 md:grid-cols-2"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">LINE 會員</p><h2 className="mt-2">{member ? `嗨，${member.displayName}` : "使用 LINE 註冊／登入"}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">找學校、算成績、我的志願與升學日程都可以先直接使用。{member ? "你已完成 LINE 會員註冊，會員資料僅用於提供會員功能。" : "登入會員功能前，必須先加入全國國中升學資訊網官方 LINE 好友。"}</p>{friendRequired ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="alert"><strong className="block">請先加入官方 LINE 好友</strong><span className="mt-1 block">未完成好友加入前，不會開通會員功能。加入後請重新確認好友資格。</span><a href={friendLink} target={officialLineUrl ? "_blank" : undefined} rel={officialLineUrl ? "noreferrer" : undefined} className="mt-4 inline-flex px-4 py-3 font-black jshs-button-primary">加入官方 LINE 好友</a><a href="/api/line/login/start" className="mt-3 block font-black text-[var(--jshs-primary)] underline">重新確認好友資格</a></div> : null}{friendSetup ? <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950" role="alert">會員驗證目前暫時無法使用，請稍後再試。</p> : null}{registered ? <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800" role="status">LINE 會員已完成登入，好友資格已確認。</p> : null}{member ? <><p className="mt-5 text-sm font-black text-[var(--jshs-success)]">LINE 會員已登入</p><form action="/api/line/logout" method="post"><button type="submit" className="mt-4 px-4 py-3 text-sm jshs-button-secondary">登出</button></form></> : <a href="/api/line/login/start" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">使用 LINE 註冊／登入</a>}{status ? <p className="mt-3 text-sm text-[var(--jshs-success)]" role="status">{status}</p> : null}</article><article id="teacher" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">工作模式</p><h2 className="mt-2">切換你的使用情境</h2><div className="mt-4 flex gap-2">{[["student", "學生／家庭"], ["teacher", "老師／輔導室"]].map(([value, label]) => <button key={value} type="button" onClick={() => setMode(value as typeof mode)} className={`px-3 py-2 text-sm jshs-button ${mode === value ? "jshs-button-primary" : "jshs-button-secondary"}`}>{label}</button>)}</div><p className="mt-4 text-sm leading-7 jshs-muted-copy">{mode === "teacher" ? "批次模式規劃中；目前可用搜尋、資料來源與待辦頁面協助班級討論。" : "以自己的學校、成績與志願規劃為主。"}</p></article><article id="data" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">匯入／匯出資料</p><h2 className="mt-2">掌握自己的資料</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">匯出只包含這台裝置上保存的偏好與進度，不包含密碼或第三方帳號資料。</p><button type="button" onClick={exportData} className="mt-5 px-4 py-3 text-sm jshs-button-secondary">匯出目前資料</button></article><article id="siblings" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">手足資料切換</p><h2 className="mt-2">每位學生各自一份規劃</h2><p className="mt-2 text-sm leading-7 jshs-muted-copy">登入後仍可先使用單一學生規劃；同一帳號的多位學生資料會以不同規劃檔案分開管理。</p><span className="mt-5 inline-flex jshs-chip">目前：單一學生模式</span></article></div></section>;
}
