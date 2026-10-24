import Link from "next/link";
import { requireAdmin } from "./auth";
import { listPendingSchoolReviews } from "../../db/school-review-store";
import { countPendingDataReports } from "../../db/data-report-store";
import { getCoreCsvDataSources } from "../../lib/csv-data-registry";
import { AdminModerationQueue } from "../../components/admin-moderation-queue";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const [reviews, dataReportsCount] = await Promise.all([
    listPendingSchoolReviews(),
    countPendingDataReports(),
  ]);

  const csvSources = getCoreCsvDataSources();

  return (
    <div className="space-y-10 pb-12">
      {/* 1. Apple HIG Minimalist Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <span>●</span>
            <span>GitOps 單一真實資料源架構 (SSOT)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 m-0">
            GitHub CSV 資料源中控台
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 mb-0 max-w-2xl leading-relaxed">
            管理員 {admin.user.displayName} 您好。全站所有前台頁面 100% 僅讀取標準 CSV 檔案；在 GitHub 修改並 Commit 後，直接觸發自動建置與無縫釋出。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            看前台首頁 ↗
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

      {/* 2. Block 1: 四大功能 CSV 資料源中控台 (CSV Data Source Hub) */}
      <section aria-label="四大功能 CSV 資料源中控台">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 m-0">四大核心 CSV 資料源</h2>
            <p className="text-slate-500 text-xs mt-1 mb-0">
              點擊「前往 GitHub 編輯 ↗」可直接在瀏覽器修改 CSV，Commit 後自動重新部署更新全站前台。
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            ✓ 4 大模組已連線
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {csvSources.map((source) => (
            <article
              key={source.id}
              className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    <span className="text-[#0071e3]">●</span>
                    <span>對應功能：{source.featureName}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    最後更新：{source.lastUpdated}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                  {source.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {source.description}
                </p>

                {/* File info pill */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📄</span>
                    <div>
                      <code className="text-xs font-bold text-slate-800 block">
                        {source.fileName}
                      </code>
                      <span className="text-[11px] text-slate-400">
                        路徑：{source.filePath}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="text-sm font-bold text-slate-900 block">
                      {source.rowCount.toLocaleString()} 筆
                    </strong>
                    <span className="text-[11px] text-slate-400">
                      {source.columnsCount} 個標準欄位
                    </span>
                  </div>
                </div>

                {/* If it has 15 district subfiles, show disclosure */}
                {source.districtSubFiles && (
                  <details className="mb-4 text-xs group">
                    <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800 py-1 flex items-center justify-between select-none">
                      <span>檢視 15 就學區獨立 CSV 分檔清單 ({source.districtSubFiles.length} 區)</span>
                      <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-2.5 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {source.districtSubFiles.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{sub.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({sub.fileName})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-600">{sub.rowCount} 校</span>
                            <a
                              href={sub.githubEditUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline font-bold text-[11px]"
                            >
                              編輯 ↗
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <a
                  href={source.githubRawUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  預覽 / 下載 CSV
                </a>
                <a
                  href={source.githubEditUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition shadow-sm flex items-center gap-1"
                >
                  <span>在 GitHub 編輯 ↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Block 2: 學長姐分享「投稿稽核工作流」 (Submission Moderation Queue) */}
      <section aria-label="學長姐分享投稿稽核中心">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 m-0">
                學長姐分享投稿稽核中心
              </h2>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                reviews.length > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"
              }`}>
                {reviews.length} 筆待處理
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1 mb-0">
              前台隔離保護：學長姐提交之經驗分享先進入此待審佇列；審核通過後點擊「核准並寫入 CSV」直接加入正式 `senior_shares.csv` 釋出。
            </p>
          </div>
        </div>

        <AdminModerationQueue initialReviews={reviews} />
      </section>
    </div>
  );
}
