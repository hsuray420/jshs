"use client";

import { useEffect, useState } from "react";
import type { MemberSession } from "@/lib/member-auth";
import { readLocalPlanner } from "@/lib/planner-local";

const IMPORT_KEYS = ["jshs_score_history", "jshs_mock_exam_records", "jshs_local_planner_items", "jshs_local_planner_state", "jshs_local_planner_snapshots", "jshs_favorite_school_codes"] as const;
type GuestImport = { scores: unknown[]; mockExams: unknown[]; plannerItems: unknown[]; plannerSnapshots: unknown[]; plannerState: unknown; favoriteCodes: unknown[]; raw: Record<string, string | null> };

function readGuestImport(): GuestImport {
  const raw = Object.fromEntries(IMPORT_KEYS.map((key) => [key, localStorage.getItem(key)]));
  const parseArray = (key: typeof IMPORT_KEYS[number]) => {
    try { const value = JSON.parse(raw[key] || "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
  };
  const planner = readLocalPlanner();
  let plannerState: unknown = {};
  try { plannerState = JSON.parse(raw.jshs_local_planner_state || "{}"); } catch { plannerState = {}; }
  return {
    scores: parseArray("jshs_score_history"),
    mockExams: parseArray("jshs_mock_exam_records"),
    plannerItems: planner.items,
    plannerSnapshots: planner.snapshots,
    plannerState: raw.jshs_local_planner_state ? plannerState : undefined,
    favoriteCodes: parseArray("jshs_favorite_school_codes"),
    raw,
  };
}

export function AccountCenter({ member, error, registered = false }: { member: MemberSession | null; error?: string; registered?: boolean }) {
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [status, setStatus] = useState("");
  const [officialLineUrl, setOfficialLineUrl] = useState("");
  const [guestImport, setGuestImport] = useState<GuestImport | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const [importing, setImporting] = useState(false);
  const [deleteLocalReady, setDeleteLocalReady] = useState(false);
  const [importDeferred, setImportDeferred] = useState(false);

  useEffect(() => {
    if (!member) return;
    const timer = window.setTimeout(() => setGuestImport(readGuestImport()), 0);
    return () => window.clearTimeout(timer);
  }, [member]);

  useEffect(() => {
    fetch("/api/site-config", { headers: { accept: "application/json" } }).then(async (response) => response.ok ? await response.json() as { official_line_url?: string } : null).then((config) => { if (config?.official_line_url) setOfficialLineUrl(config.official_line_url); }).catch(() => undefined);
  }, []);

  function exportData() {
    const data = Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith("jshs")).map((key) => [key, localStorage.getItem(key)]));
    const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "全國國中升學資訊網-我的資料.json"; link.click(); URL.revokeObjectURL(url); setStatus("已匯出目前裝置上的本站資料。");
  }

  async function importGuestData() {
    if (!guestImport) return;
    setImporting(true); setImportStatus("");
    try {
      const response = await fetch("/api/member/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scores: guestImport.scores,
          mockExams: guestImport.mockExams,
          plannerItems: guestImport.plannerItems,
          plannerSnapshots: guestImport.plannerSnapshots,
          plannerState: guestImport.plannerState,
          favoriteCodes: guestImport.favoriteCodes,
        }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string; imported?: Record<string, number> };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "import_failed");
      setImportStatus(`匯入與伺服器讀回驗證成功：成績 ${payload.imported?.scores ?? 0} 筆、模考 ${payload.imported?.mockExams ?? 0} 筆、志願 ${payload.imported?.plannerItems ?? 0} 筆、收藏 ${payload.imported?.favorites ?? 0} 筆。`);
      setDeleteLocalReady(true);
    } catch {
      setImportStatus("匯入未完成或讀回驗證失敗；本機資料仍保留，請稍後重試。");
    } finally { setImporting(false); }
  }

  function deleteImportedLocalCopy() {
    if (!guestImport) return;
    for (const key of IMPORT_KEYS) {
      if (localStorage.getItem(key) === guestImport.raw[key]) localStorage.removeItem(key);
    }
    setGuestImport(readGuestImport());
    setDeleteLocalReady(false);
    setImportStatus("已刪除與匯入時完全相同的本機副本；匯入後新增或變動的本機資料已保留。");
  }

  const friendRequired = error === "line_friend_required";
  const friendLink = officialLineUrl || "/api/line/login/start";
  const accountError = { line_callback: ["登入取消", "你已取消登入或 LINE 沒有回傳完整資料；可繼續使用本機工具，稍後再試。"], line_state: ["登入逾時", "這次登入工作階段已失效，請重新開始登入。"], line_failed: ["服務暫時失敗", "LINE 登入服務暫時無法完成，請稍後再試。"], line_friend_check_setup: ["服務尚未設定", "會員好友驗證尚未設定完成；本機工具仍可正常使用。"], session_expired: ["登入工作階段已失效", "請重新登入；未登入時仍可使用保存在此裝置的工具。"] }[error || ""];
  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="grid gap-4 md:grid-cols-2"><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">LINE 會員</p><h2 className="mt-2">{member ? `嗨，${member.displayName}` : "使用 LINE 註冊／登入"}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">登入後可同步你的規劃進度與試算紀錄；未登入時仍可使用本機工具。</p>{accountError ? <p role="alert" className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong className="block">{accountError[0]}</strong>{accountError[1]}</p> : null}{friendRequired ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="alert"><strong className="block">請先加入官方 LINE 好友</strong><a href={friendLink} target={officialLineUrl ? "_blank" : undefined} rel={officialLineUrl ? "noreferrer" : undefined} className="mt-4 inline-flex px-4 py-3 font-black jshs-button-primary">加入官方 LINE 好友</a><a href="/api/line/login/start" className="mt-3 block font-black text-[var(--jshs-primary)] underline">重新確認好友資格</a></div> : null}{registered ? <p className="mt-5 text-sm font-bold text-emerald-800" role="status">LINE 會員已完成登入，好友資格已確認。</p> : null}{member ? <form action="/api/line/logout" method="post"><button type="submit" className="mt-4 px-4 py-3 text-sm jshs-button-secondary">登出</button></form> : <a href="/api/line/login/start" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">使用 LINE 註冊／登入</a>}{status ? <p className="mt-3 text-sm text-[var(--jshs-success)]" role="status">{status}</p> : null}</article>{member && guestImport && !importDeferred && (guestImport.scores.length || guestImport.mockExams.length || guestImport.plannerItems.length || guestImport.plannerSnapshots.length || guestImport.favoriteCodes.length || guestImport.plannerState) ? <article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">本機資料匯入</p><h2 className="mt-2">這台裝置有未同步的本機紀錄，要匯入你的會員帳號嗎？</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">成績紀錄 {guestImport.scores.length} 筆、模考紀錄 {guestImport.mockExams.length} 筆、志願 {guestImport.plannerItems.length} 筆（歷史版本 {guestImport.plannerSnapshots.length} 筆）、收藏 {guestImport.favoriteCodes.length} 筆。</p><p className="mt-2 text-sm jshs-muted-copy">只有按下「匯入」才會送至伺服器驗證；成功後本機副本仍會保留，直到你另外選擇刪除。</p><button type="button" disabled={importing || deleteLocalReady} onClick={() => void importGuestData()} className="mt-5 px-4 py-3 text-sm jshs-button-primary">{importing ? "匯入與驗證中…" : "匯入"}</button><button type="button" onClick={() => setImportDeferred(true)} className="ml-2 mt-5 px-4 py-3 text-sm jshs-button-secondary">稍後</button>{deleteLocalReady && <button type="button" onClick={deleteImportedLocalCopy} className="ml-2 mt-5 px-4 py-3 text-sm jshs-button-secondary">刪除已匯入的本機副本</button>}{importStatus && <p role="status" className="mt-3 text-sm jshs-muted-copy">{importStatus}</p>}</article> : null}<article id="teacher" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">工作模式</p><h2 className="mt-2">切換你的使用情境</h2><div className="mt-4 flex gap-2">{[["student", "學生／家庭"], ["teacher", "老師／輔導室"]].map(([value, label]) => <button key={value} type="button" onClick={() => setMode(value as typeof mode)} className={`px-3 py-2 text-sm jshs-button ${mode === value ? "jshs-button-primary" : "jshs-button-secondary"}`}>{label}</button>)}</div></article><article id="data" className="p-6 jshs-surface-card"><p className="jshs-eyebrow">匯入／匯出資料</p><h2 className="mt-2">掌握自己的資料</h2><button type="button" onClick={exportData} className="mt-5 px-4 py-3 text-sm jshs-button-secondary">匯出目前資料</button></article></div></section>;
}
