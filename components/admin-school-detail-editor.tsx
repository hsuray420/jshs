"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fieldDefinitionByCsvColumn, schoolAdminFieldCatalog } from "../lib/school-admin-fields.mjs";

export type RawSchool = Record<string, string>;
type FieldDefinition = { domainField: string; csvColumn: string; label: string; section: string; editable: boolean; multiline?: boolean; input?: string; sourceColumn?: string };
type Diff = { field: string; oldValue: string; newValue: string };
type Conflict = { field: string; loadedValue: string; latestValue: string; proposedValue: string };
export type AdminSchoolDetailEditorProps = {
  schoolCode: string;
  regionCode: string;
  raw: RawSchool;
  initialDraft: RawSchool;
  initialDraftBase: RawSchool;
  expectedSha: string;
  sourceFile: string;
  syncConfigured: boolean;
  canEdit?: boolean;
  canPublish: boolean;
  initialCommitSha?: string;
  initialCommitUrl?: string;
  onDraftChange?: (draft: RawSchool) => void;
};
type Status = "idle" | "dirty" | "saving" | "draft" | "previewing" | "publishing" | "tracking" | "deployed" | "failure";

const catalog = schoolAdminFieldCatalog() as FieldDefinition[];
const tabs = [
  { id: "basic", label: "基本資料", sections: ["basic"] },
  { id: "admissions", label: "招生資料／招生與課程", sections: ["admissions"] },
  { id: "departments", label: "科別", sections: ["departments"] },
  { id: "transport", label: "交通", sections: ["transport"] },
  { id: "sources", label: "資料來源", sections: ["sources"] },
] as const;

