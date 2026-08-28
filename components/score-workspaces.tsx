"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const districts: Array<[AdmissionDistrict, string]> = [
  ["tp", "基北區"], ["ilan", "宜蘭區"], ["taoyuan-lienchiang", "桃連區"], ["hsinchu-miaoli", "竹苗區"], ["ct", "中投區"], ["changhua", "彰化區"], ["yunlin", "雲林區"], ["chiayi", "嘉義區"], ["tainan", "臺南區"], ["kaohsiung", "高雄區"], ["pingtung", "屏東區"], ["hualien", "花蓮區"], ["taitung", "臺東區"], ["penghu", "澎湖區"], ["kinmen", "金門區"],
];

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
  return <ScoreShell eyebrow="成績歷史紀錄" title="每一次試算都留下年度與規則版本。"><section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm leading-6 jshs-muted-copy">只保存在目前瀏覽器，不會把成績上傳到公開頁面。</p><button type="button" onClick={clearHistory} className="px-4 py-2 text-sm jshs-button-secondary">清除本機紀錄</button></div>{history.length ? <div className="grid gap-3">{history.map((item) => <article key={`${item.savedAt}-${item.district}`} className="flex flex-wrap items-center justify-between gap-4 p-5 jshs-surface-card"><div><p className="text-sm font-black text-[var(--jshs-primary)]">{item.result.rule.label} · {SERVICE_YEAR} 學年度</p><p className="mt-1 text-xs jshs-muted-copy">規則來源 {item.sourceAcademicYear || SOURCE_ACADEMIC_YEAR} 學年度 · {new Date(item.savedAt).toLocaleString("zh-TW")}</p></div><div className="text-right"><strong className="block text-3xl text-[var(--jshs-primary)]">{item.result.totalScore}</strong><span className="text-xs jshs-muted-copy">滿分 {item.result.rule.totalScore}</span></div></article>)}</div> : <EmptyScoreState text="還沒有歷史紀錄。" />}</section></ScoreShell>;
}

export function ScorePlacementWorkspace({ isMember }: { isMember: boolean }) {
  const [latest, setLatest] = useState<SavedScore | null>(null);
  useSavedScore(setLatest, isMember);
  const band = latest ? placementBand(latest.result.totalScore, latest.result.rule.totalScore) : null;
  return <ScoreShell eyebrow="模擬考先估落點" title="先用分數區間整理挑戰、適中與穩定選項。"><section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12">{latest && band ? <><div className="p-6 jshs-surface-card"><p className="jshs-eyebrow">目前試算分層</p><h2 className="mt-2 text-3xl">{band.label}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">{latest.result.rule.label} · {latest.result.totalScore}／{latest.result.rule.totalScore} 分。這是以目前輸入做的規劃分層，不是錄取機率或正式落點。</p></div><div className="mt-4 grid gap-3 md:grid-cols-3">{["挑戰：高於目前分數的校科", "適中：接近目前分數的校科", "穩定：低於目前分數的校科"].map((label) => <article key={label} className="p-5 jshs-surface-card"><h3>{label.split("：")[0]}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{label.split("：")[1]}，請到學校資料查看來源、年度與參考分數。</p></article>)}</div><Link className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary" href={`/schools?district=${latest.district}`}>依這次結果查校科 →</Link></> : <EmptyScoreState text="先完成一次成績試算，才能建立初步落點分層。" />}</section></ScoreShell>;
}

export function ScoreRulesWorkspace() {
  const [district, setDistrict] = useState<AdmissionDistrict>("ct");
  const rule = useMemo(() => getAdmissionRule(district), [district]);
  return <ScoreShell eyebrow="積分／序位換算說明" title="五個就學區，分開看規則與上限。"><section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><label className="grid max-w-sm gap-2 text-sm font-black text-[var(--jshs-primary)]">選擇就學區<select value={district} onChange={(event) => setDistrict(event.target.value as AdmissionDistrict)}>{districts.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label><div className="mt-5 grid gap-3">{rule.categories.map((item) => <article key={item.key} className="p-5 jshs-surface-card"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl">{item.label}</h2><span className="jshs-chip">上限 {item.max} 分</span></div><p className="mt-2 text-sm leading-7 jshs-muted-copy">{item.description}</p></article>)}</div><p className="mt-5 text-xs leading-6 jshs-muted-copy">{rule.sourceNote}</p></section></ScoreShell>;
}

function ScoreShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">成績工具中心</p><h1 className="mt-3 max-w-4xl">{title}</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">{eyebrow}使用瀏覽器中的試算資料，保留年度、就學區與來源限制，方便下一步核對。</p></div></section><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><p className="jshs-eyebrow">{eyebrow}</p>{children}</div></>;
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
      return [{ savedAt: snapshot.created_at, district: snapshot.district as AdmissionDistrict, academicYear: snapshot.academic_year, result }];
    } catch { return []; }
  });
}

function placementBand(score: number, max: number) {
  const ratio = max ? score / max : 0;
  if (ratio >= 0.85) return { label: "挑戰區間", ratio };
  if (ratio >= 0.7) return { label: "適中區間", ratio };
  return { label: "穩定區間", ratio };
}
