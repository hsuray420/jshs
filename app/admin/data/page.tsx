import Link from "next/link";
import { requireAdmin } from "../auth";
import { countPendingSchoolDataDrafts, listSchoolDataAudit, listSchoolMediaOverrides } from "../../../db/admin-store";
import { getSchools, schoolMetadata } from "../../../lib/school-repository";
import { getCanonicalSchoolFileSnapshot } from "../../../lib/school-github-sync";
import validation from "../../../content/schools/generated/validation.json";

export const dynamic = "force-dynamic";

export default async function DataOverview() {
  await requireAdmin();
  const schools = getSchools();
  const syncPromise = getCanonicalSchoolFileSnapshot(schoolMetadata.enabledRegions[0]?.code || "tp").catch(() => ({ configured: false as const, reason: "github_read_failed", filePath: "" }));
  const [media, pendingDrafts, audit, sync] = await Promise.all([listSchoolMediaOverrides(), countPendingSchoolDataDrafts(), listSchoolDataAudit(), syncPromise]);
  const imageCodes = new Set(media.map((item) => item.school_code));
  const missingImages = schools.filter((school) => !imageCodes.has(school.code)).length;
  const missingSources = schools.filter((school) => !Object.values(school.sources).some((items) => items.length)).length;
  const missingCore = schools.filter((school) => !school.address || !school.phone || !school.website).length;
  const valid = schools.length - missingCore;
  const completeness = schools.length ? ((valid / schools.length) * 100).toFixed(1) : "0.0";
  const errors = validation.errors.length;
  const duplicateCodes = validation.duplicateSchoolAudit.duplicateSchoolCodes.length;
  const lastPublish = audit.find((entry) => entry.action === "publish" && entry.status === "success");
  const githubConnected = "repository" in sync;
  return <>
    <section className="admin-page-heading"><div><p className="admin-eyebrow">Data / Health</p><h1>資料健康中心</h1><p className="admin-muted">116 學年度準備視角；目前正式資料仍以 metadata 標示的 {schoolMetadata.academicYear} 學年度為準，不把準備狀態冒充已發布。</p></div><Link className="admin-button" href="/admin/data/csv">查看來源 CSV</Link></section>
    <section className="admin-dashboard-grid" aria-label="資料健康摘要"><HealthCard label="正式學校" value={`${schools.length} 所`} detail={`${schoolMetadata.enabledRegionCount} 區 canonical CSV`} tone="ok" /><HealthCard label="基本資料完整率" value={`${completeness}%`} detail={`${missingCore} 所缺地址、電話或官網`} tone={missingCore ? "warn" : "ok"} /><HealthCard label="待發布草稿" value={`${pendingDrafts} 筆`} detail="D1 草稿，不影響正式站" tone={pendingDrafts ? "warn" : "ok"} /><HealthCard label="驗證錯誤" value={`${errors} 筆`} detail="完整 CSV schema 與資料型態" tone={errors ? "error" : "ok"} /><HealthCard label="跨區重複代碼" value={`${duplicateCodes} 組`} detail="合法聚合；欄位衝突仍為錯誤" tone={duplicateCodes ? "info" : "ok"} /><HealthCard label="缺少圖片" value={`${missingImages} 所`} detail="D1 學校圖片 override 狀態" tone={missingImages ? "warn" : "ok"} /><HealthCard label="缺少來源" value={`${missingSources} 所`} detail="尚無可點擊官方來源" tone={missingSources ? "warn" : "ok"} /></section>
    <section className="admin-dashboard-columns"><section className="admin-panel"><div className="admin-section-head"><div><p className="admin-eyebrow">Needs attention</p><h2>需要處理</h2></div></div><ul className="admin-health-list"><li><Link href="/admin/schools">{missingCore} 所學校缺少核心聯絡資料</Link></li><li><Link href="/admin/schools">{missingImages} 所學校缺少管理員圖片</Link></li><li><Link href="/admin/audit">{pendingDrafts} 筆草稿尚未發布</Link></li><li><Link href="/admin/data/csv">{schoolMetadata.verifyingRegionCount} 區資料仍在驗證中</Link></li></ul></section><section className="admin-panel"><div className="admin-section-head"><div><p className="admin-eyebrow">Validation</p><h2>最近產生資料驗證</h2></div><span className={`admin-badge ${errors ? "error" : "ok"}`}>{errors ? "Failed" : "Passed"}</span></div><dl className="admin-health-definition"><dt>資料來源模型</dt><dd>{schoolMetadata.sourceModel}</dd><dt>資料更新日</dt><dd>{schoolMetadata.sourceUpdatedAt}</dd><dt>招生 records</dt><dd>{schoolMetadata.admissionRecordCount}</dd><dt>Warnings</dt><dd>{validation.warnings.length}</dd></dl></section></section>
    <section className="admin-panel admin-sync-panel"><div className="admin-section-head"><div><p className="admin-eyebrow">Repository connection</p><h2>GitHub Sync</h2></div><span className={`admin-badge ${githubConnected ? "ok" : "error"}`}>{githubConnected ? "Connected" : "Sync Failed"}</span></div><dl className="admin-health-definition"><dt>Repository</dt><dd>{githubConnected ? sync.repository : "未連線"}</dd><dt>Branch</dt><dd>{githubConnected ? sync.branch : "—"}</dd><dt>Canonical blob</dt><dd>{githubConnected ? sync.sha?.slice(0, 12) || "—" : "—"}</dd><dt>Last successful publish</dt><dd>{lastPublish ? new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Taipei" }).format(new Date(lastPublish.occurred_at)) : "尚無紀錄"}</dd></dl>{!githubConnected ? <details><summary>查看錯誤</summary><p className="admin-error-text">{("reason" in sync && sync.reason) || "github_read_failed"}</p></details> : null}<Link className="admin-button-secondary" href="/admin/data">重新同步</Link></section>
  </>;
}

function HealthCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "ok" | "warn" | "info" | "error" }) { return <div className={`admin-dashboard-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
