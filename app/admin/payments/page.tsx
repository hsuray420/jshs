import { listSiteSettings } from "../../../db/admin-store";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireAdmin();
  const settings = new Map((await listSiteSettings()).map((item) => [item.key, item.value]));
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Operations / Payments</p><h1>支持與付款</h1><p className="admin-muted">管理公開支持頁與綠界付款連結。本站不保存信用卡資料，也不把密鑰送到前端。</p></div></section><form className="admin-panel admin-module-form" action="/api/admin/settings" method="post"><h2>綠界設定</h2><p className="admin-muted">拿到綠界付款網址後，直接貼到這裡即可。</p><label>綠界付款連結（小額捐款／贊助）<input name="donation_url" type="url" defaultValue={settings.get("donation_url") || ""} placeholder="https://payment.ecpay.com.tw/...?amount={amount}" /></label><label>付款平台<input name="donation_provider" defaultValue={settings.get("donation_provider") || "ecpay"} /></label><label>商店／商戶 ID（非機密）<input name="donation_merchant_id" defaultValue={settings.get("donation_merchant_id") || ""} placeholder="拿到資料後貼上" /></label><div className="admin-secret-grid"><span>HashKey <strong>● 僅由環境變數管理</strong></span><span>HashIV <strong>● 僅由環境變數管理</strong></span></div><button className="admin-button" type="submit">儲存付款設定</button></form></>;
}
