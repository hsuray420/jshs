import { listSiteSettings } from "../../../../db/admin-store";
import { requireAdmin } from "../../auth";

export const dynamic = "force-dynamic";

export default async function SchoolCsvPage() {
  await requireAdmin();
  const settings = new Map((await listSiteSettings()).map((item) => [item.key, item.value]));
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Data / Import</p><h1>CSV 匯入</h1><p className="admin-muted">更新學校資料前先驗證欄位；檔案會私有保存於 D1。</p></div></section><form className="admin-panel admin-module-form" action="/api/admin/schools-csv" method="post" encType="multipart/form-data"><label>學校 CSV<input name="schools_csv" type="file" accept=".csv,text/csv" required /></label><button className="admin-button" type="submit">驗證並匯入</button></form><section className="admin-panel"><h2>目前來源</h2><p className="admin-muted">{settings.get("schools_csv_file_name") || "內建 schools.csv"}</p><small>{settings.get("schools_csv_updated_at") || "尚未由後台更新"}</small></section></>;
}
