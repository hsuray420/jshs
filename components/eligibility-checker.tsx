"use client";

import { useMemo, useState } from "react";

const questions = [
  ["specialInterest", "你是否有明確、想透過作品或專長展現的領域？", "特色招生／特色班"],
  ["gifted", "你是否正在接受資優或特殊教育相關支持？", "資優／特殊教育升學路徑"],
  ["crossDistrict", "你是否可能不在目前國中所在區域就讀？", "跨區就學資格判定"],
  ["nonTraditional", "你是否不是一般應屆國中畢業生？", "轉學生／非應屆生規則"],
  ["overseas", "你是否有僑居、境外就學或外籍身分需要確認？", "僑生／境外生說明"],
] as const;

export function EligibilityChecker() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const matched = useMemo(() => questions.filter(([id]) => answers[id]).map(([, , result]) => result), [answers]);

  function setAnswer(id: string, value: boolean) { setAnswers((current) => ({ ...current, [id]: value })); }

  return <section aria-labelledby="eligibility-check-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-10 md:py-14"><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">資格自我檢測</p><h2 id="eligibility-check-title" className="mt-2">先用 5 題找到該查的規則</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">這是「篩選閱讀方向」，不是資格核定。每一題都可以改選，最後仍要以當年度簡章與承辦單位審查為準。</p><div className="mt-6 grid gap-3">{questions.map(([id, question]) => <div key={id} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><strong className="block">{question}</strong><div className="mt-3 flex gap-2">{[[true, "是／可能"], [false, "目前不是"]].map(([value, label]) => <button key={String(value)} type="button" aria-pressed={answers[id] === value} onClick={() => setAnswer(id, value as boolean)} className={`px-3 py-2 text-sm jshs-button ${answers[id] === value ? "jshs-button-primary" : "jshs-button-secondary"}`}>{label}</button>)}</div></div>)}</div></div><aside className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">檢測結果</p><h2 className="mt-2">{matched.length ? `建議先看 ${matched.length} 類` : "先回答左側問題"}</h2>{matched.length ? <div className="mt-5 grid gap-2">{matched.map((item) => <a key={item} href={`#${item}`} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4 text-sm font-black text-[var(--jshs-primary)]">{item} →</a>)}</div> : <p className="mt-4 text-sm leading-7 jshs-muted-copy">回答「是／可能」的項目會出現在這裡，幫你減少一開始要讀的規則數量。</p>}<p className="mt-6 border-t border-[var(--jshs-border)] pt-5 text-xs leading-6 jshs-muted-copy">不確定時請直接向就讀國中承辦人、招生委員會或學校註冊組確認；本站不代替資格審查。</p></aside></div></section>;
}
