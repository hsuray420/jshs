"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAdmissionRule, isAdmissionCalculatorAvailable, type AdmissionDistrict } from "@/lib/admission-score";
import { SourceBadge } from "@/components/source-badge";
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
  return <ScoreShell eyebrow="成績歷史紀錄" title="每一次試算都留下年度與規則版本。"><section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm leading-6 jshs-muted-copy">只保存在目前瀏覽器，不會把成績上傳到公開頁面。</p><button type="button" onClick={clearHistory} className="px-4 py-2 text-sm jshs-button-secondary">清除本機紀錄</button></div>{history.length ? <div className="grid gap-3">{history.map((item) => <article key={`${item.savedAt}-${item.district}`} className="flex flex-wrap items-center justify-between gap-4 p-5 jshs-surface-card"><div><p className="text-sm font-black text-[var(--jshs-primary)]">{item.result.rule.label} · {SERVICE_YEAR} 學年度</p><p className="mt-1 text-xs jshs-muted-copy">規則來源 {item.sourceAcademicYear || SOURCE_ACADEMIC_YEAR} 學年度 · {new Date(item.savedAt).toLocaleString("zh-TW")}</p></div><div className="text-right"><strong className="block text-3xl text-[var(--jshs-primary)]">{item.result.totalScore}</strong><span className="text-xs jshs-muted-copy">滿分 {item.result.rule.totalScore}</span></div></article>)}</div> : <EmptyScoreState text="還沒有歷史紀錄。" />}</section></ScoreShell>;
}

