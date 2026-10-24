"use client";

import { useState } from "react";
import type { SchoolReview } from "@/db/school-review-store";
import { formatReviewToCsvRow, getGitHubEditUrl } from "@/lib/csv-data-registry";

export function AdminModerationQueue({
  initialReviews,
}: {
  initialReviews: readonly SchoolReview[];
}) {
  const [reviews, setReviews] = useState<readonly SchoolReview[]>(initialReviews);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastCopiedRow, setLastCopiedRow] = useState<string | null>(null);

  const handleApprove = async (review: SchoolReview) => {
    setProcessingId(review.id);
    const csvRow = formatReviewToCsvRow(review);

    try {
      // 1. Copy formatted CSV row to clipboard
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(csvRow);
      }
      setLastCopiedRow(csvRow);

      // 2. Post to server to mark status = published
      const formData = new FormData();
      formData.set("id", review.id);
      formData.set("status", "published");
      formData.set("csvRow", csvRow);

      const res = await fetch("/api/admin/school-reviews", {
        method: "POST",
        body: formData,
      });

      if (!res.ok && res.status !== 303) {
        throw new Error("審核狀態更新失敗");
      }

      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      setToastMessage(`已核准「${review.school_name}」的分享！標準 CSV 列已複製到剪貼簿。`);
    } catch (err) {
      console.error(err);
      alert("處理失敗，請稍後重試。");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (review: SchoolReview) => {
    if (!confirm(`確定要退回並刪除「${review.school_name}」的這筆投稿嗎？`)) {
      return;
    }
    setProcessingId(review.id);

    try {
      const formData = new FormData();
      formData.set("id", review.id);
      formData.set("status", "rejected");

      const res = await fetch("/api/admin/school-reviews", {
        method: "POST",
        body: formData,
      });

      if (!res.ok && res.status !== 303) {
        throw new Error("退回失敗");
      }

      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      setToastMessage(`已退回「${review.school_name}」的投稿。`);
    } catch (err) {
      console.error(err);
      alert("退回失敗，請稍後重試。");
    } finally {
      setProcessingId(null);
    }
  };

  const seniorSharesEditUrl = getGitHubEditUrl("data/senior_shares.csv");

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>{toastMessage}</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={seniorSharesEditUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
            >
              前往 GitHub 貼上並 Commit ↗
            </a>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-500 hover:text-emerald-700 text-xs px-2 py-1"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-8 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 text-xl">
            ✓
          </div>
          <h3 className="text-slate-900 font-bold text-base m-0">目前沒有待審核的學長姐投稿</h3>
          <p className="text-slate-500 text-sm mt-1 mb-0">
            所有前台提交的分享均已處理完畢。新投稿將自動隔離進入此佇列，未審核不會公開。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reviews.map((review) => {
            const isProcessing = processingId === review.id;
            return (
              <article
                key={review.id}
                className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm transition hover:shadow-md"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      {review.district}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2 mb-0">
                      {review.school_name}
                      <span className="text-xs font-normal text-slate-400 ml-2">
                        #{review.school_code}
                      </span>
                    </h3>
                  </div>
                  <div className="text-xs text-slate-400">
                    投稿時間：{review.created_at?.slice(0, 16).replace("T", " ") || "剛剛"}
                  </div>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">暱稱 / 畢業國中</span>
                    <strong className="text-slate-800">{review.nickname || "匿名學長姐"}</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">會考成績 / 積點</span>
                    <strong className="text-slate-800">{review.exam_score || "未填寫"}</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">最低錄取分數</span>
                    <strong className="text-slate-800">{review.admission_score || "未填寫"}</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">錄取科別 / 結果</span>
                    <strong className="text-slate-800">{review.admission_result || "未填寫"}</strong>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 mb-5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    分享內文
                  </span>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed m-0">
                    {review.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400">
                    審核通過後將產生標準 CSV 列，可一鍵寫入並同步至 GitHub。
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReject(review)}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 transition"
                    >
                      退回刪除
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApprove(review)}
                      className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] shadow-sm disabled:opacity-50 transition flex items-center gap-1.5"
                    >
                      {isProcessing ? "處理中..." : "核准並寫入 CSV ↗"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
