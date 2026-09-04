import { listSiteSettings } from "../../../db/admin-store";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireAdmin();
  const settings = new Map((await listSiteSettings()).map((item) => [item.key, item.value]));
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Operations / Payments</p><h1>支持與付款</h1><p className="admin-muted">管理綠界動態金額付款。本站不保存信用卡資料，也不把金鑰送到前端。</p></div></section><form className="admin-panel admin-module-form" action="/api/admin/settings" method="post"><h2>綠界公開設定</h2><p className="admin-muted">正式環境的 MerchantID、HashKey、HashIV 由 GitHub Actions Secret 管理；本頁只保留公開說明與舊版連結設定。</p><label>舊版綠界付款連結（選填）<input name="donation_url" type="url" defaultValue={settings.get("donation_url") || ""} placeholder="不使用固定連結可留白" /></label><label>付款平台<input name="donation_provider" defaultValue={settings.get("donation_provider") || "ecpay"} /></label><label>商店／商戶 ID（非機密）<input name="donation_merchant_id" defaultValue={settings.get("donation_merchant_id") || ""} placeholder="可填 MerchantID" /></label><div className="admin-secret-grid"><span>HashKey <strong>● 僅由 GitHub Secret 管理</strong></span><span>HashIV <strong>● 僅由 GitHub Secret 管理</strong></span></div><button className="admin-button" type="submit">儲存公開設定</button></form></>;
}
