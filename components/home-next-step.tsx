"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";

type Need = "district" | "score" | "schools" | "planner";

const steps = ["學生目前階段", "就學區是否已知", "現在最想處理的問題"] as const;
const needs: Record<Need, { label: string; href: string; next: string }> = {
  district: { label: "確認就學區", href: "/districts", next: "確認就學區 → 了解積分 → 找學校 → 建立志願" },
  score: { label: "了解積分", href: "/tools", next: "了解積分 → 找學校 → 建立志願" },
  schools: { label: "找學校", href: "/schools", next: "找學校 → 建立志願" },
  planner: { label: "建立志願", href: "/planner", next: "建立志願 → 用健檢確認清單" },
};

export function HomeNextStep() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState("");
  const [districtKnown, setDistrictKnown] = useState("");
  const [need, setNeed] = useState<Need | "">("");
  const canContinue = [Boolean(stage), Boolean(districtKnown), Boolean(need)][step];
  const result = need ? needs[need] : null;

  if (!started) return <section className="jshs-next-step-card"><p className="jshs-eyebrow">新手導引</p><h2>第一次來？不知道從哪裡開始</h2><p>用幾個簡單問題，幫你確認目前最需要做的事情。</p><button type="button" onClick={() => setStarted(true)} className="jshs-button-primary px-5">幫我確認下一步</button></section>;

  if (result) return <section className="jshs-next-step-card"><p className="jshs-eyebrow">你的下一步</p><h2>{result.label}</h2><p>建議順序：{districtKnown === "還不知道" ? needs.district.next : result.next}</p><Link href={districtKnown === "還不知道" ? "/districts" : result.href} className="jshs-button-primary px-5">前往{districtKnown === "還不知道" ? "確認就學區" : result.label}</Link><button type="button" className="jshs-text-button" onClick={() => { setStep(0); setStage(""); setDistrictKnown(""); setNeed(""); }}>重新確認</button></section>;

  return <section className="jshs-next-step-card"><div className="flex items-center justify-between gap-3"><div><p className="jshs-eyebrow">問題 {step + 1} / {steps.length}</p><h2>{steps[step]}</h2></div><button type="button" className="jshs-text-button" onClick={() => setStarted(false)}>稍後再說</button></div>{step === 0 ? <ChoiceGroup value={stage} onChange={setStage} options={["國一或國二，先了解方向", "國三，準備升學規劃", "已經有成績，準備找校科或填志願"]} /> : null}{step === 1 ? <ChoiceGroup value={districtKnown} onChange={setDistrictKnown} options={["已知", "還不知道"]} /> : null}{step === 2 ? <ChoiceGroup value={need} onChange={(value) => setNeed(value as Need)} options={["district", "score", "schools", "planner"]} labels={["確認就學區", "了解積分", "找學校", "建立志願"]} /> : null}<div className="mt-5 flex items-center gap-3">{step > 0 ? <button type="button" className="jshs-button-secondary px-4" onClick={() => setStep((value) => value - 1)}>上一步</button> : null}<button type="button" disabled={!canContinue} className="jshs-button-primary px-5" onClick={() => setStep((value) => value + 1)}>{step === 2 ? "查看建議" : "下一題"}</button></div></section>;
}

function ChoiceGroup({ value, onChange, options, labels }: { value: string; onChange: (value: string) => void; options: readonly string[]; labels?: readonly string[] }) {
  return <div className="mt-5 grid gap-2">{options.map((option, index) => <button key={option} type="button" className={`jshs-next-choice ${value === option ? "is-selected" : ""}`} onClick={() => onChange(option)}>{labels?.[index] || option}</button>)}</div>;
}

const quickActions: ReadonlyArray<{ title: string; description: string; href: string; tone: "school" | "score" | "planner" | "guide"; icon: SiteIconName }> = [
  { title: "找學校", description: "搜尋全國高中職與科系", href: "/schools", tone: "school", icon: "school" },
  { title: "算成績", description: "依就學區試算免試積分", href: "/tools", tone: "score", icon: "calculator" },
  { title: "我的志願", description: "建立與整理志願清單", href: "/planner", tone: "planner", icon: "planner" },
  { title: "升學指南", description: "看懂制度與升學方向", href: "/knowledge", tone: "guide", icon: "knowledge" },
];

export function HomeQuickActions() {
  return <section className="jshs-home-quick-actions" aria-labelledby="quick-actions-title"><div className="jshs-home-quick-heading"><p className="jshs-eyebrow">快速入口</p><h2 id="quick-actions-title">我知道我要做什麼</h2><p>直接選擇你現在想完成的事情。</p></div><div className="jshs-home-quick-grid">{quickActions.map((item) => <Link key={item.href} href={item.href} className={`jshs-home-quick-action is-${item.tone}`}><span className="jshs-home-quick-icon"><SiteIcon name={item.icon} size={21} /></span><span><b>{item.title}</b><small>{item.description}</small></span><span className="jshs-home-quick-arrow" aria-hidden="true">→</span></Link>)}</div></section>;
}
