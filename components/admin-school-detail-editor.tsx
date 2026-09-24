"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RawSchool = Record<string, string>;
type Props = { schoolCode: string; regionCode: string; raw: RawSchool; expectedSha: string; syncConfigured: boolean };
type Status = "idle" | "dirty" | "validating" | "syncing" | "synced" | "failure";

const sections = [
  { id: "basic", title: "基本資料", fields: ["學校名稱", "官網", "電話"] },
  { id: "address", title: "地址與位置", fields: ["地址", "Google地圖", "地址資料來源"] },
  { id: "transport", title: "交通與通勤", fields: ["校車／專車資訊", "通勤資訊", "校車／專車資料來源", "通勤資料來源"] },
  { id: "life", title: "住宿／生活資訊", fields: ["住宿資訊", "住宿資料來源", "生活資料來源", "資料更新日期"] },
] as const;
const labels: Record<string, string> = { 學校名稱: "學校名稱", 官網: "學校官網", 電話: "電話", 地址: "地址", "Google地圖": "Google 地圖", "地址資料來源": "地址來源", "校車／專車資訊": "校車／專車資訊", 通勤資訊: "通勤／轉乘資訊", "校車／專車資料來源": "校車來源", 通勤資料來源: "通勤來源", 住宿資訊: "住宿資訊", 住宿資料來源: "住宿來源", 生活資料來源: "生活來源", 資料更新日期: "資料更新日期" };

