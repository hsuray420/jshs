"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { analyzePlannerHealth, type PlannerHealthCheck } from "@/lib/planner-health";
import type { RecommendationSchool } from "@/lib/planner-recommendation";
import { markProgress } from "@/lib/progress";
import { getAdmissionChoiceLimit, getAdmissionRule } from "@/lib/admission-score";
import { getDistrictLabel } from "@/lib/district-context";

type PlannerItem = { id: string; district: string; school_code: string; school_name: string; department: string; tier: string; notes: string; created_at: string };
type PlannerItemMeta = { notes?: string };
type PlannerState = { order?: string[]; itemMeta?: Record<string, PlannerItemMeta> };

export function PlannerModeWorkspace({ mode, schools, isMember, initialScore, initialDistrict }: { mode: "recommend" | "custom"; schools: readonly RecommendationSchool[]; isMember: boolean; initialScore?: number; initialDistrict?: string }) {
  const [score, setScore] = useState<number | null>(initialScore ?? null);
  const [district, setDistrict] = useState<string | null>(initialDistrict ?? null);
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [plannerState, setPlannerState] = useState<PlannerState>({ order: [] });
  const [message, setMessage] = useState("");
  const [analysisReady, setAnalysisReady] = useState(false);
  const [savingAnalysis, setSavingAnalysis] = useState(false);

  useEffect(() => {
    if (isMember) {
      fetch("/api/admission/scores", { headers: { accept: "application/json" } })
        .then((response) => response.ok ? response.json() as Promise<{ snapshots?: MemberScoreSnapshot[] }> : { snapshots: [] })
        .then((payload) => {
          const latest = payload.snapshots?.[0];
          if (!latest) return;
          setScore(typeof latest.total_score === "number" ? latest.total_score : null);
          setDistrict(typeof latest.district === "string" ? latest.district : null);
        })
        .catch(() => undefined);
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        const latest = JSON.parse(window.localStorage.getItem("jshs_score_latest") || "null") as { district?: string; result?: { totalScore?: number } } | null;
        if (typeof latest?.result?.totalScore === "number") setScore(latest.result.totalScore);
        if (typeof latest?.district === "string") setDistrict(latest.district);
      } catch {
        // The query-string handoff remains available when local storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialDistrict, initialScore, isMember]);

  useEffect(() => {
    if (!isMember) return;
    Promise.all([
      fetch("/api/planner").then((response) => response.json() as Promise<{ items?: PlannerItem[] }>),
      fetch("/api/planner/state").then((response) => response.json() as Promise<{ state?: PlannerState }>),
    ]).then(([itemsPayload, statePayload]) => {
      const nextState = statePayload.state || { order: [] };
      const nextItems = itemsPayload.items || [];
      setPlannerState(nextState);
      setItems(sortItems(nextItems, nextState));
    }).catch(() => setMessage("目前無法讀取已保存的志願。"));
  }, [isMember]);

  const districtSchools = useMemo(() => district ? schools.filter((school) => school.district === district) : schools, [district, schools]);
  if (score === null && mode === "recommend") return <Gate />;
  if (mode === "recommend") return <DiscoveryView schools={districtSchools} savedItems={items} score={score as number} message={message} onAdd={addItem} />;
  return <CustomView schools={districtSchools} isMember={isMember} score={score} items={items} plannerState={plannerState} message={message} analysisReady={analysisReady} savingAnalysis={savingAnalysis} onAdd={addItem} onMove={moveItem} onReorder={reorderItem} onDelete={deleteItem} onClear={clearItems} onSaveNotes={saveNotes} onSaveAndAnalyze={saveAndAnalyze} />;

  async function saveState(next: PlannerState, createVersion = false) {
    setPlannerState(next);
    if (!isMember) return false;
    const response = await fetch("/api/planner/state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: next, createVersion }) }).catch(() => null);
    if (!response?.ok) setMessage("變更已暫存於畫面，但同步失敗，請稍後再試。");
    return Boolean(response?.ok);
  }

  async function addItem(school: RecommendationSchool, tier = "balanced") {
    const limit = getAdmissionChoiceLimit(district || school.district);
    if (items.length >= limit) {
      setMessage(`目前${getDistrictLabel(district || school.district)}最多可填 ${limit} 個志願，請先刪除或調整現有志願。`);
      return;
    }
    if (items.some((item) => item.district === (school.district || district || "") && item.school_code === school.code && item.department === (school.department || ""))) {
      setMessage(`${school.name} 已在你的志願清單中。`);
      return;
    }
    if (!isMember) {
      const item = { id: crypto.randomUUID(), district: school.district || "", school_code: school.code, school_name: school.name, department: school.department || "", tier, notes: "", created_at: new Date().toISOString() };
      const nextItems = [...items, item];
      const nextState = { ...plannerState, order: [...(plannerState.order || []), item.id] };
      setItems(sortItems(nextItems, nextState));
      markProgress("planner");
      setAnalysisReady(false);
      setMessage("已加入志願清單。完成排序後，請按「儲存並分析」建立版本。");
      return;
    }
    const response = await fetch("/api/planner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ schoolName: school.name, schoolCode: school.code, district: school.district || "", department: school.department || "", tier }) }).catch(() => null);
    if (!response?.ok) { setMessage("加入失敗，請確認已登入。 "); return; }
    const payload = await response.json() as { item?: PlannerItem };
    if (payload.item) {
      if (items.some((candidate) => candidate.district === payload.item?.district && candidate.school_code === payload.item?.school_code && candidate.department === payload.item?.department)) {
        setMessage(`${payload.item.school_name} 已在你的志願清單中。`);
        return;
      }
      const nextItems = [...items, payload.item];
      const nextState = { ...plannerState, order: [...(plannerState.order || []), payload.item.id] };
      setItems(sortItems(nextItems, nextState));
      await saveState(nextState);
      markProgress("planner");
      setAnalysisReady(false);
      setMessage("已加入志願清單。完成排序後，請按「儲存並分析」建立版本。");
    }
  }

  async function moveItem(index: number, direction: -1 | 1) {
    const current = sortItems(items, plannerState);
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    await reorder(current[index].id, target, current);
  }

  async function reorderItem(itemId: string, targetIndex: number) {
    await reorder(itemId, targetIndex, sortItems(items, plannerState));
  }

  async function reorder(itemId: string, targetIndex: number, current: PlannerItem[]) {
    const fromIndex = current.findIndex((item) => item.id === itemId);
    if (fromIndex < 0 || targetIndex < 0 || targetIndex >= current.length || fromIndex === targetIndex) return;
    const nextItems = [...current];
    const [moved] = nextItems.splice(fromIndex, 1);
    nextItems.splice(targetIndex, 0, moved);
    const nextState = { ...plannerState, order: nextItems.map((item) => item.id) };
    setItems(nextItems);
    await saveState(nextState);
    setAnalysisReady(false);
    setMessage("志願順序已更新。完成後請按「儲存並分析」建立版本與執行健檢。");
  }

  async function saveNotes(itemId: string, notes: string) {
    const nextState = { ...plannerState, itemMeta: { ...(plannerState.itemMeta || {}), [itemId]: { ...(plannerState.itemMeta?.[itemId] || {}), notes: notes.slice(0, 1000) } } };
    await saveState(nextState);
  }

  async function deleteItem(item: PlannerItem) {
    if (isMember) {
      const response = await fetch("/api/planner", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id }) }).catch(() => null);
      if (!response?.ok) { setMessage("刪除失敗，請稍後再試。"); return; }
    }
    const nextItems = items.filter((candidate) => candidate.id !== item.id);
    const nextState = { ...plannerState, order: (plannerState.order || []).filter((id) => id !== item.id) };
    setItems(sortItems(nextItems, nextState));
    if (isMember) await saveState(nextState);
    setAnalysisReady(false);
    setMessage("已從志願清單移除。完成後請按「儲存並分析」建立版本。");
  }

  async function clearItems() {
    const current = sortItems(items, plannerState);
    if (isMember) await Promise.all(current.map((item) => fetch("/api/planner", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id }) })));
    const nextState = { ...plannerState, order: [], itemMeta: {} };
    setItems([]);
    await saveState(nextState);
    setAnalysisReady(false);
    setMessage("已清空志願清單。");
  }

  async function saveAndAnalyze() {
    const current = sortItems(items, plannerState);
    if (!isMember) {
      setMessage("儲存志願、建立版本與分析需要登入 LINE 會員。 ");
      return;
    }
    if (!current.length) {
      setMessage("請先加入至少一所學校，再儲存並分析。 ");
      return;
    }
    setSavingAnalysis(true);
    const saved = await saveState(plannerState, true);
    if (!saved) {
      setSavingAnalysis(false);
      return;
    }
    if (isMember) {
      const response = await fetch("/api/planner/finalize", { method: "POST" }).catch(() => null);
      if (!response?.ok) {
        setSavingAnalysis(false);
        setMessage("版本已建立，但目前無法完成確認通知；請稍後再試。 ");
        return;
      }
    }
    setSavingAnalysis(false);
    setAnalysisReady(true);
    setMessage("已保存版本並完成規則健檢。你可以查看版本紀錄，或請 AI 協助讀懂健檢結果。");
  }
}

