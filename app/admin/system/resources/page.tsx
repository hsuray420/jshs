import Link from "next/link";
import { requireAdmin } from "../../auth";
import { getCanonicalSchoolFileSnapshot } from "../../../../lib/school-github-sync";
import { hasLineLoginConfigured, hasLineMessagingConfigured } from "../../../../lib/line";
import { getImageKitConfig } from "../../../../lib/imagekit-server";
import { getSupabaseServerConfig } from "../../../../lib/supabase-server";
import { ADMIN_EXTERNAL_LINKS, providerStatus } from "../../../../lib/system-resources";
import { schoolMetadata } from "../../../../lib/school-repository";
import { listExternalMediaCleanup } from "../../../../db/admin-store";

export const dynamic = "force-dynamic";

export default async function SystemResourcesPage() {
  await requireAdmin();
  const [github, cleanup] = await Promise.all([
    getCanonicalSchoolFileSnapshot(schoolMetadata.enabledRegions[0]?.code || "tp").catch(() => null),
    listExternalMediaCleanup().catch(() => []),
  ]);
  const supabase = getSupabaseServerConfig();
  const imagekit = getImageKitConfig();
  const lineLogin = hasLineLoginConfigured();
  const lineFriend = hasLineMessagingConfigured();
  return <>
    <section className="admin-page-heading"><div><p className="admin-eyebrow">Platform / Resources</p><h1>系統資源</h1><p className="admin-muted">日常維護仍在全國國中升學資訊網後台完成；這裡只顯示服務狀態、真實可得的使用量與進階管理入口。</p></div></section>
    <section className="admin-resource-grid" aria-label="系統資源狀態">
      <ResourceCard title="網站伺服器" status="ready" label="正常" detail="Cloudflare Worker 執行網站、API 與必要暫存；沒有可作為永久資料倉庫的本機磁碟。" usage="儲存空間：由 Hosting 平台管理，未取得可靠上限。" href={ADMIN_EXTERNAL_LINKS.hosting} action="開啟主機管理" />
      <ResourceCard title="Supabase" {...providerStatus(Boolean(supabase))} detail="使用者、LINE identity、成績、弱點、志願、收藏、匿名投稿、草稿與 Audit 的目標電子資料櫃。" usage={supabase ? "已連線設定；方案使用量請至 Supabase 查看。" : "尚未設定連線；既有 D1 資料未被搬移。"} href={ADMIN_EXTERNAL_LINKS.supabase} action="開啟 Supabase" />
      <ResourceCard title="ImageKit" {...providerStatus(Boolean(imagekit))} detail="學校封面與校園照片的目標照片櫃。私鑰只存在 Worker secret。" usage={imagekit ? `已連線設定；${cleanup.length ? `${cleanup.length} 筆舊檔清理待重試。` : "沒有待清理檔案。"} Storage、Bandwidth 與檔案數請至 ImageKit 查看。` : "尚未設定連線；既有圖片仍保持原本安全路徑。"} href={ADMIN_EXTERNAL_LINKS.imagekit} action="管理圖片" />
      <ResourceCard title="GitHub" status={github ? "ready" : "attention"} label={github ? "已連線" : "同步失敗"} detail={github ? `${github.repository} · ${github.branch} · canonical blob ${github.sha?.slice(0, 12) || "—"}` : "無法讀取 canonical CSV；請查看資料健康中心錯誤。"} usage="公開官方學校、招生與就學區資料；不存私人使用者資料。" href={ADMIN_EXTERNAL_LINKS.github} action="開啟 GitHub" />
      <ResourceCard title="LINE" status={lineLogin && lineFriend ? "ready" : "attention"} label={lineLogin && lineFriend ? "正常" : "需要設定"} detail={`LINE Login：${lineLogin ? "正常" : "未設定"}；好友驗證：${lineFriend ? "正常" : "未設定"}。兩者分別處理。`} usage="登入與好友資格不會刪除 JSHS 使用者或其歷史資料。" href={ADMIN_EXTERNAL_LINKS.lineDevelopers || ADMIN_EXTERNAL_LINKS.lineOfficialAccount} action="開啟 LINE 管理" />
    </section>
    <section className="admin-panel"><div className="admin-section-head"><div><p className="admin-eyebrow">Storage policy</p><h2>資料放置原則</h2></div><Link className="admin-button-secondary" href="/admin/users">查看使用者</Link></div><dl className="admin-health-definition"><dt>GitHub</dt><dd>公開、可版本控制的官方 CSV 與程式碼。</dd><dt>Supabase</dt><dd>啟用後承接私人與動態資料；RLS 預設拒絕瀏覽器直接存取。</dd><dt>ImageKit</dt><dd>啟用後承接大型公開圖片；資料庫只留 metadata 與 file ID／URL。</dd><dt>目前保護</dt><dd>既有 D1 與 LINE 資料保持可用，未經 row-conservation 驗證不會搬移或刪除。</dd></dl></section>
  </>;
}

function ResourceCard({ title, status, label, detail, usage, href, action }: { title: string; status: "ready" | "attention" | "unconfigured"; label: string; detail: string; usage: string; href: string; action: string }) {
  return <article className={`admin-resource-card ${status}`}><div className="admin-section-head"><h2>{title}</h2><span className={`admin-badge ${status === "ready" ? "ok" : status === "attention" ? "warn" : "info"}`}>{label}</span></div><p>{detail}</p><small>{usage}</small>{href ? <a className="admin-button-secondary" href={href} target="_blank" rel="noreferrer">{action} ↗</a> : <span className="admin-muted">尚未設定管理連結</span>}</article>;
}
