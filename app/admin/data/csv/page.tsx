import Link from "next/link";
import { requireAdmin } from "../../auth";
import { getAvailableSchoolDataRegions } from "../../../../lib/region-registry";

export const dynamic = "force-dynamic";

export default async function SchoolCsvPage() {
  await requireAdmin();
  const regions = getAvailableSchoolDataRegions();
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Data / Canonical CSV</p><h1>十五區原始 CSV</h1><p className="admin-muted">前台的全國校科查詢由這些區域原始檔產生。請從學校詳情進行欄位修改，系統會驗證後寫回 GitHub；產生快取不可直接編輯。</p></div><span className="admin-badge ok">{regions.length} 區</span></section><section className="admin-panel admin-csv-principles"><h2>唯一資料來源</h2><p className="admin-muted">Regional CSV → Schema Validator → Generated Cache → 前台。這裡列出每一區實際讀取的檔案與 GitHub 位置，避免把 D1 上傳檔或 public/data 誤當成前台來源。</p></section><section className="admin-csv-source-list">{regions.map((region) => <article className="admin-panel admin-csv-source-card" id={region.id} key={region.id}><div><p className="admin-eyebrow">{region.id} · {region.schoolYear} 學年度</p><h2>{region.name}</h2><code>{region.csvPath}</code></div><div className="admin-csv-source-actions"><Link className="admin-button-secondary" href={`/admin/schools?region=${encodeURIComponent(region.id)}`}>管理本區學校</Link><a className="admin-button-secondary" href={`https://github.com/hsuray420/jshs/blob/main/${region.csvPath}`} target="_blank" rel="noreferrer">GitHub 原始檔 ↗</a></div></article>)}</section></>;
}
