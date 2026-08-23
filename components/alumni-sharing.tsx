"use client";

import { useEffect, useState } from "react";

type Review = Readonly<{
  id: string;
  nickname: string;
  graduation_year: string;
  admission_score: string;
  content: string;
  created_at: string;
}>;

export function AlumniSharing({ district, schoolCode, referenceScore, scoreYear }: { district: string; schoolCode: string; referenceScore: string; scoreYear: string }) {
  const [reviews, setReviews] = useState<readonly Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [nickname, setNickname] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [admissionScore, setAdmissionScore] = useState("");
  const [content, setContent] = useState("");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    fetch(`/api/school-reviews?district=${encodeURIComponent(district)}&schoolCode=${encodeURIComponent(schoolCode)}`)
      .then(async (response) => response.ok ? response.json() as Promise<{ reviews: Review[] }> : { reviews: [] })
      .then((payload) => setReviews(payload.reviews || []))
      .catch(() => setStatus("分享目前無法載入，仍可先查看官方歷年資料。"))
      .finally(() => setLoading(false));
  }, [district, schoolCode]);

  async function submit() {
    if (content.trim().length < 10) { setStatus("請至少寫 10 個字，讓後來的人看得懂你的經驗。"); return; }
    if (!consent) { setStatus("請確認這是你的個人經驗，且同意以非官方分享顯示。"); return; }
    setSubmitting(true);
    setStatus("");
    const response = await fetch("/api/school-reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ district, schoolCode, nickname, graduationYear, admissionScore, content, consent }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { ok?: boolean; review?: Review; error?: string } | null;
    if (response?.ok && payload?.review) {
      setReviews((current) => [payload.review as Review, ...current]);
      setNickname(""); setGraduationYear(""); setAdmissionScore(""); setContent(""); setConsent(false);
      setStatus("已加入非官方學長姐分享，謝謝你留下經驗。");
    } else {
      setStatus(payload?.error === "review_service_unavailable" ? "分享服務暫時忙碌，請稍後再試。" : "分享尚未送出，請確認欄位後再試。");
    }
    setSubmitting(false);
  }

  return <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
    <div className="rounded-2xl bg-amber-50 p-5"><p className="text-xs font-black tracking-[.12em] text-amber-800">官方／CSV 歷年資料</p><h3 className="mt-2 text-xl font-black text-amber-950">最低錄取成績</h3><p className="mt-3 text-2xl font-black text-amber-950">{referenceScore || "目前沒有可公開的歷年資料"}</p><p className="mt-2 text-sm font-bold text-amber-800">資料年度：{scoreYear || "未標示"}</p><p className="mt-4 text-sm leading-7 text-amber-950">這是同一份校科 CSV 的歷年欄位；它不是今年錄取保證，也不代表每個科別都相同。</p></div>
    <div><div className="flex items-end justify-between gap-3"><div><p className="jshs-eyebrow">非官方經驗</p><h3 className="mt-2 text-xl font-black">學長姐怎麼看這間學校？</h3></div><span className="jshs-chip">{reviews.length} 則分享</span></div>{loading ? <p className="mt-4 text-sm jshs-muted-copy">正在載入分享…</p> : reviews.length ? <div className="mt-4 grid gap-3">{reviews.map((review) => <article key={review.id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex flex-wrap items-center gap-2"><strong>{review.nickname || "匿名學長姐"}</strong>{review.graduation_year ? <span className="jshs-chip">{review.graduation_year} 畢業</span> : null}{review.admission_score ? <span className="jshs-chip">當年最低錄取：{review.admission_score}</span> : null}</div><p className="mt-3 text-sm leading-7 text-slate-700">{review.content}</p></article>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-[var(--jshs-border)] p-4 text-sm leading-6 jshs-muted-copy">目前還沒有公開分享；你可以成為第一位留下經驗的學長姐。</p>}<div className="mt-5 rounded-2xl border border-[var(--jshs-border)] p-5"><h4 className="font-black text-[var(--jshs-primary)]">留下你的經驗</h4><p className="mt-2 text-xs leading-5 jshs-muted-copy">只分享你願意公開的個人經驗；這裡是非官方內容，不會改變官方錄取資料。</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="顯示名稱（可留空匿名）" aria-label="學長姐顯示名稱" /><input value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)} placeholder="畢業／入學年度（可留空）" aria-label="畢業或入學年度" /><input value={admissionScore} onChange={(event) => setAdmissionScore(event.target.value)} placeholder="你當年最低錄取（可留空）" aria-label="當年最低錄取成績" /></div><textarea className="mt-3 min-h-28 w-full" value={content} onChange={(event) => setContent(event.target.value)} placeholder="例如：課程、老師、社團、通勤或你覺得適合什麼樣的學生…" aria-label="學長姐分享內容" /><label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />我確認這是個人經驗，同意以非官方學長姐分享公開。</label><button type="button" onClick={submit} disabled={submitting} className="mt-4 px-4 py-3 text-sm jshs-button-primary">{submitting ? "送出中…" : "送出分享"}</button>{status ? <p className="mt-3 text-sm font-bold text-[var(--jshs-primary)]" role="status">{status}</p> : null}</div></div>
  </div>;
}
