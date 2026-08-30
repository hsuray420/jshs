"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { analyzePlannerHealth, type PlannerHealthCheck } from "@/lib/planner-health";
import { readLocalPlanner, saveLocalPlannerSnapshot, writeLocalPlanner } from "@/lib/planner-local";
import { buildPlannerRecommendations, type RecommendationSchool } from "@/lib/planner-recommendation";
import { markProgress } from "@/lib/progress";
import { getAdmissionChoiceLimit, getAdmissionRule } from "@/lib/admission-score";
import { getDistrictLabel } from "@/lib/district-context";

type PlannerItem = { id: string; district: string; school_code: string; school_name: string; department: string; tier: string; notes: string; created_at: string };
type PlannerItemMeta = { notes?: string };
type PlannerState = { order?: string[]; itemMeta?: Record<string, PlannerItemMeta> };

export function PlannerModeWorkspace({ mode, schools, isMember, initialScore, initialDistrict }: { mode: "recommend" | "custom"; schools: readonly RecommendationSchool[]; isMember: boolean; initialScore?: number; initialDistrict?: string }) {
  const [score, setScore] = useState<number | null>(initialScore ?? null);
  const [district, setDistrict] = useState<string | null>(initialDistrict ?? null);
  const [items, setItems] = useState<PlannerItem[]>(() => isMember ? [] : readLocalPlanner().items as PlannerItem[]);
  const [plannerState, setPlannerState] = useState<PlannerState>(() => isMember ? { order: [] } : readLocalPlanner().state as PlannerState);
  const [message, setMessage] = useState("");

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
  const recommendations = useMemo(() => score === null ? null : buildPlannerRecommendations(districtSchools, score), [districtSchools, score]);
  if (score === null) return <Gate />;
  if (mode === "recommend") return <RecommendationView groups={recommendations!} score={score} message={message} onAdd={addItem} />;
  return <CustomView schools={districtSchools} score={score} items={items} plannerState={plannerState} message={message} onAdd={addItem} onMove={moveItem} onReorder={reorderItem} onDelete={deleteItem} onSaveNotes={saveNotes} />;

  async function saveState(next: PlannerState, nextItems = items) {
    setPlannerState(next);
    if (!isMember) {
      writeLocalPlanner(nextItems, next);
      saveLocalPlannerSnapshot(nextItems, next);
      return true;
    }
    const response = await fetch("/api/planner/state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: next }) }).catch(() => null);
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
      writeLocalPlanner(nextItems, nextState);
      saveLocalPlannerSnapshot(nextItems, nextState);
      markProgress("planner");
      setMessage("已加入共同志願清單，並保存於目前裝置。登入 LINE 後才會跨裝置同步。");
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
      await saveState(nextState, nextItems);
      markProgress("planner");
      setMessage("已加入共同志願清單。推薦與自己排會同步顯示。");
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
    await saveState(nextState, nextItems);
    setMessage("志願順序已更新，健檢結果也已同步重算。");
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
    if (!isMember) {
      writeLocalPlanner(nextItems, nextState);
      saveLocalPlannerSnapshot(nextItems, nextState);
    }
    else await saveState(nextState, nextItems);
    setMessage("已從共同志願清單移除。");
  }
}

type MemberScoreSnapshot = { district: string; total_score: number; created_at: string };

function sortItems(items: readonly PlannerItem[], state: PlannerState) {
  const order = new Map((state.order || []).map((id, index) => [id, index]));
  return [...items].sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.created_at.localeCompare(b.created_at));
}

function Gate() { return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-12"><div className="max-w-2xl p-6 jshs-surface-card"><p className="jshs-eyebrow">需要先試算</p><h1 className="mt-2 text-2xl">先完成一次成績試算，才能填志願。</h1><p className="mt-3 text-sm leading-7 jshs-muted-copy">系統推薦與自選排序的建議都會以你的試算成績為依據。</p><Link href="/tools" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">前往試算成績 →</Link></div></section>; }