export function ScorePlacementWorkspace({ isMember }: { isMember: boolean }) {
  const [latest, setLatest] = useState<SavedScore | null>(null);
  useSavedScore(setLatest, isMember);
  const [districtState, setDistrictState] = useState<AdmissionDistrict>("ct");
  const [districtTouched, setDistrictTouched] = useState(false);
  const [mockScore, setMockScore] = useState("");
  const [history, setHistory] = useState<PlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const district = !districtTouched && latest?.district && isAdmissionDistrict(latest.district) ? latest.district : districtState;
  useEffect(() => {
    let active = true;
    fetch("/it_hs/admission-history.json", { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("admission_history_unavailable");
        return response.json() as Promise<{ schools?: PlacementRecord[] }>;
      })
      .then((payload) => {
        if (!active) return;
        setHistory(Array.isArray(payload.schools) ? payload.schools.filter((school) => school.sourceType === "community") : []);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadToken]);

  const rule = getAdmissionRule(district);
  const score = parseScore(mockScore, latest?.district === district ? latest.result.totalScore : undefined, rule.totalScore);
  const groups = useMemo(() => score === null ? null : buildPlacementGroups(history.filter((school) => school.districtCode === district), score), [district, history, score]);
  const unavailable = !isAdmissionCalculatorAvailable(district);
  return <ScoreShell eyebrow="模擬考落點" title="用模擬考結果整理可討論的校科範圍。"><section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12"><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><section className="p-6 jshs-surface-card"><p className="jshs-eyebrow">輸入推估條件</p><h2 className="mt-2 text-2xl font-black">先輸入模擬考總分</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">只會使用你輸入的分數與可回查的歷年資料；未提供同量尺數字的資料不會被硬套成落點。</p><label className="mt-5 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">就學區<select value={district} onChange={(event) => { setDistrictTouched(true); setDistrictState(event.target.value as AdmissionDistrict); setMockScore(""); }}><option value="ct">中投區</option><option value="tp">基北區</option><option value="ilan">宜蘭區</option><option value="taoyuan-lienchiang">桃連區</option><option value="hsinchu-miaoli">竹苗區</option><option value="changhua">彰化區</option><option value="yunlin">雲林區</option><option value="kaohsiung">高雄區</option></select></label><label className="mt-4 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">模擬考總分（最高 {rule.totalScore} 分）<input type="number" min="0" max={rule.totalScore} inputMode="decimal" value={mockScore} onChange={(event) => setMockScore(event.target.value)} placeholder={latest?.district === district ? `沿用最近一次 ${latest.result.totalScore} 分` : "輸入分數"} /></label>{unavailable ? <p className="mt-4 rounded-2xl border border-dashed border-[var(--jshs-border)] p-4 text-sm leading-6 text-slate-600">此區目前可依選定區域規則建立分數推估。</p> : null}<div className="mt-5 flex flex-wrap gap-3"><Link href={`/tools?district=${district}`} className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">回到正式試算</Link><Link href={`/schools?district=${district}`} className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">查看該區校科</Link></div></section><section className="p-6 jshs-surface-card"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="jshs-eyebrow">JSHS 推估</p><h2 className="mt-2 text-2xl font-black">推估結果</h2></div><SourceBadge sourceType="jshs_estimated" /></div>{loading ? <div className="mt-5 grid gap-3"><div className="h-20 animate-pulse rounded-2xl bg-[var(--jshs-muted-surface)]" /><div className="h-20 animate-pulse rounded-2xl bg-[var(--jshs-muted-surface)]" /></div> : loadError ? <div className="mt-5 rounded-2xl border border-dashed border-[var(--jshs-border)] p-5"><p className="text-sm leading-6 text-slate-600">歷年參考資料暫時無法載入，沒有產生推估結果。</p><button type="button" onClick={() => { setLoadError(false); setLoading(true); setReloadToken((value) => value + 1); }} className="mt-4 min-h-11 px-4 py-3 text-sm jshs-button-primary">重新載入資料</button></div> : unavailable ? <EmptyPlacement text="此區目前沒有足夠歷年資料，暫不產生推估。" /> : score !== null && groups ? <PlacementResult groups={groups} score={score} district={district} /> : <EmptyPlacement text="輸入模擬考總分後，這裡會列出挑戰、適中、穩定三組可參考校科。" />}</section></div><div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950"><strong>不確定性與資料限制</strong><ul className="mt-2 grid gap-1"><li>這是 JSHS 推估，不是官方錄取結果、當年度門檻或錄取保證。</li><li>歷年資料屬社群資料，年度、量尺與樣本可能不同；沒有可比較數字的校科只會保留在「需人工核對」清單。</li><li>116 學年度正式規則與招生名額尚待公告；目前服務暫依 {SOURCE_ACADEMIC_YEAR} 學年度來源。</li></ul></div></section></ScoreShell>;
}

type PlacementRecord = Readonly<{ districtCode: string; districtLabel: string; code: string; name: string; program?: string; city?: string; area?: string; referenceScore?: string; scoreYear?: string; sourceType?: string }>;
type PlacementGroups = Readonly<{ challenge: readonly PlacementRecord[]; balanced: readonly PlacementRecord[]; stable: readonly PlacementRecord[]; unclassified: readonly PlacementRecord[] }>;

function isAdmissionDistrict(value: string): value is AdmissionDistrict {
  return ["tp", "ct", "ilan", "taoyuan-lienchiang", "hsinchu-miaoli", "changhua", "yunlin", "chiayi", "tainan", "kaohsiung", "pingtung", "hualien", "taitung", "penghu", "kinmen"].includes(value);
}

function parseScore(value: string, fallback: number | undefined, max: number) {
  const parsed = value.trim() === "" ? fallback : Number(value);
  return typeof parsed === "number" && Number.isFinite(parsed) && parsed >= 0 && parsed <= max ? parsed : null;
}

function buildPlacementGroups(records: readonly PlacementRecord[], score: number): PlacementGroups {
  const classified = records.flatMap((school) => {
    const reference = parseComparableReference(school.referenceScore);
    return reference === null ? [] : [{ school, reference }];
  });
  const unique = classified.filter(({ school }, index) => classified.findIndex((item) => item.school.code === school.code) === index);
  return {
    challenge: unique.filter(({ reference }) => reference > score + 3).sort((a, b) => a.reference - b.reference).slice(0, 8).map(({ school }) => school),
    balanced: unique.filter(({ reference }) => Math.abs(reference - score) <= 3).sort((a, b) => Math.abs(a.reference - score) - Math.abs(b.reference - score)).slice(0, 8).map(({ school }) => school),
    stable: unique.filter(({ reference }) => reference < score - 3).sort((a, b) => b.reference - a.reference).slice(0, 8).map(({ school }) => school),
    unclassified: records.filter((school) => parseComparableReference(school.referenceScore) === null).slice(0, 8),
  };
}

function parseComparableReference(value: string | undefined) {
  if (!value || !/^\s*\d+(?:\.\d+)?\s*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function PlacementResult({ groups, score, district }: { groups: PlacementGroups; score: number; district: AdmissionDistrict }) {
  return <div className="mt-5"><p className="text-sm leading-6 jshs-muted-copy">以 {score} 分為基準的初步區間；只有與輸入分數同量尺且為單一數字的歷年資料才會分組。</p><div className="mt-4 grid gap-4 md:grid-cols-3"><PlacementGroup title="挑戰" description="參考數字高於目前輸入分數。" schools={groups.challenge} district={district} /><PlacementGroup title="適中" description="參考數字接近目前輸入分數。" schools={groups.balanced} district={district} /><PlacementGroup title="穩定" description="參考數字低於目前輸入分數。" schools={groups.stable} district={district} /></div>{groups.unclassified.length ? <details className="mt-4 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><summary className="cursor-pointer font-black">需人工核對的可參考校科（{groups.unclassified.length}）</summary><ul className="mt-3 grid gap-2 text-sm">{groups.unclassified.map((school) => <li key={school.code}><Link className="font-bold text-[var(--jshs-primary)]" href={`/schools/${school.districtCode}/${school.code}`}>{school.name}</Link><span className="ml-2 text-slate-500">歷年資料：{school.referenceScore || "未標示"}</span></li>)}</ul></details> : null}</div>;
}

function PlacementGroup({ title, description, schools, district }: { title: string; description: string; schools: readonly PlacementRecord[]; district: AdmissionDistrict }) {
  return <section className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><h3 className="text-xl font-black">{title} <span className="text-sm font-normal text-slate-500">{schools.length}</span></h3><p className="mt-2 text-xs leading-5 jshs-muted-copy">{description}不代表錄取保證。</p><div className="mt-3 grid gap-2">{schools.map((school) => <Link key={school.code} href={`/schools/${district}/${school.code}`} className="rounded-xl bg-white p-3"><strong className="block">{school.name}</strong><span className="mt-1 block text-xs text-slate-500">歷年參考 {school.referenceScore} · {school.scoreYear || "年度未標示"}</span></Link>)}{!schools.length ? <p className="rounded-xl bg-white p-3 text-sm text-slate-500">目前沒有可用的同量尺數字資料。</p> : null}</div></section>;
}

function EmptyPlacement({ text }: { text: string }) { return <div className="mt-5 rounded-2xl border border-dashed border-[var(--jshs-border)] p-6 text-sm leading-7 jshs-muted-copy">{text}</div>; }

function ScoreShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">算成績</p><h1 className="mt-3 max-w-4xl">{title}</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">{eyebrow}使用瀏覽器中的試算資料，保留年度、就學區與來源限制，方便下一步核對。</p></div></section><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-8"><p className="jshs-eyebrow">{eyebrow}</p>{children}</div></>;
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