export function AdminSchoolDetailEditor({ schoolCode, regionCode, raw, expectedSha, syncConfigured }: Props) {
  const [draft, setDraft] = useState(raw);
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [commitSha, setCommitSha] = useState("");
  const changed = useMemo(() => Object.keys(raw).filter((key) => raw[key] !== draft[key]), [draft, raw]);
  const dirty = changed.length > 0;

  useEffect(() => { if (!dirty) return; const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; }; window.addEventListener("beforeunload", handler); return () => window.removeEventListener("beforeunload", handler); }, [dirty]);
  function cancel(sectionFields: readonly string[]) { setDraft((current) => ({ ...current, ...Object.fromEntries(sectionFields.map((field) => [field, raw[field] || ""])) })); setEditing(null); setStatus("idle"); setMessage(""); }
  async function save() {
    if (!dirty) return;
    if (!syncConfigured || !expectedSha) { setStatus("failure"); setMessage("同步失敗：目前環境尚未提供 GitHub server-side token，修改仍保留在表單中。"); return; }
    setStatus("validating"); setMessage("正在重新驗證欄位…");
    const updates = Object.fromEntries(changed.map((field) => [field, draft[field] || ""]));
    setStatus("syncing"); setMessage("正在同步 canonical regional CSV…");
    const response = await fetch(`/api/admin/schools/${encodeURIComponent(schoolCode)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ regionCode, expectedSha, updates }) }).catch(() => null);
    const result = await response?.json().catch(() => null) as { ok?: boolean; status?: string; error?: string; commitSha?: string } | null;
    if (!response?.ok || !result?.ok) { setStatus("failure"); setMessage(errorMessage(result?.error)); return; }
    setStatus(result.status === "unchanged" ? "idle" : "synced"); setMessage(result.status === "unchanged" ? "沒有新的欄位變更。" : "已同步至 GitHub canonical CSV。"); setCommitSha(result.commitSha || ""); setEditing(null);
  }

  const effectiveStatus = dirty && status === "idle" ? "dirty" : status;
  return <div className="admin-school-detail-layout"><main className="admin-school-detail-main"><div className={`admin-save-status is-${effectiveStatus}`}><span>{statusLabel(effectiveStatus)}</span>{message ? <small>{message}</small> : null}{commitSha ? <code>Commit: {commitSha}</code> : null}</div>{dirty ? <div className="admin-dirty-notice">有未儲存的變更 · {changed.length} 個欄位</div> : null}{sections.map((section) => <section className="admin-panel admin-school-section" key={section.id}><div className="admin-section-head"><div><p className="admin-eyebrow">{section.id}</p><h2>{section.title}</h2></div>{editing === section.id ? <div className="admin-row-actions"><button className="admin-button-secondary" type="button" onClick={() => cancel(section.fields)}>取消</button><button className="admin-button" type="button" onClick={save} disabled={status === "validating" || status === "syncing"}>儲存全部變更</button></div> : <button className="admin-button-secondary" type="button" onClick={() => setEditing(section.id)}>編輯</button>}</div><div className={`admin-school-fields ${editing === section.id ? "is-editing" : ""}`}>{section.fields.map((field) => <label key={field}><span>{labels[field]}</span>{editing === section.id ? field === "住宿資訊" || field.includes("資訊") ? <textarea rows={3} value={draft[field] || ""} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} /> : <input value={draft[field] || ""} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} /> : <output>{draft[field] || <em>目前沒有資料</em>}</output>}{raw[field] !== draft[field] && editing === section.id ? <small className="admin-field-diff">原值：{raw[field] || "目前沒有資料"}</small> : null}</label>)}</div></section>)}<section className="admin-panel admin-readonly-section"><div className="admin-section-head"><div><p className="admin-eyebrow">Read only</p><h2>招生／校科資料</h2></div><span className="admin-badge">canonical</span></div><div className="admin-readonly-grid"><ReadOnly label="學校代碼" value={raw["學校代碼"]} /><ReadOnly label="就學區" value={raw["招生區"]} /><ReadOnly label="公私立" value={raw["公私立"]} /><ReadOnly label="學制分類" value={raw["學制分類"]} /><ReadOnly label="男女校" value={raw["男女校"]} /><ReadOnly label="科系與名額" value={raw["科系與名額"]} /><ReadOnly label="招生名額" value={raw["招生名額"]} /><ReadOnly label="課程方向" value={raw["課程方向"]} /></div></section></main><aside className="admin-school-detail-aside"><section className="admin-panel"><p className="admin-eyebrow">Source & history</p><h2>資料來源</h2><p className="admin-muted">這個頁面只會寫回對應的區域 CSV；未修改的 row 與欄位會保留。</p><Link href={`/admin/media?school_code=${encodeURIComponent(schoolCode)}`} className="admin-module-link"><h2>媒體</h2><p>管理既有學校圖片，不建立第二套圖片 API。</p><span>開啟媒體管理 →</span></Link></section><section className="admin-panel"><h2>本次修改摘要</h2>{changed.length ? <div className="admin-diff-list">{changed.map((field) => <div key={field}><strong>{labels[field] || field}</strong><small>Before：{raw[field] || "目前沒有資料"}</small><small>After：{draft[field] || "目前沒有資料"}</small></div>)}</div> : <p className="admin-muted">尚未修改任何欄位。</p>}{dirty ? <button className="admin-button admin-save-all" type="button" onClick={save} disabled={status === "validating" || status === "syncing"}>儲存並同步 GitHub</button> : null}</section></aside></div>;
}

function ReadOnly({ label, value }: { label: string; value?: string }) { return <div><span>{label}</span><strong>{value || "目前沒有資料"}</strong></div>; }
function statusLabel(status: Status) { return ({ idle: "尚未修改", dirty: "有未儲存修改", validating: "驗證中", syncing: "同步 GitHub 中", synced: "✓ 已同步", failure: "同步失敗" })[status]; }
function errorMessage(error?: string) { return ({ sha_conflict: "資料來源已被更新，請重新載入後再儲存。", github_not_configured: "同步失敗：目前尚未設定 GitHub server-side token。", github_sync_failed: "同步失敗：GitHub 讀寫未完成，修改仍保留在表單中。", invalid_fields: "驗證失敗：請檢查欄位格式。", csv_validation_failed: "驗證失敗：canonical CSV 未通過資料檢查。" }[error || ""] || "同步失敗，修改仍保留在表單中。" ); }