function RecommendationView({ groups, score, message, onAdd }: { groups: { challenge: RecommendationSchool[]; stable: RecommendationSchool[]; safe: RecommendationSchool[] }; score: number; message: string; onAdd: (school: RecommendationSchool, tier: string) => void }) { return <PlannerLayout title="系統推薦" intro={`目前試算 ${score} 分。系統依歷年參考資料與現有招生資料整理挑戰、適中、穩定三組；這是 JSHS 推估，不是錄取保證。`}><div className="grid gap-5 lg:grid-cols-3"><Group title="挑戰" description="目前資料下差距較大，但保留你想爭取的選項。" schools={groups.challenge} tier="challenge" onAdd={onAdd} /><Group title="適中" description="條件與目前資料較接近，仍請核對官方名額與規則。" schools={groups.stable} tier="balanced" onAdd={onAdd} /><Group title="穩定" description="相對降低資料差距，但不代表錄取保證。" schools={groups.safe} tier="stable" onAdd={onAdd} /></div>{message ? <p className="mt-4 text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}<p className="mt-5 text-sm leading-6 text-slate-600">推薦依據：目前試算分數、就學區、歷年錄取參考與現有招生資料；每個校科仍請回查當年度官方資訊。</p></PlannerLayout>; }

function Group({ title, description, schools, tier, onAdd }: { title: string; description: string; schools: readonly RecommendationSchool[]; tier: string; onAdd: (school: RecommendationSchool, tier: string) => void }) { return <section className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><h2 className="text-xl">{title} <span className="text-sm font-normal text-slate-500">{schools.length}/8</span></h2><p className="mt-2 text-xs leading-5 jshs-muted-copy">{description}</p><div className="mt-4 grid gap-2">{schools.map((school) => <SchoolRow key={`${school.code}-${school.department || "all"}`} school={school} tier={tier} recommendationReason={getRecommendationReason(school, tier)} action={() => onAdd(school, tier)} />)}{!schools.length ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">目前資料不足，請回到全國校科查詢補充選項。</p> : null}</div></section>; }

function CustomView({ schools, score, items, plannerState, message, onAdd, onMove, onReorder, onDelete, onSaveNotes }: { schools: readonly RecommendationSchool[]; score: number; items: readonly PlannerItem[]; plannerState: PlannerState; message: string; onAdd: (school: RecommendationSchool) => void; onMove: (index: number, direction: -1 | 1) => void; onReorder: (itemId: string, targetIndex: number) => void; onDelete: (item: PlannerItem) => void; onSaveNotes: (itemId: string, notes: string) => void }) {
  const selected = new Set(items.map((item) => item.school_code));
  const orderedItems = sortItems(items, plannerState);
  const district = orderedItems[0]?.district || schools[0]?.district || "ct";
  const rule = getAdmissionRule(district);
  const limit = getAdmissionChoiceLimit(district);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("全部縣市");
  const [program, setProgram] = useState("全部類型");
  const [group, setGroup] = useState("全部群科");
  const cities = [...new Set(schools.map((school) => school.city || "未標示所在地"))].sort();
  const programs = [...new Set(schools.map((school) => school.program || "未標示類型"))].sort();
  const groups = [...new Set(schools.flatMap((school) => school.groups || []))].sort();
  const filtered = schools.filter((school) => !selected.has(school.code) && (!query || `${school.name} ${school.code} ${school.department || ""} ${(school.groups || []).join(" ")}`.toLowerCase().includes(query.toLowerCase())) && (city === "全部縣市" || (school.city || "未標示所在地") === city) && (program === "全部類型" || (school.program || "未標示類型") === program) && (group === "全部群科" || (school.groups || []).includes(group)));
  const health = analyzePlannerHealth({ serviceYear: rule.academicYear, district, score, choiceLimit: limit, items: orderedItems.map((item) => { const school = schools.find((candidate) => candidate.code === item.school_code); return { id: item.id, schoolCode: item.school_code, department: item.department, tier: item.tier, qualificationStatus: "unknown" as const, hasQuota: school?.hasQuota, hasHistoricalData: school?.hasHistoricalData, hasSchoolCode: Boolean(item.school_code), hasSource: Boolean(school?.sourceName), hasAcademicYear: Boolean(school?.academicYear) }; }) });
  return <PlannerLayout title="搜尋校科＋我的志願順序" intro={`目前${rule.label}｜試算 ${score} 分｜規則來源 ${rule.academicYear} 學年度`}><div className="mb-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><strong>{rule.label}志願序規則</strong><span className="font-black">已選 {orderedItems.length} / {limit}</span></div><p className="mt-2 text-sm leading-6">{rule.categories.find((item) => item.key === "preferenceScore")?.description || "依本區公告的志願序分段規則計分。"}</p></div><div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><section><h2 className="text-xl">搜尋校科</h2><div className="mt-3 grid gap-2 sm:grid-cols-3"><input aria-label="搜尋學校、科別、群科或代碼" placeholder="搜尋學校、科別、群科、代碼" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="縣市篩選" value={city} onChange={(event) => setCity(event.target.value)}><option>全部縣市</option>{cities.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="類型篩選" value={program} onChange={(event) => setProgram(event.target.value)}><option>全部類型</option>{programs.map((value) => <option key={value}>{value}</option>)}</select></div><div className="mt-4 grid max-h-[680px] gap-3 overflow-auto">{filtered.map((school) => <SchoolRow key={`${school.code}-${school.department || "all"}`} school={school} action={() => onAdd(school)} />)}{!filtered.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">找不到符合條件的校科，請調整搜尋條件。</p> : null}</div></section><section><div className="flex items-center justify-between gap-3"><h2 className="text-xl">我的志願</h2><button type="button" className="text-sm text-red-700" onClick={() => orderedItems.forEach((item) => onDelete(item))}>清空全部</button></div><p className="mt-2 text-sm leading-6 text-slate-600">第一志願在最上方，可拖曳或使用上下按鈕調整順序。</p><div className="mt-4 grid gap-3">{orderedItems.map((item, index) => <PlannerItemCard key={item.id} item={item} index={index} total={orderedItems.length} notes={plannerState.itemMeta?.[item.id]?.notes || item.notes || ""} onMove={onMove} onDrop={(targetIndex) => onReorder(item.id, targetIndex)} onDelete={onDelete} onSaveNotes={onSaveNotes} />)}{!orderedItems.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">尚未加入志願，請從左側搜尋校科。</p> : null}</div><PlannerHealthPanel checks={health} /></section></div>{message ? <p className="mt-4 text-sm font-bold text-[var(--jshs-primary)]" role="status">{message}</p> : null}</PlannerLayout>;
}

function PlannerItemCard({ item, index, total, notes, onMove, onDrop, onDelete, onSaveNotes }: { item: PlannerItem; index: number; total: number; notes: string; onMove: (index: number, direction: -1 | 1) => void; onDrop: (targetIndex: number) => void; onDelete: (item: PlannerItem) => void; onSaveNotes: (itemId: string, notes: string) => void }) {
  const [dragging, setDragging] = useState(false);
  return <article draggable onDragStart={() => setDragging(true)} onDragEnd={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); onDrop(index); }} className={`rounded-xl bg-white p-4 jshs-surface-card ${dragging ? "opacity-50" : ""}`}><div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--jshs-muted-surface)] font-black">{index + 1}</span><div className="min-w-0 flex-1"><strong className="block">{item.school_name}</strong><span className="text-xs text-slate-500">{item.department || "校科資料"} · {item.tier === "challenge" ? "挑戰" : item.tier === "stable" ? "穩定" : "適中"}</span></div><Link href={schoolHref(item.district, item.school_code)} className="shrink-0 text-xs font-bold text-[var(--jshs-primary)]">查看學校</Link><button type="button" aria-label={`將 ${item.school_name} 上移`} disabled={index === 0} onClick={() => onMove(index, -1)} className="min-h-11 min-w-11 text-sm text-[var(--jshs-primary)] disabled:opacity-30">↑</button><button type="button" aria-label={`將 ${item.school_name} 下移`} disabled={index === total - 1} onClick={() => onMove(index, 1)} className="min-h-11 min-w-11 text-sm text-[var(--jshs-primary)] disabled:opacity-30">↓</button><button type="button" aria-label={`刪除 ${item.school_name}`} onClick={() => onDelete(item)} className="min-h-11 px-2 text-sm text-red-700">刪除</button></div><label className="mt-3 grid gap-1 text-xs font-bold text-slate-500">備註<textarea defaultValue={notes} maxLength={1000} rows={2} onBlur={(event) => onSaveNotes(item.id, event.currentTarget.value)} placeholder="補充想了解的課程、通勤或家庭討論事項" /></label><p className="mt-2 text-xs text-slate-500">拖曳這張卡片到另一順位即可移動。</p></article>;
}

