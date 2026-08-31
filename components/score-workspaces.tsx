"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdmissionRule, type AdmissionDistrict } from "@/lib/admission-score";
import { SERVICE_YEAR, SOURCE_ACADEMIC_YEAR } from "@/lib/trust";

type SavedScore = {
  savedAt: string;
  district: AdmissionDistrict;
  academicYear: string;
  sourceAcademicYear?: string;
  result: {
    totalScore: number;
    otherItems: Record<string, number>;
    exam: { examPerformanceScore: number; examTotalPoints: number };
    rule: ReturnType<typeof getAdmissionRule>;
    perChoiceResults?: Array<{ choiceSequence: number; preferenceScore: number; totalScore: number }>;
  };
};

export function ScoreSummaryWorkspace({ isMember }: { isMember: boolean }) {
  const [latest, setLatest] = useState<SavedScore | null>(null);
  useSavedScore(setLatest, isMember);
  return <ScoreShell eyebrow="個人積分摘要" title="把最近一次試算，整理成可核對的摘要。"><ScoreState latest={latest} empty="還沒有完成的試算。先輸入一次成績，這裡會自動保存最近結果。" /></ScoreShell>;
}

export function ScoreHistoryWorkspace({ isMember }: { isMember: boolean }) {
  const [history, setHistory] = useState<SavedScore[]>([]);
  useScoreHistory(setHistory, isMember);
  function clearHistory() {
    window.localStorage.removeItem("jshs_score_history");
    window.localStorage.removeItem("jshs_score_latest");
    setHistory([]);
  }
  return <ScoreShell eyebrow="成績歷史紀錄" title="每一次試算都留下年度與規則版本。"><section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm leading-6 jshs-muted-copy">未登入時，試算紀錄只保存在這台裝置，不會公開。</p><button type="button" onClick={clearHistory} className="px-4 py-2 text-sm jshs-button-secondary">清除本機紀錄</button></div>{history.length ? <div className="grid gap-3">{history.map((item) => <article key={`${item.savedAt}-${item.district}`} className="flex flex-wrap items-center justify-between gap-4 p-5 jshs-surface-card"><div><p className="text-sm font-black text-[var(--jshs-primary)]">{item.result.rule.label} · {SERVICE_YEAR} 學年度</p><p className="mt-1 text-xs jshs-muted-copy">規則來源 {item.sourceAcademicYear || SOURCE_ACADEMIC_YEAR} 學年度 · {new Date(item.savedAt).toLocaleString("zh-TW")}</p></div><div className="text-right"><strong className="block text-3xl text-[var(--jshs-primary)]">{item.result.totalScore}</strong><span className="text-xs jshs-muted-copy">滿分 {item.result.rule.totalScore}</span></div></article>)}</div> : <EmptyScoreState text="還沒有歷史紀錄。" />}</section></ScoreShell>;
}

export function ScorePlacementWorkspace({ isMember }: { isMember: boolean }) {
  const [latest, setLatest] = useState<SavedScore | null>(null);
  useSavedScore(setLatest, isMember);
  const district = latest?.district && isAdmissionDistrict(latest.district) ? latest.district : "ct";
  const rule = getAdmissionRule(district);
  return <ScoreShell eyebrow="模擬考落點" title="目前不提供落點預測。"><section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><section className="p-6 jshs-surface-card"><p className="jshs-eyebrow">目前資料情境</p><h2 className="mt-2 text-2xl font-black">{rule.label}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">{latest?.district === district ? "你的積分資料已載入；它可用於整理志願，但不會被轉成錄取預測。" : "可先完成積分試算，再用校科探索整理選項。"}</p><div className="mt-5 flex flex-wrap gap-3"><Link href={`/tools?district=${district}`} className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">回到正式試算</Link><Link href={`/schools/history?district=${district}`} className="min-h-11 px-4 py-3 text-sm jshs-button-primary">查看歷史參考資料</Link></div></section><section className="p-6 jshs-surface-card"><p className="jshs-eyebrow">資料不足</p><h2 className="mt-2 text-2xl font-black">目前資料不足，無法提供可信的落點判斷</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">目前沒有可用來建立或驗證預測模型的完整資料，因此不會顯示任何預測分組或錄取傾向。</p><ul className="mt-5 grid gap-2 text-sm leading-6 text-slate-700"><li>缺少可比較年度與跨年度 normalization。</li><li>缺少可驗證來源與完整校科資料。</li><li>缺少模型版本、confidence 方法與 validation result。</li><li>缺少完整 15 區覆蓋。</li></ul><p className="mt-5 rounded-xl bg-[var(--jshs-muted-surface)] p-4 text-sm leading-6 jshs-muted-copy">歷史資料 ≠ 今年錄取預測。可閱讀已分區標示的歷史參考資料，但不應用它推斷錄取機率。</p></section></div></section></ScoreShell>;
}

