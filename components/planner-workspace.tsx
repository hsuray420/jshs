"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type PlannerSchoolSummary = Readonly<{
  district: string;
  code: string;
  name: string;
  program: string;
  department: string;
  courseDirection: string;
  commuteInfo: string;
  quota: string;
  referenceScore: string;
  dataStatus: string;
  academicYear: string;
}>;
type PlannerItem = { id: string; district: string; school_code: string; school_name: string; department: string; tier: string; notes: string; created_at: string };
type Tier = "challenge" | "balanced" | "stable";
type View = "options" | "risk" | "compare" | "next";
type ItemMeta = { tier?: Tier; reason?: string; perspective?: "student" | "family" | "both"; order?: number };
type PlannerState = { itemMeta?: Record<string, ItemMeta>; tasks?: Record<string, boolean> };

const tiers: Readonly<Record<Tier, { label: string; icon: string; description: string }>> = {
  challenge: { label: "挑戰", icon: "↗", description: "想去，但需要再核對落點與條件" },
  balanced: { label: "適中", icon: "≈", description: "資料與期待大致相符" },
  stable: { label: "穩定", icon: "✓", description: "條件相對穩定，仍要確認是否願意就讀" },
};
const taskCatalog = [
  ["read-rules", "閱讀適用規則", "回到升學指南核對本區比序與志願規則", "/news/rules"],
  ["check-data", "補齊校科資料", "查看課程、通勤或招生欄位是否待補", "/schools"],
  ["family-talk", "安排家庭討論", "把學生與家長的理由放在同一張摘要", "#family-summary"],
  ["check-dates", "確認重要日期", "查看目前就學區與階段的日期", "/news/exam"],
] as const;

