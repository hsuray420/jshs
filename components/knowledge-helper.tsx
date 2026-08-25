"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useMemo, useState } from "react";

const fallbackTerms = [
  ["超額比序", "當申請人數超過名額時，依招生區公告的項目與順序比較，不是全國共用一張表。"],
  ["序位", "依適用規則與同區申請資料產生的排序位置；本站的試算不能取代正式公告序位。"],
  ["免試入學", "不以單一入學考試分發為唯一依據，而是依各區規則與志願選填辦理。"],
  ["挑戰／適中／穩定", "規劃候選校科的溝通分層，不是錄取保證，也不代表某校一定屬於哪一層。"],
  ["群科", "技術型高中把相近的學習內容分成群科，實際課程仍要看學校與科別的課程資料。"],
] as const;

const quizOptions = ["我喜歡先理解理論，再準備未來升學", "我喜歡動手做、實作與看見作品", "我想保留普高與技職兩種可能"] as const;

export function KnowledgeHelper({ terms = fallbackTerms }: { terms?: readonly (readonly [string, string])[] }) {
  const [query, setQuery] = useState("");
  const [quiz, setQuiz] = useState("");
  const matches = useMemo(() => terms.filter(([title, body]) => `${title} ${body}`.includes(query.trim())), [query, terms]);
  const answer = quiz === quizOptions[0] ? "先比較普通高中與綜合高中，再看你想保留的升學路徑。" : quiz === quizOptions[1] ? "先從十五群科與技高課程探索，再回到學校頁比較實作內容。" : quiz === quizOptions[2] ? "把普高、技高、綜高、五專各保留一組候選，利用我的志願比較。" : "選一個最接近現在的描述，這不是測驗分數，而是開始討論的方向。";
  return <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-10 md:py-14"><div id="名詞百科" className="grid gap-5 lg:grid-cols-[1fr_380px]"><div className="p-6 md:p-8 jshs-surface-card"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">名詞小百科</p><h2 className="mt-2">先看一句話，再決定要不要深讀</h2></div><span className="text-sm jshs-muted-copy">{matches.length} 個詞</span></div><label className="mt-5 block"><span className="sr-only">搜尋名詞</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋：超額比序、群科、序位…" className="w-full" /></label><div className="mt-4 grid gap-2">{matches.map(([title, body]) => <details key={title} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><summary className="cursor-pointer font-black text-[var(--jshs-primary)]">{title}</summary><p className="mt-2 text-sm leading-7 jshs-muted-copy">{body}</p></details>)}{!matches.length ? <p className="p-4 text-sm jshs-muted-copy">找不到詞，試試「序位」或「群科」。</p> : null}</div></div><div id="測驗" className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">學制適合度測驗</p><h2 className="mt-2">不打分，只找方向</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">選一個最接近目前感受的描述：</p><div className="mt-4 grid gap-2">{quizOptions.map((option) => <button key={option} type="button" onClick={() => setQuiz(option)} className={`p-3 text-left text-sm jshs-button ${quiz === option ? "jshs-button-primary" : "jshs-button-secondary"}`}>{option}</button>)}</div><p className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-7 text-[var(--jshs-primary)]">{answer}</p><a href="/schools" className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]">用學校資料驗證這個方向 →</a></div></div></section>;
}
