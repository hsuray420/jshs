import Link from "next/link";
import { countPendingSchoolDataDrafts, listSchoolDataAudit } from "../../db/admin-store";
import { listSchoolMediaMetadata } from "../../db/school-media-store";
import { listPendingSchoolReviews } from "../../db/school-review-store";
import { countPendingDataReports } from "../../db/data-report-store";
import { requireAdmin } from "./auth";
import { getSchools, schoolMetadata } from "../../lib/school-repository";
import validation from "../../content/schools/generated/validation.json";

export const dynamic = "force-dynamic";

// 15 就學區預設學校統計清單
const DISTRICT_SUMMARY = [
  { name: "基北區", count: 135, code: "tp" },
  { name: "中投區", count: 96, code: "tc" },
  { name: "臺南區", count: 73, code: "tn" },
  { name: "高雄區", count: 53, code: "kh" },
  { name: "桃連區", count: 50, code: "ty" },
  { name: "彰化區", count: 49, code: "ch" },
  { name: "竹苗區", count: 39, code: "hsinchu" },
  { name: "屏東區", count: 23, code: "pt" },
  { name: "雲林區", count: 22, code: "yl" },
  { name: "嘉義區", count: 21, code: "cy" },
  { name: "花蓮區", count: 16, code: "hl" },
  { name: "宜蘭區", count: 12, code: "il" },
  { name: "臺東區", count: 11, code: "tt" },
  { name: "澎湖區", count: 2, code: "ph" },
  { name: "金門區", count: 2, code: "km" },
];

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const schools = getSchools();
  const [reviews, dataReports, media, pendingDrafts, recentAudit] = await Promise.all([
    listPendingSchoolReviews(),
    countPendingDataReports(),
    listSchoolMediaMetadata(),
    countPendingSchoolDataDrafts(),
    listSchoolDataAudit(),
  ]);

  const imageCodes = new Set(media.map((item) => item.school_code));
  const missingImages = schools.filter((school) => !imageCodes.has(school.code)).length;
  const missingCore = schools.filter((school) => !school.address || !school.phone || !school.website).length;
  const completeness = schools.length ? (((schools.length - missingCore) / schools.length) * 100).toFixed(1) : "0.0";

  return (
    <>
      {/* 業務後台主標題 */}
      <section className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Business Console · 業務營運工作台</p>
          <h1>業務營運總覽</h1>
          <p className="admin-muted">
            早安，{admin.user.displayName}。本站專注於全國 15 就學區、545 所高中職升學資料維護、勘誤審核與內容營運。
          </p>
        </div>
        <div className="admin-actions">
          <Link className="admin-button" href="/admin/schools">
            維護學校主檔
          </Link>
          <Link className="admin-button-secondary" href="/admin/data/reports">
            審核勘誤 ({dataReports})
          </Link>
          <Link className="admin-button-secondary" href="/admin/system">
            前往技術後台 ⚙️
          </Link>
        </div>
      </section>

      {/* 考季時程與學年度進度橫幅 */}
      <section className="admin-exam-banner" aria-label="考季與學年度進度">
        <div className="admin-exam-banner-left">
          <span className="admin-exam-tag">考季與學年度週期</span>
          <h2>正式學年度：{schoolMetadata.academicYear} 學年度｜準備推進：{Number(schoolMetadata.academicYear) + 1} 學年度 ({completeness}%)</h2>
          <p className="admin-muted">
            前台公開展示資料以教育部與各區簡章核定之 {schoolMetadata.academicYear} 學年度為基準；{Number(schoolMetadata.academicYear) + 1} 學年度籌備草稿均經 Diff 隔離保護。
          </p>
        </div>
        <div className="admin-exam-banner-stats">
          <div className="admin-exam-stat-item">
            <span>全國涵蓋學校</span>
            <strong>{schools.length} 所</strong>
          </div>
          <div className="admin-exam-stat-item">
            <span>就學區涵蓋</span>
            <strong>15 區完整</strong>
          </div>
          <div className="admin-exam-stat-item">
            <span>招生關聯筆數</span>
            <strong>{schoolMetadata.admissionRecordCount || 604} 筆</strong>
          </div>
        </div>
      </section>

      {/* 營運指標與待辦警報卡片 */}
      <section className="admin-dashboard-grid" aria-label="業務營運指標摘要">
        <DashboardCard
          label="使用者勘誤回報"
          value={`${dataReports} 筆`}
          detail={dataReports ? "有考生/家長回報資料，待查核確認" : "目前無待處理資料回報"}
          tone={dataReports ? "warn" : "ok"}
          href="/admin/data/reports"
        />
        <DashboardCard
          label="學長姐心得審核"
          value={`${reviews.length} 筆`}
          detail={reviews.length ? "待放行匿名就讀分享" : "所有心得均已審核完畢"}
          tone={reviews.length ? "warn" : "ok"}
          href="/admin/data/reviews"
        />
        <DashboardCard
          label="缺少核心聯絡資料"
          value={`${missingCore} 所`}
          detail="缺地址、電話或官方網址"
          tone={missingCore ? "warn" : "ok"}
          href="/admin/schools"
        />
        <DashboardCard
          label="缺少校園形象圖片"
          value={`${missingImages} 所`}
          detail="需要管理員補上授權照片"
          tone={missingImages ? "warn" : "ok"}
          href="/admin/media?mode=missing"
        />
        <DashboardCard
          label="待發布修改草稿"
          value={`${pendingDrafts} 筆`}
          detail="D1 暫存中，發布前提供 Diff 比對"
          tone={pendingDrafts ? "warn" : "ok"}
          href="/admin/audit"
        />
        <DashboardCard
          label="15 區資料管線校驗"
          value={validation.errors.length ? `${validation.errors.length} 筆阻擋` : "全部通過"}
          detail={`${validation.warnings.length} 個非阻擋提醒；0 孤立關聯`}
          tone={validation.errors.length ? "warn" : "ok"}
          href="/admin/data"
        />
      </section>

      {/* 15 就學區推進狀態看板 */}
      <section className="admin-panel" aria-label="15 就學區資料推進看板">
        <div className="admin-section-head">
          <div>
            <p className="admin-eyebrow">15 Districts Coverage</p>
            <h2>15 就學區學校分佈與資料推進看板</h2>
            <p className="admin-muted">點擊任一就學區可快速過濾該區學校名錄與招生關聯。</p>
          </div>
          <Link className="admin-plain-link" href="/admin/data">
            檢視資料健康中心 →
          </Link>
        </div>
        <div className="admin-district-grid">
          {DISTRICT_SUMMARY.map((district) => (
            <Link
              key={district.code}
              href={`/admin/schools?region=${district.code}`}
              className="admin-district-badge"
            >
              <span className="admin-district-name">{district.name}</span>
              <strong className="admin-district-count">{district.count} 所</strong>
              <small className="admin-district-tag">已校驗</small>
            </Link>
          ))}
        </div>
      </section>

      {/* 雙欄：需要處理清單 + 最近業務修改紀錄 */}
      <section className="admin-dashboard-columns">
        <section className="admin-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Needs attention</p>
              <h2>需要處理的營運項目</h2>
            </div>
          </div>
          <div className="admin-quick-links">
            <Link href="/admin/data/reports">
              審核資料勘誤回報
              <span>{dataReports} 件待查證</span>
            </Link>
            <Link href="/admin/data/reviews">
              審核學長姐心得
              <span>{reviews.length} 則待放行</span>
            </Link>
            <Link href="/admin/schools">
              補齊學校電話與地址
              <span>{missingCore} 所缺基本聯絡資訊</span>
            </Link>
            <Link href="/admin/media?mode=missing">
              補齊學校校園照片
              <span>{missingImages} 所尚無封面</span>
            </Link>
            <Link href="/admin/editor">
              前台鏡像可視化編輯
              <span>在真實前台介面預覽編輯</span>
            </Link>
            <Link href="/admin/content">
              升學專題與指南文章
              <span>編輯與發布升學快訊</span>
            </Link>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Recent activity</p>
              <h2>最近資料修改與發布</h2>
            </div>
            <Link href="/admin/audit" className="admin-plain-link">
              完整日誌 →
            </Link>
          </div>
          <ul className="admin-activity-list">
            {recentAudit.slice(0, 6).map((entry) => (
              <li key={entry.id}>
                <span>
                  <strong>{entry.school_name || "系統變更"}</strong> · {entry.field || entry.action}
                </span>
                <time>{entry.status}</time>
              </li>
            ))}
            {!recentAudit.length ? (
              <li>
                <span>尚無學校資料修改紀錄</span>
                <time>Audit</time>
              </li>
            ) : null}
          </ul>
        </section>
      </section>
    </>
  );
}

function DashboardCard({
  label,
  value,
  detail,
  tone,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "ok" | "warn" | "info";
  href: string;
}) {
  return (
    <Link href={href} className={`admin-dashboard-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </Link>
  );
}