type MemberScoreSnapshot = { district: string; total_score: number; created_at: string };

function sortItems(items: readonly PlannerItem[], state: PlannerState) {
  const order = new Map((state.order || []).map((id, index) => [id, index]));
  return [...items].sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.created_at.localeCompare(b.created_at));
}

function Gate() { return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-12"><div className="max-w-2xl p-6 jshs-surface-card"><p className="jshs-eyebrow">需要先試算</p><h1 className="mt-2 text-2xl">先完成一次成績試算，才能開始志願探索。</h1><p className="mt-3 text-sm leading-7 jshs-muted-copy">積分資料會保留在你的規劃中，但本站目前不會用它預測錄取結果。</p><Link href="/tools" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">前往試算成績 →</Link></div></section>; }

function DiscoveryView({ schools, savedItems, score, message, onAdd }: { schools: readonly RecommendationSchool[]; savedItems: readonly PlannerItem[]; score: number; message: string; onAdd: (school: RecommendationSchool, tier: string) => void }) {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState("all");
  const [group, setGroup] = useState("all");
  const [ownership, setOwnership] = useState("all");
  const [commutePreference, setCommutePreference] = useState("all");
  const programs = [...new Set(schools.map((school) => school.program).filter(Boolean))].sort();
  const groups = [...new Set(schools.flatMap((school) => school.groups || []))].sort();
  const saved = new Set(savedItems.map((item) => item.school_code));
  const filtered = schools.filter((school) => {
    const text = `${school.name} ${school.department || ""} ${(school.groups || []).join(" ")} ${school.city || ""}`.toLocaleLowerCase("zh-TW");
    return (!query.trim() || text.includes(query.trim().toLocaleLowerCase("zh-TW")))
      && (program === "all" || school.program === program)
      && (ownership === "all" || school.ownership === ownership)
      && (group === "all" || school.groups?.includes(group))
      && (commutePreference === "all" || school.city === commutePreference);
  }).slice(0, 60);
  const cities = [...new Set(schools.map((school) => school.city).filter(Boolean))].sort();
  const ownerships = [...new Set(schools.map((school) => school.ownership).filter(Boolean))].sort();
  return <PlannerLayout title="志願探索" intro="先用條件縮小候選學校，再加入志願清單排序；本站不會以積分預測錄取結果。"><div className="rounded-2xl bg-[var(--jshs-brand-tint)] p-5 text-sm leading-7 text-[var(--jshs-primary)]"><strong>你的積分資料已載入：{score} 分</strong><p className="mt-1">積分只用於規則健檢，不會產生錄取傾向或機率標籤。</p></div><section className="mt-5 p-5 jshs-surface-card"><div className="grid gap-3 md:grid-cols-[1fr_.45fr]"><label className="grid gap-2 text-sm font-black">搜尋學校<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="輸入學校名稱、群科或代碼" /></label><label className="grid gap-2 text-sm font-black">學制／類型<select value={program} onChange={(event) => setProgram(event.target.value)}><option value="all">全部類型</option>{programs.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div><details className="jshs-planner-filters"><summary>進階篩選</summary><div className="mt-3 grid gap-3 md:grid-cols-3"><label className="grid gap-2 text-sm font-black">公私立偏好<select value={ownership} onChange={(event) => setOwnership(event.target.value)}><option value="all">不限制</option>{ownerships.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="grid gap-2 text-sm font-black">群科興趣<select value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">全部</option>{groups.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="grid gap-2 text-sm font-black">所在地（縣市）<select value={commutePreference} onChange={(event) => setCommutePreference(event.target.value)}><option value="all">不限制</option>{cities.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div></details></section><section className="mt-5"><p className="jshs-eyebrow">候選學校</p><h2 className="mt-2 text-2xl">符合目前條件的學校</h2><p className="mt-2 text-sm jshs-muted-copy">先顯示 {filtered.length} 筆；加入後可在「自己排」調整順序與儲存分析。</p><div className="mt-4 grid gap-3 md:grid-cols-2">{filtered.map((school) => <SchoolRow key={`${school.code}-${school.department || "all"}`} school={school} discoveryReasons={discoveryReasons(school, group, commutePreference, saved.has(school.code))} action={() => onAdd(school, "balanced")} />)}{!filtered.length ? <p className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">目前沒有符合偏好的學校，請調整搜尋或篩選條件。</p> : null}</div></section>{message ? <p className="mt-4 text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}</PlannerLayout>;
}

function CustomView({ schools, isMember, score, items, plannerState, message, analysisReady, savingAnalysis, onAdd, onMove, onReorder, onDelete, onClear, onSaveNotes, onSaveAndAnalyze }: { schools: readonly RecommendationSchool[]; isMember: boolean; score: number | null; items: readonly PlannerItem[]; plannerState: PlannerState; message: string; analysisReady: boolean; savingAnalysis: boolean; onAdd: (school: RecommendationSchool) => void; onMove: (index: number, direction: -1 | 1) => void; onReorder: (itemId: string, targetIndex: number) => void; onDelete: (item: PlannerItem) => void; onClear: () => void; onSaveNotes: (itemId: string, notes: string) => void; onSaveAndAnalyze: () => void }) {
  const selected = new Set(items.map((item) => item.school_code));
  const orderedItems = sortItems(items, plannerState);
  const district = orderedItems[0]?.district || schools[0]?.district || "ct";
  const rule = getAdmissionRule(district);
  const limit = getAdmissionChoiceLimit(district);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("全部縣市");
  const [program, setProgram] = useState("全部類型");
  const cities = [...new Set(schools.map((school) => school.city || "未標示所在地"))].sort();
  const programs = [...new Set(schools.map((school) => school.program || "未標示類型"))].sort();
  const filtered = schools.filter((school) => !selected.has(school.code) && (!query || `${school.name} ${school.code} ${(school.groups || []).join(" ")}`.toLowerCase().includes(query.toLowerCase())) && (city === "全部縣市" || (school.city || "未標示所在地") === city) && (program === "全部類型" || (school.program || "未標示類型") === program)).slice(0, 12);
  const health = analyzePlannerHealth({ serviceYear: rule.academicYear, district, score: score ?? undefined, choiceLimit: limit, items: orderedItems.map((item) => { const school = schools.find((candidate) => candidate.code === item.school_code); return { id: item.id, schoolCode: item.school_code, department: item.department, tier: item.tier, qualificationStatus: "unknown" as const, hasQuota: school?.hasQuota, hasHistoricalData: school?.hasHistoricalData, hasSchoolCode: Boolean(item.school_code), hasSource: Boolean(school?.sourceName), hasAcademicYear: Boolean(school?.academicYear) }; }) });
  const signInHref = "/api/line/login/start";
  return <PlannerLayout title="我的志願" intro={`目前${rule.label}｜${score === null ? "尚未試算成績" : `試算 ${score} 分`}｜規則來源 ${rule.academicYear} 學年度`}><section className="mx-auto max-w-4xl"><div className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><strong>{rule.label}志願序規則</strong><span className="font-black">已選 {orderedItems.length} / {limit}</span></div><p className="mt-2 text-sm leading-6">{rule.categories.find((item) => item.key === "preferenceScore")?.description || "依本區公告的志願序分段規則計分。"}</p></div><section className="mt-5 p-5 jshs-surface-card"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">加入志願</p><h2 className="mt-1 text-xl">搜尋並加入學校</h2></div><Link href="/planner/recommend" className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">前往志願探索</Link></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><input aria-label="搜尋學校、群科或代碼" placeholder="搜尋學校、群科或代碼" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="縣市篩選" value={city} onChange={(event) => setCity(event.target.value)}><option>全部縣市</option>{cities.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="類型篩選" value={program} onChange={(event) => setProgram(event.target.value)}><option>全部類型</option>{programs.map((value) => <option key={value}>{value}</option>)}</select></div><div className="mt-4 grid gap-3">{filtered.map((school) => <SchoolRow key={`${school.code}-${school.department || "all"}`} school={school} action={() => onAdd(school)} />)}{!filtered.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">找不到符合條件的學校，請調整搜尋條件。</p> : null}</div></section><section className="mt-8"><div className="flex items-center justify-between gap-3"><div><p className="jshs-eyebrow">排序與確認</p><h2 className="mt-1 text-2xl">我的志願</h2></div><button type="button" className="text-sm text-red-700" onClick={() => void onClear()}>清空全部</button></div><p className="mt-2 text-sm leading-6 text-slate-600">第一志願在最上方；可拖曳或使用上下按鈕調整順序。</p><div className="mt-4 grid gap-3">{orderedItems.map((item, index) => <PlannerItemCard key={item.id} item={item} school={schools.find((school) => school.code === item.school_code)} index={index} total={orderedItems.length} notes={plannerState.itemMeta?.[item.id]?.notes || item.notes || ""} onMove={onMove} onReorder={onReorder} onDelete={onDelete} onSaveNotes={onSaveNotes} />)}{!orderedItems.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">尚未加入志願，請先從上方搜尋學校。</p> : null}</div><div className="mt-6 rounded-2xl bg-[var(--jshs-brand-tint)] p-5 text-center"><h3 className="text-lg">完成排序後，再儲存並分析</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">儲存志願、建立版本與規則健檢需要登入 LINE 會員。</p>{isMember ? <button type="button" disabled={!orderedItems.length || savingAnalysis} onClick={() => void onSaveAndAnalyze()} className="mt-4 min-h-11 px-5 py-3 text-sm jshs-button-primary disabled:opacity-50">{savingAnalysis ? "儲存與分析中…" : "儲存並分析"}</button> : <Link href={signInHref} className="mt-4 inline-flex min-h-11 px-5 py-3 text-sm jshs-button-primary">登入 LINE 後儲存並分析</Link>}</div>{analysisReady ? <section className="mt-5 rounded-2xl border border-[var(--jshs-border)] p-5" role="status"><p className="font-black text-[var(--jshs-primary)]">已保存版本</p><p className="mt-2 text-sm leading-6 jshs-muted-copy">規則健檢已完成；它不會預測錄取結果。版本、列印下載與官方選填入口已分開整理。</p><PlannerHealthPanel checks={health} /><div className="mt-4 flex flex-wrap justify-center gap-2"><Link href="/planner/versions" className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">查看版本紀錄</Link><button type="button" className="min-h-11 px-4 py-3 text-sm jshs-button-secondary" onClick={() => document.dispatchEvent(new CustomEvent("jshs:ai-context", { detail: { question: "請協助我讀懂我的志願規則健檢；不要預測錄取結果，請提醒我回查官方資格與選填規則。" } }))}>請 AI 說明健檢</button></div></section> : null}</section></section>{message ? <p className="mx-auto mt-4 max-w-4xl text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}</PlannerLayout>;
}

function PlannerItemCard({ item, school, index, total, notes, onMove, onReorder, onDelete, onSaveNotes }: { item: PlannerItem; school?: RecommendationSchool; index: number; total: number; notes: string; onMove: (index: number, direction: -1 | 1) => void; onReorder: (itemId: string, targetIndex: number) => void; onDelete: (item: PlannerItem) => void; onSaveNotes: (itemId: string, notes: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const draggedItemId = item.id;
  return <article draggable onDragStart={() => setDragging(true)} onDragEnd={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); onReorder(draggedItemId, index); }} className={`rounded-xl bg-white p-4 jshs-surface-card ${dragging ? "opacity-50" : ""}`}><div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--jshs-muted-surface)] font-black">{index + 1}</span><div className="min-w-0 flex-1"><strong className="block">{item.school_name}</strong><span className="text-xs text-slate-500">{[school?.city || (item.district ? getDistrictLabel(item.district) : "所在地待確認"), school?.program || "學制待確認"].join(" · ")}</span></div><Link href={schoolHref(item.district, item.school_code)} className="shrink-0 text-xs font-bold text-[var(--jshs-primary)]">查看學校</Link><button type="button" aria-label={`將 ${item.school_name} 上移`} disabled={index === 0} onClick={() => onMove(index, -1)} className="min-h-11 min-w-11 text-sm text-[var(--jshs-primary)] disabled:opacity-30">↑</button><button type="button" aria-label={`將 ${item.school_name} 下移`} disabled={index === total - 1} onClick={() => onMove(index, 1)} className="min-h-11 min-w-11 text-sm text-[var(--jshs-primary)] disabled:opacity-30">↓</button><button type="button" aria-label={`刪除 ${item.school_name}`} onClick={() => onDelete(item)} className="min-h-11 px-2 text-sm text-red-700">刪除</button></div><label className="mt-3 grid gap-1 text-xs font-bold text-slate-500">備註<textarea defaultValue={notes} maxLength={1000} rows={2} onBlur={(event) => onSaveNotes(item.id, event.currentTarget.value)} placeholder="補充想了解的課程、通勤或家庭討論事項" /></label><p className="mt-2 text-xs text-slate-500">拖曳這張卡片到另一順位即可移動。</p></article>;
}

function PlannerHealthPanel({ checks }: { checks: readonly PlannerHealthCheck[] }) { return <section className="mt-6 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-center justify-between gap-3"><h2 className="text-lg">志願健檢</h2><span className="text-xs jshs-muted-copy">每次變更都會重新檢查</span></div><div className="mt-3 grid gap-2">{checks.map((check) => <details key={check.id} className="rounded-xl bg-white p-3"><summary className="cursor-pointer font-bold"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${check.status === "pass" ? "bg-emerald-500" : check.status === "error" ? "bg-red-500" : check.status === "unknown" ? "bg-slate-400" : "bg-amber-500"}`} />{check.label} <span className="ml-1 text-xs font-normal">{check.status === "pass" ? "通過" : check.status === "error" ? "需修正" : check.status === "unknown" ? "無法判定" : "提醒"}</span></summary><p className="mt-2 text-sm leading-6 jshs-muted-copy">{check.detail}</p><Link href={check.actionHref} className="mt-2 inline-flex text-sm font-bold text-[var(--jshs-primary)]">{check.actionLabel} →</Link></details>)}</div></section>; }

function SchoolRow({ school, action, discoveryReasons }: { school: RecommendationSchool; action: () => void; discoveryReasons?: readonly string[] }) { return <div className="flex items-start gap-3 rounded-xl bg-white p-3"><div className="min-w-0 flex-1"><strong className="block">{school.name}</strong><span className="mt-1 block text-xs text-slate-500">{[school.city, school.program].filter(Boolean).join(" · ") || "所在地與學制待確認"}</span>{discoveryReasons ? <ul className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">{discoveryReasons.map((reason) => <li key={reason}>✓ {reason}</li>)}</ul> : null}</div><div className="flex shrink-0 flex-col items-end gap-2"><Link href={schoolHref(school.district, school.code)} className="text-xs font-bold text-[var(--jshs-primary)]">查看學校</Link><button type="button" onClick={action} className="min-h-11 px-3 py-2 text-xs jshs-button-secondary">加入</button></div></div>; }

function discoveryReasons(school: RecommendationSchool, selectedGroup: string, city: string, alreadySaved: boolean) {
  const reasons = ["位於你的就學區", school.program ? `符合「${school.program}」類型` : "學校類型待確認"];
  if (selectedGroup !== "all" && school.groups?.includes(selectedGroup)) reasons.push(`包含「${selectedGroup}」相關群科`);
  else if (school.groups?.length) reasons.push(`包含${school.groups.slice(0, 2).join("、")}群科`);
  if (city !== "all" && school.city === city) reasons.push("符合通勤縣市偏好");
  if (alreadySaved) reasons.push("已加入你的志願清單");
  return reasons;
}
function schoolHref(district = "", code = "") { return district && code ? `/schools/${district}/${code}` : `/schools?q=${encodeURIComponent(code)}`; }
function PlannerActions() { return <div className="mt-5 flex flex-wrap gap-2"><Link href="/planner/recommend" className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">前往志願探索</Link><Link href="/planner/versions" className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">版本紀錄</Link></div>; }

function PlannerLayout({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) { return <><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><p className="jshs-eyebrow">我的志願 · <Link href="/planner">回到我的志願</Link></p><h1 className="mt-3">{title}</h1><p className="mt-3 max-w-3xl text-base leading-7 jshs-muted-copy">{intro}</p><PlannerActions /></div></section><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8">{children}</section></>; }
