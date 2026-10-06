"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import guideCatalog from "@/data/admission-guides.json";
import { evaluateAdmissionEligibility, type AdmissionPathRoute, type Identity, type SpecialNeed, type StudentType } from "@/lib/admission-path-engine";
import { readStoredDistrict, subscribeToDistrict } from "@/lib/district-context";
import eligibilityTopics from "@/content/guide/eligibility-topics.json";

type Topic = "special-admission" | "gifted-special-education" | "direct-selection" | "cross-district" | "extra-quota" | "non-graduate" | "overseas-student";
type TopicConfig = Readonly<{ title: string; prompt: string; options: readonly { value: string; label: string }[]; need?: SpecialNeed; identity?: Identity; studentType?: StudentType; checklist: readonly string[]; next: readonly string[]; routeId: string }>;

const topicConfig = eligibilityTopics as Record<Topic, TopicConfig>;

const checklistListeners = new Set<() => void>();
const checklistKey = (topic: string, district: string) => `jshs:eligibility-checklist:v1:${topic}:${district || "all"}`;
function subscribeChecklist(listener: () => void) {
  checklistListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { checklistListeners.delete(listener); window.removeEventListener("storage", listener); };
}
function readChecklistRaw(key: string) { try { return window.localStorage.getItem(key) || ""; } catch { return ""; } }
function parseChecklist(raw: string, length: number): boolean[] {
  let parsed: unknown = [];
  try { parsed = raw ? JSON.parse(raw) : []; } catch { parsed = []; }
  const list = Array.isArray(parsed) ? parsed : [];
  return Array.from({ length }, (_, index) => list[index] === true);
}

export function EligibilityTopicWorkspace({ topic }: { topic: Topic }) {
  const config = topicConfig[topic];
  const district = useSyncExternalStore(subscribeToDistrict, readStoredDistrict, () => "");
  const guide = guideCatalog.guides.find((item) => item.code === district);
  const [selection, setSelection] = useState("");
  const storageKey = checklistKey(topic, district);
  const rawChecked = useSyncExternalStore(subscribeChecklist, () => readChecklistRaw(storageKey), () => "");
  const checked = useMemo(() => parseChecklist(rawChecked, config.checklist.length), [rawChecked, config.checklist.length]);
  const [saveFailed, setSaveFailed] = useState(false);
  const route = useMemo(() => {
    const specialNeeds = config.need ? [config.need] : [];
    if (!selection) return undefined;
    const identities = config.identity || topic === "extra-quota" ? [selection as Identity] : [];
    const studentType = config.studentType || (topic === "non-graduate" ? "non_current_graduate" : "current_graduate");
    const evaluated = evaluateAdmissionEligibility({ academicYear: guide?.code ? "115" : "", zone: district, studentType, schoolCounty: "", schoolCode: "", identities, specialNeeds, answers: { directSchoolType: selection, crossZoneReason: selection, specialAdmissionType: selection, specialEducationNeed: selection } });
    return evaluated.routes.find((item) => item.routeId === config.routeId) || evaluated.routes.find((item) => item.category === "特殊身分") || evaluated.routes[0];
  }, [config, district, guide?.code, selection, topic]);
  const completed = checked.filter(Boolean).length;
  function toggleChecklist(index: number) {
    const next = checked.map((value, itemIndex) => itemIndex === index ? !value : value);
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); setSaveFailed(false); checklistListeners.forEach((listener) => listener()); } catch { setSaveFailed(true); }
  }

  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] pb-12" aria-label={config.title}><div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr]"><article className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">{guide?.label || "尚未選定就學區"} · 規則工作區</p><h2 className="mt-2">{config.title}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">這裡的選擇會產生本區的保守判定；資料不足時顯示需要確認，不會假裝是正式資格核定。</p><label className="mt-6 grid gap-2 text-sm font-black text-[var(--jshs-primary)]">{config.prompt}<select value={selection} onChange={(event) => setSelection(event.target.value)}><option value="">請先選擇</option>{config.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><div className="mt-7 flex items-end justify-between gap-3"><div><p className="jshs-eyebrow">我的確認清單</p><h3 className="mt-1">完成一項，再往下一項</h3></div><span className="jshs-chip">{completed} / {config.checklist.length}</span></div>{saveFailed ? <p role="alert" className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-950">此瀏覽器無法儲存勾選狀態（可能是無痕模式或已停用儲存），重新整理後會歸零。</p> : null}<div className="mt-4 grid gap-3">{config.checklist.map((item, index) => <label key={item} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><input type="checkbox" checked={checked[index]} onChange={() => toggleChecklist(index)} className="mt-1 h-5 w-5" /><span><strong>{item}</strong><small className="mt-1 block leading-5 jshs-muted-copy">勾選狀態保存在本機瀏覽器（此裝置），不會同步到其他裝置。</small></span></label>)}</div></article><aside className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">判定與下一步</p>{route ? <><div className="mt-2 flex items-center gap-3"><span className="text-2xl font-black">{route.status === "eligible" ? "✓" : route.status === "possibly_eligible" ? "△" : route.status === "ineligible" ? "✕" : "？"}</span><h3 className="text-2xl">{statusLabel(route.status)}</h3></div><div className="mt-5"><h4>判定原因</h4><ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-600">{route.reasons.map((item) => <li key={item} className="rounded-xl bg-[var(--jshs-muted-surface)] p-3">{item}</li>)}</ul></div><div className="mt-5"><h4>應備文件</h4><ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-600">{route.requiredDocuments.map((item) => <li key={item} className="rounded-xl bg-[var(--jshs-muted-surface)] p-3">{item}</li>)}</ul></div></> : <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">請先選擇選項，系統才會依本區規則整理結果。</p>}<div className="mt-5"><h4>下一步</h4><ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-600">{config.next.map((item) => <li key={item} className="rounded-xl bg-[var(--jshs-muted-surface)] p-3">{item}</li>)}</ul></div>{guide ? <div className="mt-5 rounded-xl border border-[var(--jshs-border)] p-3 text-sm"><strong className="block">本區官方依據</strong><p className="mt-1 leading-6 jshs-muted-copy">115 學年度{guide.label}免試入學簡章 · {guide.pages} 頁</p><div className="mt-2 flex flex-wrap gap-3"><a href={guide.file} target="_blank" rel="noreferrer" className="font-black text-[var(--jshs-primary)]">開啟簡章 ↗</a><a href={guide.sourceUrl} target="_blank" rel="noreferrer" className="font-black text-[var(--jshs-primary)]">官方網站 ↗</a></div></div> : null}</aside></div></section>;
}

function statusLabel(status: AdmissionPathRoute["status"]) { return status === "eligible" ? "符合" : status === "possibly_eligible" ? "可能符合" : status === "ineligible" ? "目前不符合" : "需要人工／官方確認"; }
