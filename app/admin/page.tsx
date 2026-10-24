import Link from "next/link";
import { requireAdmin } from "./auth";
import { listPendingSchoolReviews } from "../../db/school-review-store";
import { countPendingDataReports } from "../../db/data-report-store";
import {
  REGIONAL_SCHOOL_SLOTS,
  MAP_COORDINATES_SLOT,
  ADMISSION_SCORES_SLOT,
  SENIOR_SHARES_SLOT,
} from "../../lib/csv-data-registry";
import { AdminModerationQueue } from "../../components/admin-moderation-queue";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const [reviews, dataReportsCount] = await Promise.all([
    listPendingSchoolReviews(),
    countPendingDataReports(),
  ]);

  const totalRegionalSchools = REGIONAL_SCHOOL_SLOTS.reduce(
    (sum, slot) => sum + slot.rowCount,
    0
  );

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Apple HIG Minimalist Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <span>●</span>
            <span>4 大功能獨立分割槽 (Segmented Slots)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 m-0">
            GitHub CSV 資料中控台
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 mb-0 max-w-2xl leading-relaxed">
            管理員 {admin.user.displayName} 您好。全站嚴格依功能實施一功能一分割槽、一區一獨立 CSV 架構；點擊「前往 GitHub 編輯 ↗」可直接在瀏覽器修改，Commit 後自動觸發建置與釋出。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/schools"
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            前台找學校 ↗
          </Link>
          <Link
            href="/admin/data/reports"
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
          >
            <span>使用者勘誤回報</span>
            {dataReportsCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {dataReportsCount}
              </span>
            ) : null}
          </Link>
          <a
            href={admin.signOutPath}
            className="px-4 py-2 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
          >
            登出
          </a>
        </div>
      </header>

      {/* Quick Navigation Segmented Controls */}
      <nav aria-label="分割槽快速導覽" className="flex flex-wrap gap-2">
        <a
          href="#slot-schools"
          className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition shadow-xs"
        >
          【找學校】15 就學區獨立插槽 (15 區 · {totalRegionalSchools} 校)
        </a>
        <a
          href="#slot-map"
          className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition shadow-xs"
        >
          【學校地圖】座標主檔 ({MAP_COORDINATES_SLOT.rowCount} 筆)
        </a>
        <a
          href="#slot-scores"
          className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition shadow-xs"
        >
          【歷年錄取成績】落點分數庫 ({ADMISSION_SCORES_SLOT.rowCount} 筆)
        </a>
        <a
          href="#slot-shares"
          className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition shadow-xs"
        >
          【學長姐分享】審核工作台與分享庫
        </a>
      </nav>

      {/* =========================================================================
          分割槽 1：【找學校】15 就學區獨立 CSV 槽 (15 District Slots)
      ========================================================================= */}
      <section id="slot-schools" aria-label="找學校 15 就學區獨立 CSV 槽" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 tracking-wide uppercase mb-1">
              <span>Slot 1</span>
              <span>·</span>
              <span>獨立分區維護架構</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 m-0">
              【找學校】15 就學區獨立學校 CSV 插槽
            </h2>
            <p className="text-slate-500 text-xs mt-1 mb-0">
              全臺 15 個就學區各自具備獨立的詳細 CSV 檔案。修改任一區只會更動該區檔案，嚴禁合併成單一肥大總表。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
              共 15 個就學區 · {totalRegionalSchools} 筆學校
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGIONAL_SCHOOL_SLOTS.map((slot) => {
            const isAvailable = slot.status === "available";
            return (
              <article
                key={slot.id}
                className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between transition hover:shadow-md hover:border-slate-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-base font-bold text-slate-900">
                      {slot.name}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                          : "bg-amber-50 text-amber-700 border border-amber-200/50"
                      }`}
                    >
                      {isAvailable ? `已啟用 · ${slot.rowCount} 校` : `資料驗證中 · ${slot.rowCount} 校`}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono mb-2">
                    {slot.schoolYear} 學年度 · 代碼 #{slot.id}
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 mb-4 border border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      獨立 CSV 檔案路徑
                    </div>
                    <code className="text-[11px] font-mono text-slate-700 break-all leading-snug block">
                      {slot.csvPath}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={slot.githubEditUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center px-3 py-2 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition shadow-xs"
                  >
                    前往 GitHub 編輯此區 CSV ↗
                  </a>
                  <Link
                    href={`/schools?district=${slot.id}`}
                    className="px-3 py-2 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    title="在前台檢視此區"
                  >
                    前台檢視
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          分割槽 2：【學校地圖】經緯度座標 CSV 槽
      ========================================================================= */}
      <section id="slot-map" aria-label="學校地圖經緯度座標 CSV 槽" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 tracking-wide uppercase mb-1">
              <span>Slot 2</span>
              <span>·</span>
              <span>地圖定位專屬檔案</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 m-0">
              【學校地圖】經緯度座標 CSV 分割槽
            </h2>
            <p className="text-slate-500 text-xs mt-1 mb-0">
              專門提供學校地圖探索定位之專用座標資料庫，絕無人工捏造或漂移假點。
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
            {MAP_COORDINATES_SLOT.rowCount} 筆已定位座標
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  {MAP_COORDINATES_SLOT.name}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {MAP_COORDINATES_SLOT.columnsCount} 欄位規範
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed m-0">
                {MAP_COORDINATES_SLOT.description}
              </p>
              <div className="pt-1">
                <code className="text-xs font-mono text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                  {MAP_COORDINATES_SLOT.filePath}
                </code>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={MAP_COORDINATES_SLOT.githubEditUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition shadow-xs"
              >
                前往 GitHub 編輯座標 CSV ↗
              </a>
              <Link
                href="/schools/map"
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                查看學校地圖 ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          分割槽 3：【歷年錄取成績】分數落點 CSV 槽
      ========================================================================= */}
      <section id="slot-scores" aria-label="歷年錄取成績分數落點 CSV 槽" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 tracking-wide uppercase mb-1">
              <span>Slot 3</span>
              <span>·</span>
              <span>歷年落點資料庫</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 m-0">
              【歷年錄取成績】分數落點 CSV 分割槽
            </h2>
            <p className="text-slate-500 text-xs mt-1 mb-0">
              收錄社群與公開整理之歷年各高中職會考最低錄取門檻、積分累積與採計標準紀錄。
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200/60">
            {ADMISSION_SCORES_SLOT.rowCount} 筆落點標準
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  {ADMISSION_SCORES_SLOT.name}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {ADMISSION_SCORES_SLOT.columnsCount} 欄位規範
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed m-0">
                {ADMISSION_SCORES_SLOT.description}
              </p>
              <div className="pt-1">
                <code className="text-xs font-mono text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                  {ADMISSION_SCORES_SLOT.filePath}
                </code>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={ADMISSION_SCORES_SLOT.githubEditUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition shadow-xs"
              >
                前往 GitHub 編輯成績 CSV ↗
              </a>
              <Link
                href="/scores/history"
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                查看歷年落點 ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          分割槽 4：【學長姐分享】經驗分享 CSV 與稽核槽
      ========================================================================= */}
      <section id="slot-shares" aria-label="學長姐分享經驗分享 CSV 與稽核槽" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 tracking-wide uppercase mb-1">
              <span>Slot 4</span>
              <span>·</span>
              <span>投稿審核與經驗分享</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 m-0">
              【學長姐分享】經驗分享 CSV 與投稿稽核分割槽
            </h2>
            <p className="text-slate-500 text-xs mt-1 mb-0">
              學生前台投稿先進待稽核區，經管理員點擊「核准並寫入 CSV」後直接複製標準列並移入正式檔；點擊「退回刪除」則剔除。
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            {reviews.length} 筆待審核投稿
          </span>
        </div>

        {/* 4A. 上半部：待稽核投稿清單 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 m-0">
              待稽核投稿清單
            </h3>
            <span className="text-xs text-slate-400">
              核准後自動產生標準 CSV 格式並可一鍵前往 GitHub 貼上釋出
            </span>
          </div>

          <AdminModerationQueue initialReviews={reviews} />
        </div>

        {/* 4B. 下半部：正式 CSV 檔案插槽 */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  {SENIOR_SHARES_SLOT.name}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {SENIOR_SHARES_SLOT.columnsCount} 欄位標準規範
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed m-0">
                {SENIOR_SHARES_SLOT.description}
              </p>
              <div className="pt-1">
                <code className="text-xs font-mono text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                  {SENIOR_SHARES_SLOT.filePath}
                </code>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={SENIOR_SHARES_SLOT.githubEditUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition shadow-xs"
              >
                前往 GitHub 編輯分享 CSV ↗
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
