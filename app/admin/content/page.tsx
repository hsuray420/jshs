import type { Metadata } from "next";
import Link from "next/link";
import { CONTENT_TYPES, listContentEntries, type ContentEntry, type ContentType } from "../../../db/content-store";
import { requireAdmin } from "../auth";
import "../styles.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "內容中心｜管理後台" };

const typeLabels: Record<ContentType, string> = {
  knowledge_term: "知識名詞",
  knowledge_card: "知識卡片",
  schedule_task: "日程待辦",
  site_notice: "站內公告",
};

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<{ edit?: string; type?: string; updated?: string; preview?: string; sync?: string }> }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const entries = await listContentEntries();
  const editing = entries.find((entry) => entry.id === params.edit);
  const contentType = isContentType(params.type) ? params.type : editing?.content_type || "knowledge_term";

  return <main className="admin-shell">
    <header className="admin-header">
      <div><p className="admin-eyebrow">Content Studio</p><h1>內容中心</h1><p className="admin-muted">管理員：{admin.user.displayName} · 內容發布後前台直接讀取，不需要修改 GitHub。</p></div>
      <div className="admin-actions"><Link href="/admin">回後台</Link><Link href="/knowledge" target="_blank">看升學知識 ↗</Link><Link href="/schedule" target="_blank">看時間日程 ↗</Link><a href={admin.signOutPath}>登出</a></div>
    </header>
    {params.updated ? <section className="admin-flash">{params.updated === "published" ? "內容已發布，前台會讀取最新版本。" : params.updated === "unpublished" ? "內容已退回草稿。" : params.updated === "draft" ? "草稿已儲存。" : "內容格式不正確，尚未更新。"}{params.sync === "ok" ? " GitHub 已同步，Actions 會自動驗證並部署。" : params.sync === "pending" ? " Cloudflare 已更新；尚未設定 GitHub 同步 Secret。" : params.sync === "failed" ? " Cloudflare 已更新，但 GitHub 同步失敗，請檢查設定。" : ""}</section> : null}
    <section className="admin-stat-grid"><StatusCard label="內容總數" value={`${entries.length} 筆`} tone="ok" /><StatusCard label="已發布" value={`${entries.filter((entry) => entry.status === "published").length} 筆`} tone="ok" /><StatusCard label="草稿" value={`${entries.filter((entry) => entry.status === "draft").length} 筆`} tone={entries.some((entry) => entry.status === "draft") ? "warn" : "ok"} /><StatusCard label="版本保留" value="每次儲存" tone="ok" /></section>
    <section className="admin-grid admin-grid-3">
      <section className="admin-panel admin-content-list"><div className="admin-section-head"><div><p className="admin-eyebrow">Entries</p><h2>內容清單</h2></div><span className="admin-badge ok">可預覽</span></div><p className="admin-muted">先選內容類型，再編輯；重要日期請到後台的日程管理。</p><div className="admin-content-filters">{CONTENT_TYPES.map((type) => <Link key={type} href={`/admin/content?type=${type}`} className={contentType === type ? "is-active" : ""}>{typeLabels[type]}</Link>)}</div><div className="admin-content-entries">{entries.map((entry) => <Link key={entry.id} href={`/admin/content?edit=${entry.id}`} className={entry.id === editing?.id ? "is-active" : ""}><span><strong>{entry.title}</strong><small>{typeLabels[entry.content_type]} · {entry.slug}</small></span><em className={entry.status === "published" ? "admin-badge ok" : "admin-badge warn"}>{entry.status === "published" ? "已發布" : "草稿"}</em></Link>)}{!entries.length ? <p className="admin-muted">尚未有後台內容，先建立第一筆。</p> : null}</div></section>
      <section className="admin-panel admin-content-editor"><div className="admin-section-head"><div><p className="admin-eyebrow">Editor</p><h2>{editing ? "編輯內容" : "新增內容"}</h2></div>{editing ? <span className={editing.status === "published" ? "admin-badge ok" : "admin-badge warn"}>{editing.status === "published" ? "已發布" : "草稿"}</span> : null}</div><p className="admin-muted">像 Word 一樣先調整文字樣式；進階 JSON 只在需要改欄位時使用。發布後會同步 Cloudflare、GitHub 並觸發部署。</p><form className="admin-content-form" action="/api/admin/content" method="post"><input type="hidden" name="action" value="save" />{editing ? <input type="hidden" name="id" value={editing.id} /> : null}<label>內容類型<select name="content_type" defaultValue={contentType}>{CONTENT_TYPES.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label><label>識別網址 slug<input name="slug" defaultValue={editing?.slug || ""} placeholder="例如：序位" maxLength={120} required /></label><label>標題<input name="title" defaultValue={editing?.title || ""} maxLength={160} required /></label><label>摘要／前台說明<textarea name="summary" defaultValue={editing?.summary || ""} rows={3} maxLength={1000} /></label><div className="admin-editor-toolbar"><label>文字大小<select name="font_size" defaultValue={readStyle(editing).fontSize}><option value="14">小 14px</option><option value="16">標準 16px</option><option value="18">舒適 18px</option><option value="20">大 20px</option><option value="24">特大 24px</option><option value="28">標題 28px</option><option value="32">大標 32px</option></select></label><label>文字顏色<input name="text_color" type="color" defaultValue={readStyle(editing).color} /></label><span>樣式會保留在內容資料中</span></div><label>內容資料（進階 JSON）<textarea name="body_json" defaultValue={editing?.body_json || defaultBody(contentType)} rows={12} spellCheck={false} required /></label><label>儲存狀態<select name="status" defaultValue={editing?.status || "draft"}><option value="draft">草稿</option><option value="published">儲存並發布</option></select></label><div className="admin-row-actions"><button className="admin-button" type="submit">儲存內容</button>{editing ? <Link className="admin-button admin-button-secondary" href={`/admin/content?preview=${editing.id}`} target="_blank">預覽</Link> : null}</div></form>{editing ? <div className="admin-content-actions"><form action="/api/admin/content" method="post"><input type="hidden" name="action" value={editing.status === "published" ? "unpublish" : "publish"} /><input type="hidden" name="id" value={editing.id} /><button type="submit">{editing.status === "published" ? "退回草稿" : "發布這筆內容"}</button></form><small>更新者：{editing.updated_by} · {formatDate(editing.updated_at)}</small></div> : null}</section>
    </section>
    {params.preview ? <Preview entry={entries.find((entry) => entry.id === params.preview)} /> : null}
  </main>;
}

