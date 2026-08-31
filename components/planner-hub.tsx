"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MemberScoreSnapshot = { total_score?: number };

export function PlannerHub({ isMember }: { isMember: boolean }) {
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    if (isMember) {
      fetch("/api/admission/scores", { headers: { accept: "application/json" } })
        .then((response) => response.ok ? response.json() as Promise<{ snapshots?: MemberScoreSnapshot[] }> : { snapshots: [] })
        .then((payload) => {
          const latest = payload.snapshots?.[0];
          setScore(typeof latest?.total_score === "number" ? latest.total_score : null);
        })
        .catch(() => setScore(null));
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        const latest = JSON.parse(window.localStorage.getItem("jshs_score_latest") || "null") as { result?: { totalScore?: number } } | null;
        setScore(typeof latest?.result?.totalScore === "number" ? latest.result.totalScore : null);
      } catch { setScore(null); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isMember]);
  const hasScore = score !== null;
  return <>
    <section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">我的志願</p><h1 className="mt-3 max-w-3xl">先知道自己的分數，再開始排志願。</h1><p className="mt-4 max-w-2xl text-base leading-7 jshs-muted-copy">流程保留兩種：依偏好探索校科，或自己排序學校並進行健檢。</p></div></section>
    <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 ${hasScore ? "bg-[var(--jshs-muted-surface)]" : "bg-[var(--jshs-brand-tint)]"}`}><div><p className="text-sm font-black text-[var(--jshs-primary)]">必要的第一步</p><h2 className="mt-1 text-xl">{hasScore ? `已完成試算：${score} 分` : "還沒試算成績"}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{hasScore ? "你現在可以探索校科或自己排序志願。" : "填志願前先完成一次積分試算，讓規則與志願序健檢有一致的資料情境。"}</p></div><Link href="/tools" className="px-4 py-3 text-sm jshs-button-primary">{hasScore ? "重新試算成績" : "先去試算成績 →"}</Link></div></section>
    <section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="grid gap-5 md:grid-cols-2"><ModeCard number="01" title="志願探索" body="依就學區、學校類型、群科興趣、通勤與公私立偏好篩選候選校科；每筆都會說明出現原因。" href={hasScore ? "/planner/recommend" : "/tools?return=/planner/recommend"} disabled={!hasScore} action="開始探索" /><ModeCard number="02" title="自己排" body="自己挑學校、調整志願順序；系統會檢查志願上限、資料缺口與規則情境。" href={hasScore ? "/planner/custom" : "/tools?return=/planner/custom"} disabled={!hasScore} action="開始自己排" /></div></section>
  </>;
}

function ModeCard({ number, title, body, href, action, disabled }: { number: string; title: string; body: string; href: string; action: string; disabled: boolean }) { return <article className="flex flex-col p-6 jshs-surface-card"><span className="text-sm font-black text-[var(--jshs-primary)]">{number}</span><h2 className="mt-3 text-2xl">{title}</h2><p className="mt-3 flex-1 text-sm leading-7 jshs-muted-copy">{body}</p><Link href={href} className={`mt-6 inline-flex w-fit px-4 py-3 text-sm ${disabled ? "jshs-button-secondary" : "jshs-button-primary"}`}>{disabled ? "先完成成績試算" : action} →</Link></article>; }