export function AdminSchoolDetailEditor(props: AdminSchoolDetailEditorProps) {
  const { schoolCode, regionCode, raw, initialDraft, initialDraftBase, expectedSha, sourceFile, syncConfigured, canEdit = true, canPublish, initialCommitSha = "", initialCommitUrl = "", onDraftChange } = props;
  const [base, setBase] = useState(raw);
  const [conflictBase, setConflictBase] = useState(initialDraftBase);
  const [draft, setDraft] = useState(initialDraft);
  const [activeTab, setActiveTab] = useState("basic");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<Status>(initialCommitSha ? "tracking" : Object.keys(initialDraft).some((key) => initialDraft[key] !== raw[key]) ? "draft" : "idle");
  const [message, setMessage] = useState(initialCommitSha ? "正在恢復上次的部署狀態檢查…" : "");
  const [preview, setPreview] = useState<Diff[] | null>(null);
  const [previewSha, setPreviewSha] = useState(expectedSha);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [commitSha, setCommitSha] = useState(initialCommitSha);
  const [deploymentUrl, setDeploymentUrl] = useState(initialCommitUrl);
  const fields = useMemo(() => catalog.filter((field) => tabs.find((tab) => tab.id === activeTab)?.sections.includes(field.section as never) && field.editable), [activeTab]);
  const changed = useMemo(() => Object.keys(draft).filter((key) => base[key] !== draft[key] && fieldDefinitionByCsvColumn(key)?.editable), [base, draft]);
  const dirty = changed.length > 0;

  useEffect(() => { onDraftChange?.(draft); }, [draft, onDraftChange]);

  useEffect(() => {
    if (!dirty || !canEdit) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [canEdit, dirty]);

  const payload = (action: "save-draft" | "preview" | "publish") => ({
    action, regionCode, expectedSha: action === "publish" ? previewSha : expectedSha,
    updates: Object.fromEntries(changed.map((field) => [field, draft[field] || ""])),
    baseValues: Object.fromEntries(changed.map((field) => [field, conflictBase[field] || ""])),
  });

  const request = useCallback(async (action: "save-draft" | "preview" | "publish") => {
    const response = await fetch(`/api/admin/schools/${encodeURIComponent(schoolCode)}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload(action)),
    }).catch(() => null);
    const result = await response?.json().catch(() => null) as { ok?: boolean; status?: string; error?: string; diff?: Diff[]; conflicts?: Conflict[]; latestSha?: string; commitSha?: string; commitUrl?: string; draftUpdatedAt?: string } | null;
    if (!response?.ok || !result?.ok) throw Object.assign(new Error(result?.error || "request_failed"), { result });
    return result;
  }, [changed, conflictBase, expectedSha, previewSha, regionCode, schoolCode]);

  useEffect(() => {
    if (!dirty || !canEdit || busy(status) || preview) return;
    const timer = window.setTimeout(async () => {
      try {
        await request("save-draft");
        setStatus("draft");
        setMessage("草稿已自動保存；正式網站尚未變更。");
      } catch (error) {
        const typed = error as Error & { result?: { error?: string; conflicts?: Conflict[] } };
        setConflicts(typed.result?.conflicts || []);
        setStatus("failure");
        setMessage(errorMessage(typed.result?.error || typed.message));
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [canEdit, dirty, draft, preview, request, status]);

  async function saveDraft() {
    if (!dirty || !canEdit) return;
    setStatus("saving"); setMessage("正在儲存後台草稿…"); setConflicts([]);
    try {
      const result = await request("save-draft");
      setCommitSha(""); setDeploymentUrl("");
      setStatus("draft"); setMessage(`草稿已保存，不影響正式網站${result.draftUpdatedAt ? ` · ${formatDate(result.draftUpdatedAt)}` : ""}`);
    } catch (error) { fail(error); }
  }

  async function openPreview() {
    if (!dirty || !canEdit) return;
    if (!syncConfigured) { setStatus("failure"); setMessage("目前尚未設定 GitHub server-side token，草稿仍可保存，但不能發布。"); return; }
    setStatus("previewing"); setMessage("先保存草稿，再重新下載 GitHub 最新 CSV 並驗證…"); setConflicts([]);
    try {
      await request("save-draft");
      setCommitSha(""); setDeploymentUrl("");
      const result = await request("preview");
      setPreview(result.diff || []); setPreviewSha(result.latestSha || expectedSha);
      setStatus("dirty"); setMessage("驗證完成，請確認 Diff 後發布。");
    } catch (error) { fail(error); }
  }

  async function publish() {
    if (!preview?.length || !canPublish) return;
    setStatus("publishing"); setMessage("正在以 GitHub 最新版本套用欄位變更；草稿會保留至正式部署完成…");
    try {
      const result = await request("publish");
      const createdSha = result.commitSha || "";
      if (!/^[a-f0-9]{40}$/i.test(createdSha)) throw new Error("commit_sha_unavailable");
      setCommitSha(createdSha); setPreview(null); setDeploymentUrl(result.commitUrl || "");
      setStatus("tracking"); setMessage("GitHub commit 已建立，正在確認 Actions 與 Cloudflare 部署結果…");
      void trackDeployment(createdSha, draft);
    } catch (error) { setPreview(null); fail(error); }
  }

  const trackDeployment = useCallback(async (sha: string, committedDraft: RawSchool) => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, 3000));
      const response = await fetch("/api/admin/deployments/github", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sha, schoolCode, regionCode }),
      }).catch(() => null);
      const result = await response?.json().catch(() => null) as { ok?: boolean; deployment?: { status?: string; runUrl?: string } } | null;
      if (!response?.ok || !result?.ok || !result.deployment) {
        setStatus("failure"); setMessage("GitHub commit 已建立，但無法確認正式部署狀態。草稿保留；請到發布記錄檢查。");
        return;
      }
      if (result.deployment.runUrl) setDeploymentUrl(result.deployment.runUrl);
      if (result.deployment.status === "success") {
        setBase(committedDraft); setConflictBase(committedDraft); setEditing(false); setStatus("deployed");
        setMessage("GitHub Actions 與 Cloudflare 部署已成功；草稿已標記完成。");
        return;
      }
      if (result.deployment.status === "failure" || result.deployment.status === "cancelled") {
        setStatus("failure"); setMessage("部署流程失敗或遭取消。草稿仍保留；請先檢查 workflow；GitHub source commit 已存在。");
        return;
      }
      setMessage(result.deployment.status === "unavailable"
        ? "GitHub 部署狀態目前無法讀取；草稿保留，請稍後到發布記錄確認。"
        : "等待 GitHub Actions / Cloudflare 部署完成…");
      if (result.deployment.status === "unavailable") { setStatus("failure"); return; }
    }
    setStatus("failure"); setMessage("部署仍未確認完成；草稿保留。可重新檢查部署，不會將此狀態當作成功。");
  }, [regionCode, schoolCode]);

  useEffect(() => {
    if (initialCommitSha) void trackDeployment(initialCommitSha, initialDraft);
  }, [initialCommitSha, initialDraft, trackDeployment]);

  function fail(error: unknown) {
    const typed = error as Error & { result?: { error?: string; conflicts?: Conflict[] } };
    setConflicts(typed.result?.conflicts || []); setStatus("failure"); setMessage(errorMessage(typed.result?.error || typed.message));
  }

  function cancelTab() {
    const columns = fields.map((field) => field.csvColumn);
    setDraft((current) => ({ ...current, ...Object.fromEntries(columns.map((column) => [column, base[column] || ""])) }));
    setConflictBase((current) => ({ ...current, ...Object.fromEntries(columns.map((column) => [column, base[column] || ""])) }));
    setEditing(false); setPreview(null); setConflicts([]); setStatus(dirty ? "dirty" : "idle"); setMessage("");
  }

  const effectiveStatus = dirty && status === "idle" ? "dirty" : status;
  return <div className="admin-school-detail-layout">
    <main className="admin-school-detail-main">
      <div className="admin-front-mirror"><div><p className="admin-eyebrow">School data workspace</p><strong>管理員編輯的是學校資料；CSV 與 GitHub 僅是底層儲存。</strong></div><Link href={`/schools/${encodeURIComponent(schoolCode)}`} target="_blank">前台查看 ↗</Link></div>
      <div className={`admin-save-status is-${effectiveStatus}`}><span>{statusLabel(effectiveStatus)}</span>{message ? <small>{message}</small> : null}{commitSha ? <code>Commit: {commitSha}</code> : null}{deploymentUrl ? <a href={deploymentUrl} target="_blank" rel="noreferrer">查看 Commit／Workflow ↗</a> : null}{commitSha && status !== "deployed" && status !== "tracking" ? <button type="button" className="admin-button-secondary" onClick={() => { setStatus("tracking"); setMessage("正在重新確認 GitHub Actions / Cloudflare 部署…"); void trackDeployment(commitSha, draft); }}>重新檢查部署</button> : null}</div>
      {dirty ? <div className="admin-dirty-notice">有 {changed.length} 個欄位尚未發布；可先儲存草稿。</div> : null}
      {conflicts.length ? <section className="admin-conflict-panel" role="alert"><h2>資料已被其他人更新，請重新確認</h2>{conflicts.map((item) => <div key={item.field}><strong>{labelFor(item.field)}</strong><span>你載入時：{item.loadedValue || "空白"}</span><span>GitHub 最新：{item.latestValue || "空白"}</span><span>你準備修改：{item.proposedValue || "空白"}</span></div>)}</section> : null}
      <nav className="admin-school-tabs" aria-label="學校資料分頁">
        {tabs.map((tab) => <button type="button" key={tab.id} className={activeTab === tab.id ? "is-active" : ""} disabled={busy(status)} onClick={() => { setActiveTab(tab.id); setEditing(false); }}>{tab.label}</button>)}
        <Link href={`/admin/media?school_code=${encodeURIComponent(schoolCode)}`}>圖片</Link>
        <Link href={`/admin/audit?q=${encodeURIComponent(schoolCode)}`}>修改紀錄</Link>
      </nav>
      <section className="admin-panel admin-school-section">
        <div className="admin-section-head"><div><p className="admin-eyebrow">{activeTab}</p><h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2></div>{editing ? <div className="admin-row-actions"><button className="admin-button-secondary" type="button" onClick={cancelTab} disabled={busy(status)}>取消修改</button></div> : <button className="admin-button-secondary" type="button" onClick={() => setEditing(true)} disabled={!canEdit || busy(status)}>編輯這一頁</button>}</div>
        <div className={`admin-school-fields ${editing && canEdit && !busy(status) ? "is-editing" : ""}`}>{fields.map((field) => <Field key={field.csvColumn} field={field} value={draft[field.csvColumn] || ""} original={base[field.csvColumn] || ""} raw={draft} editing={editing && canEdit && !busy(status)} onChange={(value) => { setDraft((current) => ({ ...current, [field.csvColumn]: value })); setCommitSha(""); setDeploymentUrl(""); setPreview(null); setStatus("dirty"); }} />)}</div>
      </section>
      <section className="admin-panel admin-readonly-section"><div className="admin-section-head"><div><p className="admin-eyebrow">Stable identity</p><h2>不可直接修改的關聯欄位</h2></div><span className="admin-badge">受保護</span></div><div className="admin-readonly-grid"><ReadOnly label="學校代碼" value={raw["學校代碼"]} /><ReadOnly label="就學區" value={raw["招生區"]} /><ReadOnly label="排名" value={raw["排名"]} /></div></section>
    </main>
    <aside className="admin-school-detail-aside">
      <section className="admin-panel"><p className="admin-eyebrow">Draft & publish</p><h2>本次修改</h2>{changed.length ? <div className="admin-diff-list">{changed.map((field) => <div key={field}><strong>{labelFor(field)}</strong><small className="diff-old">− {base[field] || "空白"}</small><small className="diff-new">+ {draft[field] || "空白"}</small></div>)}</div> : <p className="admin-muted">尚未修改任何欄位。</p>}<div className="admin-publish-actions"><button className="admin-button-secondary" type="button" onClick={saveDraft} disabled={!dirty || !canEdit || busy(status)}>儲存草稿</button><button className="admin-button" type="button" onClick={openPreview} disabled={!dirty || !canEdit || busy(status) || Boolean(commitSha)}>預覽變更</button></div>{!canEdit ? <p className="admin-permission-note">目前角色為唯讀；可查看正式頁面與既有草稿。</p> : !canPublish ? <p className="admin-permission-note">目前角色可編輯與送審，但只有 Administrator／Owner 可以確認發布。</p> : null}</section>
      <section className="admin-panel"><p className="admin-eyebrow">Source</p><h2>資料來源</h2><p className="admin-muted">主要畫面顯示人類可理解欄位；技術對應收在進階資訊。</p><details><summary>進階資訊</summary><dl className="admin-technical-source"><dt>Source</dt><dd>{sourceFile}</dd><dt>key</dt><dd>school_code={schoolCode}</dd><dt>region</dt><dd>{regionCode}</dd><dt>loaded SHA</dt><dd>{expectedSha || "未連線"}</dd></dl></details></section>
    </aside>
    {preview ? <div className="admin-modal-backdrop" role="presentation"><section className="admin-diff-modal" role="dialog" aria-modal="true" aria-labelledby="diff-title"><p className="admin-eyebrow">Publish confirmation</p><h2 id="diff-title">確認發布 {preview.length} 個欄位</h2><p>{raw["學校名稱"]} · school_code: {schoolCode}</p><div className="admin-diff-list">{preview.map((item) => <div key={item.field}><strong>{labelFor(item.field)}</strong><small className="diff-old">− {item.oldValue || "空白"}</small><small className="diff-new">+ {item.newValue || "空白"}</small></div>)}</div><p className="admin-diff-summary">修改 {preview.length} 個欄位 · 新增 0 筆 · 刪除 0 筆</p><div className="admin-modal-actions"><button className="admin-button-secondary" type="button" onClick={() => setPreview(null)}>返回修改</button><button className="admin-button" type="button" onClick={publish} disabled={!canPublish || status === "publishing"}>{canPublish ? "確認發布" : "權限不足"}</button></div></section></div> : null}
  </div>;
}

function Field({ field, value, original, raw, editing, onChange }: { field: FieldDefinition; value: string; original: string; raw: RawSchool; editing: boolean; onChange: (value: string) => void }) {
  const source = field.sourceColumn ? raw[field.sourceColumn] : field.section === "sources" ? value : "";
  const control = field.multiline ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} /> : <input type={field.input === "date" ? "date" : "text"} inputMode={field.csvColumn.includes("名額") ? "numeric" : undefined} value={value} onChange={(event) => onChange(event.target.value)} />;
  return <label><span>{field.label}</span>{editing ? control : <output>{value || <em>目前沒有資料</em>}</output>}{editing && original !== value ? <small className="admin-field-diff">原值：{original || "空白"}</small> : null}<small className="admin-field-meta">資料狀態：{value ? "已有資料" : "缺少資料"} · 最後確認：{raw["資料更新日期"] || "未標示"}</small>{source ? <small className="admin-field-source">來源：{source}</small> : null}<details><summary>技術對應</summary><small>column: {field.csvColumn}</small></details></label>;
}

function ReadOnly({ label, value }: { label: string; value?: string }) { return <div><span>{label}</span><strong>{value || "目前沒有資料"}</strong></div>; }
function labelFor(csvColumn: string) { return fieldDefinitionByCsvColumn(csvColumn)?.label || csvColumn; }
function busy(status: Status) { return status === "saving" || status === "previewing" || status === "publishing" || status === "tracking"; }
function formatDate(value: string) { try { return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); } catch { return value; } }
function statusLabel(status: Status) { return ({ idle: "尚未修改", dirty: "有未儲存修改", saving: "儲存草稿中", draft: "草稿已保存", previewing: "驗證與預覽中", publishing: "發布中", tracking: "部署確認中", deployed: "✓ 正式部署成功", failure: "操作失敗" })[status]; }
function errorMessage(error?: string) { return ({ field_conflict: "同一欄位已在 GitHub 被更新，系統未覆寫；請比較下方三個值。", sha_conflict: "GitHub 在確認發布後又有新 commit，請重新預覽。", github_not_configured: "尚未設定 GitHub server-side token。", github_sync_failed: "GitHub 讀寫未完成；系統沒有標記為已發布。", invalid_fields: "欄位驗證失敗，請檢查格式。", csv_validation_failed: "完整 CSV 驗證失敗，已禁止發布。", admin_role_forbidden: "目前角色沒有發布權限。", cross_origin_request: "安全檢查未通過，請重新整理後再試。", rate_limited: "操作過於頻繁，請稍候再試。", commit_sha_unavailable: "GitHub 未回傳可用的 commit SHA；草稿保留，尚未確認部署。" }[error || ""] || "操作失敗，表單內容仍保留。" ); }