function PlannerHealthPanel({ checks }: { checks: readonly PlannerHealthCheck[] }) { return <section className="mt-6 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-center justify-between gap-3"><h2 className="text-lg">志願健檢</h2><span className="text-xs jshs-muted-copy">每次變更都會重新檢查</span></div><div className="mt-3 grid gap-2">{checks.map((check) => <details key={check.id} className="rounded-xl bg-white p-3"><summary className="cursor-pointer font-bold"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${check.status === "pass" ? "bg-emerald-500" : check.status === "error" ? "bg-red-500" : check.status === "unknown" ? "bg-slate-400" : "bg-amber-500"}`} />{check.label} <span className="ml-1 text-xs font-normal">{check.status === "pass" ? "通過" : check.status === "error" ? "需修正" : check.status === "unknown" ? "無法判定" : "提醒"}</span></summary><p className="mt-2 text-sm leading-6 jshs-muted-copy">{check.detail}</p><Link href={check.actionHref} className="mt-2 inline-flex text-sm font-bold text-[var(--jshs-primary)]">{check.actionLabel} →</Link></details>)}</div></section>; }

function SchoolRow({ school, action, tier, recommendationReason }: { school: RecommendationSchool; action: () => void; tier?: string; recommendationReason?: string }) { return <div className="flex items-start gap-3 rounded-xl bg-white p-3"><div className="min-w-0 flex-1"><strong className="block">{school.name}</strong><span className="mt-1 block text-xs text-slate-500">{school.referenceScore ? `歷年參考 ${school.referenceScore} 分` : "目前沒有可回查的歷年參考資料"}</span>{tier ? <p className="mt-2 text-xs leading-5 text-slate-600"><strong>推薦理由：</strong>{recommendationReason}</p> : null}</div><div className="flex shrink-0 flex-col items-end gap-2"><Link href={schoolHref(school.district, school.code)} className="text-xs font-bold text-[var(--jshs-primary)]">查看學校</Link><button type="button" onClick={action} className="min-h-11 px-3 py-2 text-xs jshs-button-secondary">加入</button></div></div>; }

function getRecommendationReason(school: RecommendationSchool, tier: string) { if (!school.referenceScore) return "目前缺少可比較的歷年參考分數，請先查看校科資料與官方招生資訊。"; if (tier === "challenge") return "歷年參考分數高於目前試算分數，作為需要再核對的挑戰選項。"; if (tier === "stable") return "在目前可用資料中相對接近較低參考區間，仍不代表錄取保證。"; return "歷年參考分數與目前試算分數較接近，作為適中選項參考。"; }
function schoolHref(district = "", code = "") { return district && code ? `/schools/${district}/${code}` : `/schools?q=${encodeURIComponent(code)}`; }
function PlannerActions() { return <div className="mt-5 flex flex-wrap gap-2"><Link href="/planner/recommend" className="min-h-11 px-4 py-3 text-sm jshs-button-secondary">查看排序建議</Link><button type="button" className="min-h-11 px-4 py-3 text-sm jshs-button-secondary" onClick={() => window.print()}>列印志願清單</button><button type="button" className="min-h-11 px-4 py-3 text-sm jshs-button-secondary" onClick={() => { void navigator.clipboard?.writeText(window.location.href); }}>分享志願清單</button></div>; }

function PlannerLayout({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) { return <><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><p className="jshs-eyebrow">我的志願 · <Link href="/planner">回到我的志願</Link></p><h1 className="mt-3">{title}</h1><p className="mt-3 max-w-3xl text-base leading-7 jshs-muted-copy">{intro}</p><PlannerActions /></div></section><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-8">{children}</section></>; }
