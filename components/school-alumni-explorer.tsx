"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Review = Readonly<{
  id: string;
  district: string;
  school_code: string;
  school_name: string;
  nickname: string;
  graduation_year: string;
  admission_score: string;
  content: string;
  created_at: string;
}>;

export function SchoolAlumniExplorer({ districtOptions, initialDistrict = "all" }: { districtOptions: readonly { code: string; label: string }[]; initialDistrict?: string }) {
  const [reviews, setReviews] = useState<readonly Review[]>([]);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(initialDistrict || "all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/school-reviews", { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`school_reviews_${response.status}`);
        return response.json() as Promise<{ reviews?: Review[] }>;
      })
      .then((payload) => {
        if (!active) return;
        setReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return reviews.filter((review) => {
      const haystack = normalize(`${review.school_name} ${review.school_code} ${review.content} ${review.nickname}`);
      return (!needle || haystack.includes(needle)) && (district === "all" || review.district === district);
    });
  }, [district, query, reviews]);

  const districtLabels = useMemo(() => new Map(districtOptions.map((option) => [option.code, option.label])), [districtOptions]);

  return <>
    <section className="border-b jshs-hero-section"><div className="mx-auto w-[min(1180px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">學長姐分享</p><h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">先聽過來人的真實經驗，再看分數。</h1><p className="mt-5 max-w-3xl text-lg leading-8 jshs-muted-copy">這裡集中顯示使用者留下的非官方經驗，包括當年最低錄取與對學校的看法；每一則都只是個人經驗，不能取代當年度官方公告。</p></div></section>
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 md:py-12">
      <div className="grid gap-4 p-5 jshs-surface-card md:grid-cols-[1fr_220px] md:p-7"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">搜尋學校或分享內容<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：中科實驗、通勤、課程" /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => setDistrict(event.target.value)}><option value="all">全部就學區</option>{districtOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><span className="jshs-chip">目前 {filtered.length} 則分享</span><span className="text-xs leading-5 text-slate-500">非官方內容，請自行核對年度與校科。</span></div>
      {loading ? <div className="mt-6 p-8 text-center jshs-surface-card">正在載入學長姐分享…</div> : null}
      {loadError ? <div className="mt-6 p-8 text-center jshs-surface-card"><h2 className="text-xl">分享暫時無法載入</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">請稍後重新整理；你仍可從學校詳情頁查看官方歷年資料。</p></div> : null}
      {!loading && !loadError && filtered.length ? <div className="mt-7 grid gap-4 lg:grid-cols-2">{filtered.map((review) => <article key={review.id} className="p-5 jshs-surface-card"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black tracking-[.12em] text-[var(--jshs-primary)]">{districtLabels.get(review.district) || review.district} · {review.school_code}</p><h2 className="mt-2 text-xl font-black">{review.school_name}</h2></div><span className="jshs-chip">非官方分享</span></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="jshs-chip">{review.nickname || "匿名學長姐"}</span>{review.graduation_year ? <span className="jshs-chip">{review.graduation_year} 畢業</span> : null}{review.admission_score ? <span className="jshs-chip">最低錄取：{review.admission_score}</span> : null}</div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{review.content}</p><Link className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]" href={`/schools/${review.district}/${review.school_code}#alumni`}>查看學校詳情並留下分享 →</Link></article>)}</div> : null}
      {!loading && !loadError && !filtered.length ? <div className="mt-6 rounded-2xl border border-dashed border-[var(--jshs-border)] p-8 text-center"><h2 className="text-xl font-black">目前還沒有符合條件的公開分享</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">可以先查找學校，進入詳情頁的「學長姐分享」留下自己的經驗。</p><Link className="mt-5 inline-block px-4 py-3 text-sm jshs-button-primary" href="/schools">開始查學校</Link></div> : null}
    </section>
  </>;
}

function normalize(value: string) {
  return value.replace(/臺/g, "台").trim().toLocaleLowerCase("zh-TW");
}