export function PlannerWorkspace({ schools }: { schools: readonly PlannerSchoolSummary[] }) {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [state, setState] = useState<PlannerState>({ itemMeta: {}, tasks: {} });
  const [view, setView] = useState<View>("options");
  const [status, setStatus] = useState("正在讀取已保存的規劃…");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/planner", { headers: { accept: "application/json" } }).then(async (response) => ({ response, payload: await response.json() as { items?: PlannerItem[] } })),
      fetch("/api/planner/state", { headers: { accept: "application/json" } }).then(async (response) => ({ response, payload: await response.json() as { state?: PlannerState } })),
    ]).then(([itemsResponse, stateResponse]) => {
      if (!active) return;
      const nextItems = itemsResponse.payload.items || [];
      const nextState = stateResponse.payload.state || { itemMeta: {}, tasks: {} };
      setItems(sortItems(nextItems, nextState));
      setState({ itemMeta: nextState.itemMeta || {}, tasks: nextState.tasks || {} });
      setStatus(itemsResponse.response.ok ? "規劃已同步" : "暫時無法讀取規劃");
    }).catch(() => { if (active) setStatus("暫時無法讀取規劃"); });
    return () => { active = false; };
  }, []);

  const schoolMap = useMemo(() => new Map(schools.map((school) => [`${school.district}:${school.code}`, school])), [schools]);
  const orderedItems = useMemo(() => sortItems(items, state), [items, state]);

  async function saveState(next: PlannerState) {
    setState(next);
    const response = await fetch("/api/planner/state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: next }) }).catch(() => null);
    if (!response?.ok) setStatus("已保存在目前裝置；跨裝置同步稍後重試");
  }

  function updateMeta(id: string, patch: ItemMeta) {
    const current = state.itemMeta || {};
    const next = { ...state, itemMeta: { ...current, [id]: { ...current[id], ...patch } } };
    setItems((currentItems) => currentItems.map((item) => item.id === id ? { ...item, tier: patch.tier || item.tier, notes: patch.reason ?? item.notes } : item));
    void saveState(next);
  }

  function moveItem(id: string, direction: -1 | 1) {
    const current = [...orderedItems];
    const index = current.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return;
    const [moved] = current.splice(index, 1);
    current.splice(target, 0, moved);
    const itemMeta = Object.fromEntries(current.map((item, order) => [item.id, { ...(state.itemMeta?.[item.id] || {}), order }]));
    void saveState({ ...state, itemMeta });
  }

  function dropItem(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const current = [...orderedItems];
    const from = current.findIndex((item) => item.id === draggedId);
    const to = current.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    const itemMeta = Object.fromEntries(current.map((item, order) => [item.id, { ...(state.itemMeta?.[item.id] || {}), order }]));
    void saveState({ ...state, itemMeta });
    setDraggedId(null);
  }

  async function remove(id: string) {
    const response = await fetch("/api/planner", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    if (response?.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  function toggleTask(id: string) { void saveState({ ...state, tasks: { ...(state.tasks || {}), [id]: !state.tasks?.[id] } }); }

  function downloadSummary() {
    const text = buildSummary(orderedItems, state, schoolMap);
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "我的升學規劃摘要.txt"; anchor.click(); URL.revokeObjectURL(url);
  }

  async function sharePlanner() {
    const token = encodeShare({ items: orderedItems, state });
    const url = `${window.location.origin}/planner/share#${token}`;
    await navigator.clipboard?.writeText(url);
    setShareStatus("只讀分享連結已複製；內容不會被搜尋引擎建立索引。");
  }

  return <>
    <section className="jshs-hero-section"><div className="mx-auto w-[min(1160px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">我的規劃中心 · 目前位於第 1 步／共 4 個工作區</p><h1 className="mt-3 max-w-4xl">把收藏清單升級成家庭可以一起討論的工作區。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">候選校科、風險分層、比較資料與下一步集中在同一個地方；每個操作都保留在你的規劃，不公開到搜尋引擎。</p></div></section>
    <section className="mx-auto w-[min(1160px,calc(100%-32px))] py-6"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm font-black text-[var(--jshs-primary)]">{status}</span><div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.print()} className="px-3 py-2 text-sm jshs-button-secondary">列印／另存 PDF</button><button type="button" onClick={downloadSummary} className="px-3 py-2 text-sm jshs-button-secondary">下載清單</button><button type="button" onClick={() => void sharePlanner()} className="px-3 py-2 text-sm jshs-button-primary">建立只讀分享</button></div></div>{shareStatus ? <p className="mt-3 text-sm text-[var(--jshs-success)]" role="status">{shareStatus}</p> : null}</section>
    <section className="mx-auto w-[min(1160px,calc(100%-32px))] pb-12"><nav aria-label="規劃工作區" className="grid grid-cols-2 gap-2 md:grid-cols-4">{([ ["options", "我的選項", "收藏、備註與觀點"], ["risk", "風險分層", "挑戰／適中／穩定"], ["compare", "比較表", "把欄位放在一起"], ["next", "下一步", "補資料與家庭討論"]] as const).map(([id, label, description]) => <button key={id} type="button" onClick={() => setView(id)} className={`p-4 text-left jshs-button ${view === id ? "jshs-button-primary" : "jshs-button-secondary"}`}><strong className="block">{label}</strong><span className={`mt-1 block text-xs leading-5 ${view === id ? "text-white/80" : "jshs-muted-copy"}`}>{description}</span></button>)}</nav>
      <div className="mt-6">{view === "options" ? <OptionsView items={orderedItems} state={state} onMeta={updateMeta} onMove={moveItem} onDrop={dropItem} onDragStart={setDraggedId} onRemove={remove} /> : null}{view === "risk" ? <RiskView items={orderedItems} state={state} onMove={moveItem} /> : null}{view === "compare" ? <CompareView items={orderedItems} schoolMap={schoolMap} /> : null}{view === "next" ? <NextView items={orderedItems} state={state} onTask={toggleTask} /> : null}</div>
    </section>
  </>;
}

function OptionsView({ items, state, onMeta, onMove, onDrop, onDragStart, onRemove }: { items: readonly PlannerItem[]; state: PlannerState; onMeta: (id: string, patch: ItemMeta) => void; onMove: (id: string, direction: -1 | 1) => void; onDrop: (id: string) => void; onDragStart: (id: string) => void; onRemove: (id: string) => void }) { return <section aria-labelledby="options-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">第一欄 · 所有收藏</p><h2 id="options-title" className="mt-2">我的選項 <span className="text-sm font-normal text-slate-500">{items.length} 筆</span></h2></div><Link href="/schools" className="px-4 py-3 text-sm jshs-button-primary">繼續找校科 →</Link></div><div className="mt-5 grid gap-3">{items.map((item, index) => <PlannerCard key={item.id} item={item} index={index} meta={state.itemMeta?.[item.id]} onMeta={onMeta} onMove={onMove} onDrop={onDrop} onDragStart={onDragStart} onRemove={onRemove} />)}{!items.length ? <EmptyState /> : null}</div></section>; }

function PlannerCard({ item, index, meta, onMeta, onMove, onDrop, onDragStart, onRemove }: { item: PlannerItem; index: number; meta?: ItemMeta; onMeta: (id: string, patch: ItemMeta) => void; onMove: (id: string, direction: -1 | 1) => void; onDrop: (id: string) => void; onDragStart: (id: string) => void; onRemove: (id: string) => void }) { const tier = meta?.tier || (item.tier as Tier) || "balanced"; return <article draggable onDragStart={() => onDragStart(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(item.id)} className="p-5 jshs-surface-card"><div className="flex flex-wrap items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--jshs-muted-surface)] font-black text-[var(--jshs-primary)]">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="jshs-chip">{item.district.toUpperCase()} · {item.school_code}</span><RiskLabel tier={tier} /></div><h3 className="mt-2 text-xl">{item.school_name}</h3><p className="mt-1 text-sm leading-6 jshs-muted-copy">{item.department || "尚未指定科系"}</p></div><div className="flex gap-1"><button aria-label="向上移動" type="button" onClick={() => onMove(item.id, -1)} className="grid h-9 w-9 place-items-center jshs-button-secondary">↑</button><button aria-label="向下移動" type="button" onClick={() => onMove(item.id, 1)} className="grid h-9 w-9 place-items-center jshs-button-secondary">↓</button></div></div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px]"><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">為什麼想選<textarea rows={2} value={meta?.reason || item.notes || ""} onChange={(event) => onMeta(item.id, { reason: event.target.value.slice(0, 1000) })} placeholder="例如：喜歡課程方向、通勤可接受" /></label><label className="grid gap-2 text-sm font-black text-[var(--jshs-primary)]">觀點標籤<select value={meta?.perspective || "student"} onChange={(event) => onMeta(item.id, { perspective: event.target.value as ItemMeta["perspective"] })}><option value="student">學生觀點</option><option value="family">家長觀點</option><option value="both">共同確認</option></select></label></div><div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-black text-slate-500">風險分層</span>{(Object.keys(tiers) as Tier[]).map((option) => <button key={option} type="button" aria-pressed={tier === option} onClick={() => onMeta(item.id, { tier: option })} className={`px-3 py-2 text-xs jshs-button ${tier === option ? "jshs-button-primary" : "jshs-button-secondary"}`}>{tiers[option].icon} {tiers[option].label}</button>)}<button type="button" onClick={() => onRemove(item.id)} className="ml-auto px-3 py-2 text-xs text-[var(--jshs-danger)] jshs-button-secondary">移除</button></div></article>; }

function RiskView({ items, state, onMove }: { items: readonly PlannerItem[]; state: PlannerState; onMove: (id: string, direction: -1 | 1) => void }) { return <section aria-labelledby="risk-title"><p className="jshs-eyebrow">第二欄 · 不只用顏色</p><h2 id="risk-title" className="mt-2">風險分層</h2><p className="mt-3 max-w-2xl text-sm leading-6 jshs-muted-copy">每一層都有文字、圖示與說明；分層是規劃工具，不是錄取預測。</p><div className="mt-5 grid gap-4 lg:grid-cols-3">{(Object.keys(tiers) as Tier[]).map((tier) => <section key={tier} className="min-h-48 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><RiskLabel tier={tier} /><p className="mt-2 text-xs leading-5 jshs-muted-copy">{tiers[tier].description}</p><div className="mt-4 grid gap-2">{items.filter((item) => (state.itemMeta?.[item.id]?.tier || item.tier || "balanced") === tier).map((item) => <div key={item.id} className="rounded-xl bg-white p-3"><strong className="block text-sm">{item.school_name}</strong><span className="mt-1 block text-xs text-slate-500">{item.department || "尚未指定科系"}</span><div className="mt-2 flex gap-1"><button type="button" onClick={() => onMove(item.id, -1)} className="text-xs text-[var(--jshs-primary)]">↑ 上移</button><button type="button" onClick={() => onMove(item.id, 1)} className="text-xs text-[var(--jshs-primary)]">↓ 下移</button></div></div>)}</div></section>)}</div></section>; }

function CompareView({ items, schoolMap }: { items: readonly PlannerItem[]; schoolMap: ReadonlyMap<string, PlannerSchoolSummary> }) { return <section aria-labelledby="compare-title"><p className="jshs-eyebrow">第三欄 · 摘要卡＋詳細表格</p><h2 id="compare-title" className="mt-2">比較表</h2><p className="mt-3 text-sm leading-6 jshs-muted-copy">只顯示目前有資料的核心欄位；每個空白都代表下一步需要補資料或回到官方來源核對。</p><div className="mt-5 overflow-x-auto rounded-2xl bg-white jshs-surface-card"><table><thead><tr><th>學校／科系</th><th>學制分類</th><th>課程方向</th><th>通勤資訊</th><th>招生名額</th><th>最低錄取分數</th><th>資料狀態</th></tr></thead><tbody>{items.map((item) => { const school = schoolMap.get(`${item.district}:${item.school_code}`); return <tr key={item.id}><th><strong className="block">{item.school_name}</strong><small className="font-normal">{item.department || "未指定科系"}</small></th><td>{school?.program || "待補"}</td><td>{school?.courseDirection || "待補"}</td><td>{school?.commuteInfo || "待補"}</td><td>{school?.quota || "待公告"}</td><td>{school?.referenceScore || "未提供"}</td><td>{school?.dataStatus === "ready" ? "已校核" : "參考"}</td></tr>; })}</tbody></table>{!items.length ? <EmptyState /> : null}</div></section>; }

function NextView({ items, state, onTask }: { items: readonly PlannerItem[]; state: PlannerState; onTask: (id: string) => void }) { const missingCount = items.filter((item) => !item.notes || !(state.itemMeta?.[item.id]?.reason)).length; return <section aria-labelledby="next-title"><p className="jshs-eyebrow">第四欄 · 完成後留下下一步</p><h2 id="next-title" className="mt-2">下一步</h2><div className="mt-5 grid gap-3">{taskCatalog.map(([id, title, description, href]) => <article key={id} className="flex flex-wrap items-center gap-4 p-4 jshs-surface-card"><button type="button" aria-pressed={Boolean(state.tasks?.[id])} onClick={() => onTask(id)} className={`grid h-9 w-9 place-items-center rounded-full text-lg ${state.tasks?.[id] ? "bg-[var(--jshs-success)] text-white" : "bg-[var(--jshs-muted-surface)] text-[var(--jshs-primary)]"}`}>{state.tasks?.[id] ? "✓" : "○"}</button><div className="min-w-0 flex-1"><h3 className="text-base">{title}</h3><p className="mt-1 text-sm leading-6 jshs-muted-copy">{id === "check-data" && missingCount ? `${description}；目前約 ${missingCount} 筆需要補理由或資料。` : description}</p></div>{href.startsWith("#") ? <a href={href} className="text-sm text-[var(--jshs-primary)]">查看 →</a> : <Link href={href} className="text-sm text-[var(--jshs-primary)]">前往 →</Link>}</article>)}</div><article id="family-summary" className="mt-6 p-5 jshs-surface-card"><p className="jshs-eyebrow">家庭討論摘要</p><h3 className="mt-2">把這些問題帶進家庭會議</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600"><li>• 學生最在意的學習內容與願意投入的程度是什麼？</li><li>• 家長最需要確認的通勤、住宿、費用或安全條件是什麼？</li><li>• 哪些資料仍需回到官方簡章核對？</li></ul><p className="mt-4 text-xs leading-5 jshs-muted-copy">完整摘要可用上方「下載清單」或「列印／另存 PDF」保存。</p></article></section>; }

function RiskLabel({ tier }: { tier: Tier }) { return <span className="inline-flex items-center gap-2 text-sm font-black text-[var(--jshs-primary)]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--jshs-brand-tint)]">{tiers[tier].icon}</span>{tiers[tier].label}<span className="text-xs font-normal text-slate-500">{tiers[tier].description}</span></span>; }
function EmptyState() { return <div className="border border-dashed border-[var(--jshs-border)] p-8 text-center"><h3 className="text-xl">目前還沒有收藏</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">從「找校科」加入候選校科後，就會出現在這裡。</p><Link className="mt-4 inline-flex px-4 py-3 text-sm jshs-button-primary" href="/schools">開始找校科</Link></div>; }
function sortItems(items: readonly PlannerItem[], state: PlannerState) { return [...items].sort((left, right) => (state.itemMeta?.[left.id]?.order ?? 9999) - (state.itemMeta?.[right.id]?.order ?? 9999)); }
function buildSummary(items: readonly PlannerItem[], state: PlannerState, schoolMap: ReadonlyMap<string, PlannerSchoolSummary>) { return ["我的升學規劃摘要", `產生時間：${new Date().toLocaleString("zh-TW")}`, "", ...items.map((item, index) => { const meta = state.itemMeta?.[item.id]; const school = schoolMap.get(`${item.district}:${item.school_code}`); return `${index + 1}. ${item.school_name}｜${item.department || "未指定科系"}\n分層：${tiers[(meta?.tier || item.tier || "balanced") as Tier]?.label || "適中"}｜觀點：${meta?.perspective || "student"}\n理由：${meta?.reason || item.notes || "尚未填寫"}\n課程方向：${school?.courseDirection || "待補"}｜通勤資訊：${school?.commuteInfo || "待補"}`; })].join("\n"); }
function encodeShare(value: unknown) { const bytes = new TextEncoder().encode(JSON.stringify(value)); let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
