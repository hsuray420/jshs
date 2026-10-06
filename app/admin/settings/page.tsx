import Link from "next/link";
import { listSiteSettings } from "../../../db/admin-store";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = new Map((await listSiteSettings()).map((item) => [item.key, item.value]));
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Platform / Settings</p><h1>網站設定</h1><p className="admin-muted">網站基本資料、聯絡方式與公開整合設定。</p></div></section><form className="admin-panel admin-module-form" action="/api/admin/settings" method="post"><h2>基本資料</h2><label>首頁公告<textarea name="site_notice" defaultValue={settings.get("site_notice") || ""} rows={5} /></label><label>聯絡信箱<input name="contact_email" type="email" defaultValue={settings.get("contact_email") || ""} /></label><label>LINE 官方帳號連結<input name="official_line_url" type="url" defaultValue={settings.get("official_line_url") || ""} /></label><input type="hidden" name="donation_url" value={settings.get("donation_url") || ""} /><input type="hidden" name="donation_provider" value={settings.get("donation_provider") || "ecpay"} /><input type="hidden" name="donation_merchant_id" value={settings.get("donation_merchant_id") || ""} /><button className="admin-button" type="submit">儲存網站設定</button></form><section className="admin-panel" style={{ marginTop: "20px" }}><div className="admin-section-head"><div><p className="admin-eyebrow">School Management</p><h2>熱門學校推薦設定</h2></div><Link className="admin-button-secondary" href="/admin/schools/popular">前往設定各區熱門學校 ↗</Link></div><p className="admin-muted">各就學區（基北區、中投區、高雄區等）在學校查詢頁面頂端優先展示的推薦學校。</p></section></>;
}