function isContentType(value?: string): value is ContentType { return CONTENT_TYPES.includes(value as ContentType); }
function defaultBody(type: ContentType) { if (type === "knowledge_term") return '{\n  "body": "請輸入名詞說明。"\n}'; if (type === "knowledge_card") return '{\n  "eyebrow": "知識主題",\n  "href": "/news"\n}'; if (type === "schedule_task") return '{\n  "detail": "請輸入待辦說明。"\n}'; return '{\n  "severity": "info"\n}'; }
function readStyle(entry?: ContentEntry) { try { const body = entry ? JSON.parse(entry.body_json) as { style?: { fontSize?: string; color?: string } } : null; return { fontSize: ["14", "16", "18", "20", "24", "28", "32"].includes(body?.style?.fontSize || "") ? body?.style?.fontSize || "16" : "16", color: /^#[0-9a-f]{6}$/i.test(body?.style?.color || "") ? body?.style?.color || "#1C1C1E" : "#1C1C1E" }; } catch { return { fontSize: "16", color: "#1C1C1E" }; } }
function formatDate(value: string) { return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeZone: "Asia/Taipei" }).format(new Date(value)); }
function Preview({ entry }: { entry?: ContentEntry }) { return <section className="admin-panel"><div className="admin-section-head"><div><p className="admin-eyebrow">Preview</p><h2>內容預覽</h2></div></div>{entry ? <><h3>{entry.title}</h3><p className="admin-muted">{entry.summary}</p><pre className="admin-preview-json">{entry.body_json}</pre></> : <p className="admin-muted">找不到要預覽的內容。</p>}</section>; }
function StatusCard({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" }) { return <div className="admin-stat-card"><span>{label}</span><strong>{value}</strong><em className={`admin-badge ${tone}`}>{tone === "ok" ? "正常" : "待處理"}</em></div>; }
