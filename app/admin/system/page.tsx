import Link from "next/link";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

export default async function SystemPage() {
  const admin = await requireAdmin();

  const services = [
    {
      name: "Cloudflare Worker Runtime",
      desc: "邊緣全端服務運行於 Cloudflare Edge 節點",
      status: "Operational",
      tone: "ok" as const,
      detail: "Vinext SSR / API Handlers",
      href: "/api/health",
    },
    {
      name: "Cloudflare D1 Database",
      desc: "專屬 SQLite 儲存庫（草稿、審查、日誌）",
      status: "Connected",
      tone: "ok" as const,
      detail: "D1 Community & Admin Store",
      href: "/admin/system/resources",
    },
    {
      name: "圖資與地理編碼 (OSRM & OSM)",
      desc: "通勤時間計算與學校經緯度解析服務",
      status: "Active",
      tone: "ok" as const,
      detail: "OpenStreetMap / Nominatim",
      href: "/admin/schools",
    },
    {
      name: "LINE Official Notification API",
      desc: "考季重要時程與推播發送通道",
      status: "Configured",
      tone: "ok" as const,
      detail: "Messaging API Channel",
      href: "/admin/notifications",
    },
    {
      name: "綠界科技金流 (ECPay)",
      desc: "贊助與小額捐款金流閘道",
      status: "Secured",
      tone: "info" as const,
      detail: "HashKey / HashIV 由 Secret 管理",
      href: "/admin/payments",
    },
    {
      name: "Session HMAC 鑑權簽章",
      desc: "SHA-256 簽署保護與時效性驗證",
      status: "Enforced",
      tone: "ok" as const,
      detail: "8 小時有效期，防止偽造",
      href: "/admin/users",
    },
  ];

  const subsystems = [
    {
      title: "系統資源與 D1",
      desc: "檢視資料庫儲存容量、資料表列數與 D1 備份狀態",
      href: "/admin/system/resources",
      tag: "Storage & D1",
    },
    {
      title: "發布與部署紀錄",
      desc: "檢視 GitHub Actions 部署事件、版本雜湊與安全回滾",
      href: "/admin/deployments",
      tag: "Deployments",
    },
    {
      title: "操作審計日誌 (Audit)",
      desc: "追蹤全站資料變更、欄位 Diff 與管理員操作記錄",
      href: "/admin/audit",
      tag: "Audit Log",
    },
    {
      title: "人員與權限管理 (RBAC)",
      desc: "維護 LINE User ID 權限等級（Owner / Admin / Reviewer / Editor）",
      href: "/admin/users",
      tag: "Access Control",
    },
    {
      title: "贊助與金流密鑰",
      desc: "檢查綠界金流參數與密鑰遮蔽狀態，保護關鍵 secrets",
      href: "/admin/payments",
      tag: "Payments",
    },
    {
      title: "網站全域設定",
      desc: "調整學年度切換、全站公告橫幅、SEO 與維護模式",
      href: "/admin/settings",
      tag: "Settings",
    },
    {
      title: "程式碼與檔案檢視",
      desc: "直接檢閱各模組原始碼、安全邊界與資料模型定義",
      href: "/admin/code",
      tag: "Code Inspector",
    },
  ];

  return (
    <>
      {/* 技術後台標題 */}
      <section className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Technical Console · 系統運維與技術控制台</p>
          <h1>技術運維總覽</h1>
          <p className="admin-muted">
            當前操作者：<strong>{admin.user.displayName}</strong>（權限等級：{admin.user.role}）。監控 Cloudflare Worker、D1 儲存庫、外接服務健康度與全站資安配置。
          </p>
        </div>
        <div className="admin-actions">
          <Link className="admin-button" href="/admin/system/resources">
            檢視 D1 資源
          </Link>
          <Link className="admin-button-secondary" href="/admin/deployments">
            查看部署紀錄
          </Link>
          <Link className="admin-button-secondary" href="/admin">
            切換至業務後台 💼
          </Link>
        </div>
      </section>

      {/* 技術運維狀態橫幅 */}
      <section className="admin-tech-banner" aria-label="系統運維狀態">
        <div className="admin-tech-banner-left">
          <span className="admin-tech-status-badge">
            <span className="admin-pulse-dot" /> 核心服務運作正常 (All Systems Operational)
          </span>
          <h2>架構隔離原則：技術維運與業務營運完全解耦</h2>
          <p className="admin-muted">
            線上程式發布經由 GitHub Actions 與 CI-CD 管道保護；後台機密（HashKey、HashIV、LINE Secret）不輸出至 Client 端，高風險操作嚴格限制管理員身分。
          </p>
        </div>
        <div className="admin-tech-banner-stats">
          <div className="admin-tech-stat-card">
            <span>Runtime</span>
            <strong>CF Worker</strong>
            <small>Edge V8</small>
          </div>
          <div className="admin-tech-stat-card">
            <span>Database</span>
            <strong>SQLite D1</strong>
            <small>Serverless</small>
          </div>
          <div className="admin-tech-stat-card">
            <span>Auth Layer</span>
            <strong>RBAC / LINE</strong>
            <small>HMAC Signed</small>
          </div>
        </div>
      </section>

      {/* 服務健康狀態矩陣 */}
      <section className="admin-panel" aria-label="底層服務連線健康度">
        <div className="admin-section-head">
          <div>
            <p className="admin-eyebrow">Service Matrix</p>
            <h2>核心基礎設施與服務健康矩陣</h2>
            <p className="admin-muted">各模組即時健康狀態與安全邊界檢查。</p>
          </div>
          <Link className="admin-plain-link" href="/api/health" target="_blank">
            查看 Health Endpoint ↗
          </Link>
        </div>
        <div className="admin-tech-service-grid">
          {services.map((srv) => (
            <Link key={srv.name} href={srv.href} className="admin-service-card">
              <div className="admin-service-card-top">
                <span className="admin-service-name">{srv.name}</span>
                <span className={`admin-badge ${srv.tone}`}>{srv.status}</span>
              </div>
              <p className="admin-service-desc">{srv.desc}</p>
              <small className="admin-service-detail">{srv.detail} →</small>
            </Link>
          ))}
        </div>
      </section>

      {/* 技術運維核心工具箱 */}
      <section className="admin-panel" aria-label="技術運維核心模組">
        <div className="admin-section-head">
          <div>
            <p className="admin-eyebrow">DevOps & Subsystems</p>
            <h2>技術維運與安全管理模組</h2>
            <p className="admin-muted">專屬工程師與系統管理員的維護工具集。</p>
          </div>
        </div>
        <div className="admin-subsystem-grid">
          {subsystems.map((sub) => (
            <Link key={sub.href} href={sub.href} className="admin-subsystem-card">
              <span className="admin-subsystem-tag">{sub.tag}</span>
              <strong className="admin-subsystem-title">{sub.title}</strong>
              <p className="admin-subsystem-desc">{sub.desc}</p>
              <span className="admin-subsystem-link">進入管理 →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