function isAdmissionDistrict(value: string): value is AdmissionDistrict {
  return ["tp", "ct", "ilan", "taoyuan-lienchiang", "hsinchu-miaoli", "changhua", "yunlin", "chiayi", "tainan", "kaohsiung", "pingtung", "hualien", "taitung", "penghu", "kinmen"].includes(value);
}


function ScoreShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">算成績</p><h1 className="mt-3 max-w-4xl">{title}</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">{eyebrow}會保留年度、就學區與資料來源，方便下一步核對。</p></div></section><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><p className="jshs-eyebrow">{eyebrow}</p>{children}</div></>;
}

function ScoreState({ latest, empty }: { latest: SavedScore | null; empty: string }) {
  if (!latest) return <EmptyScoreState text={empty} />;
  const rows = latest.result.rule.categories.map((item) => [item.label, latest.result.otherItems[item.key] ?? 0, item.max]);
  return <section className="mt-5"><div className="flex flex-wrap items-end gap-4 p-6 jshs-surface-card"><div><span className="block text-sm jshs-muted-copy">目前總分</span><strong className="mt-1 block text-5xl text-[var(--jshs-primary)]">{latest.result.totalScore}</strong></div><span className="pb-2 text-sm jshs-muted-copy">滿分 {latest.result.rule.totalScore} · {latest.result.rule.label}</span></div><div className="mt-5 overflow-x-auto"><table><thead><tr><th>項目</th><th>目前</th><th>上限</th></tr></thead><tbody>{rows.map(([label, score, cap]) => <tr key={String(label)}><th>{label}</th><td>{score}</td><td>{cap}</td></tr>)}<tr><th>國中教育會考</th><td>{latest.result.exam.examPerformanceScore}</td><td>{latest.result.rule.categories.find((item) => item.key === "examPerformanceScore")?.max ?? 0}</td></tr></tbody></table></div><div className="mt-6 flex flex-wrap gap-3"><Link className="px-4 py-3 text-sm jshs-button-primary" href="/tools">重新試算</Link><Link className="px-4 py-3 text-sm jshs-button-secondary" href="/tools/history">查看歷史</Link></div></section>;
}

function EmptyScoreState({ text }: { text: string }) { return <div className="mt-5 p-6 jshs-surface-card"><p className="text-sm leading-7 jshs-muted-copy">{text}</p><Link className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary" href="/tools">開始試算 →</Link></div>; }

function useSavedScore(setValue: (value: SavedScore | null) => void, isMember: boolean) {
  useEffect(() => {
    if (isMember) {
      fetch("/api/admission/scores", { headers: { accept: "application/json" } })
        .then((response) => response.ok ? response.json() as Promise<{ snapshots?: MemberScoreSnapshot[] }> : { snapshots: [] })
        .then((payload) => setValue(parseMemberScore(payload.snapshots)?.[0] || null))
        .catch(() => setValue(null));
      return;
    }
    try {
      const history = JSON.parse(window.localStorage.getItem("jshs_score_history") || "[]") as SavedScore[];
      setValue(history[0] || JSON.parse(window.localStorage.getItem("jshs_score_latest") || "null"));
    } catch { setValue(null); }
  }, [isMember, setValue]);
}

function useScoreHistory(setValue: (value: SavedScore[]) => void, isMember: boolean) {
  useEffect(() => {
    if (isMember) {
      fetch("/api/admission/scores", { headers: { accept: "application/json" } })
        .then((response) => response.ok ? response.json() as Promise<{ snapshots?: MemberScoreSnapshot[] }> : { snapshots: [] })
        .then((payload) => setValue(parseMemberScore(payload.snapshots) || []))
        .catch(() => setValue([]));
      return;
    }
    try {
      const history = JSON.parse(window.localStorage.getItem("jshs_score_history") || "[]") as SavedScore[];
      setValue(Array.isArray(history) ? history : []);
    } catch { setValue([]); }
  }, [isMember, setValue]);
}

type MemberScoreSnapshot = { district: string; academic_year: string; total_score: number; result_json: string; created_at: string };
function parseMemberScore(snapshots: readonly MemberScoreSnapshot[] | undefined) {
  return (snapshots || []).flatMap((snapshot) => {
    try {
      const result = JSON.parse(snapshot.result_json) as SavedScore["result"];
      return [{ savedAt: snapshot.created_at, district: snapshot.district as AdmissionDistrict, academicYear: SERVICE_YEAR, sourceAcademicYear: snapshot.academic_year, result }];
    } catch { return []; }
  });
}
