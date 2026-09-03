"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { technicalGroupDirectory } from "@/lib/technical-group-directory";
import faqContent from "@/content/faq/knowledge.json";
import guideContent from "@/content/guide/workspaces.json";

export type Topic = "admission-basics" | "rules" | "glossary" | "fit-quiz" | "groups";

const pageCopy = guideContent.pageCopy as unknown as Record<Topic, readonly [string, string]>;
// Detailed score rules continue to route through the canonical calculator: "/tools/rules".

const terms = faqContent.terms.map(({ question, answer }) => [question, answer] as const);
const misconceptions = faqContent.misconceptions.map(({ question, answer }) => [question, answer] as const);

export function KnowledgeTopicWorkspace({ topic }: { topic: Topic }) {
  const [title, description] = pageCopy[topic];
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><div className="mb-6"><p className="jshs-eyebrow">{topic === "groups" ? "找學校 · 群科探索" : "升學指南"}</p><h1 className="mt-2">{title}</h1><p className="mt-3 max-w-3xl text-base leading-7 jshs-muted-copy">{description}</p></div>{topic === "admission-basics" ? <Basics /> : topic === "rules" ? <RulesGuide /> : topic === "glossary" ? <Glossary /> : topic === "fit-quiz" ? <FitQuiz /> : <GroupsGuide />}</section>;
}

function Basics() {
  const steps = guideContent.basicsSteps;
  const [active, setActive] = useState(0);
  return <div className="grid gap-4 md:grid-cols-[280px_1fr]"><nav className="grid gap-2" aria-label="升學入門步驟">{steps.map(([title], index) => <button key={title} type="button" onClick={() => setActive(index)} className={"p-4 text-left text-sm jshs-button " + (active === index ? "jshs-button-primary" : "jshs-button-secondary")}>{index + 1}. {title}</button>)}</nav><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">第 {active + 1} 步</p><h2 className="mt-2">{steps[active][0]}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">{steps[active][1]}</p><Link href={steps[active][2]} className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">前往操作 →</Link></article></div>;
}

function RulesGuide() {
  const concepts = guideContent.concepts;
  return <div className="grid gap-4 md:grid-cols-3">{concepts.map(([title, body, href]) => <article key={title} className="flex flex-col p-6 jshs-surface-card"><h2 className="text-xl">{title}</h2><p className="mt-3 flex-1 text-sm leading-7 jshs-muted-copy">{body}</p><Link href={href} className="mt-5 inline-flex w-fit px-4 py-3 text-sm jshs-button-secondary">前往相關功能 →</Link></article>)}</div>;
}

function Glossary() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("zh-TW");
  const matches = useMemo(() => terms.filter(([title, body]) => (title + body).toLocaleLowerCase("zh-TW").includes(normalized)), [normalized]);
  return <div className="grid gap-5"><div className="p-6 jshs-surface-card"><label className="grid gap-2 text-sm font-black">搜尋名詞<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：序位、群科、志願" /></label><div className="mt-5 grid gap-3">{matches.map(([title, body]) => <details key={title} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><summary className="cursor-pointer font-black text-[var(--jshs-primary)]">{title}</summary><p className="mt-2 text-sm leading-7 jshs-muted-copy">{body}</p></details>)}{!matches.length ? <p className="text-sm jshs-muted-copy">找不到詞，請換個關鍵字。</p> : null}</div></div><div><p className="jshs-eyebrow">常見迷思</p><div className="mt-3 grid gap-3 md:grid-cols-3">{misconceptions.map(([claim, answer]) => <details key={claim} className="p-5 jshs-surface-card"><summary className="cursor-pointer text-lg font-black">{claim}</summary><p className="mt-4 text-sm leading-7 jshs-muted-copy">{answer}</p></details>)}</div></div></div>;
}

function FitQuiz() {
  const [answers, setAnswers] = useState<string[]>([]);
  const options = guideContent.fitOptions;
  const choose = (index: number, value: string) => setAnswers((current) => { const next = [...current]; next[index] = value; return next; });
  const completed = answers.filter(Boolean).length === 3;
  const result = completed ? [...new Set(answers)].sort((a, b) => answers.filter((value) => value === b).length - answers.filter((value) => value === a).length)[0] : "";
  return <div className="p-6 jshs-surface-card"><div className="grid gap-4">{guideContent.fitQuestions.map((question, index) => <fieldset key={question}><legend className="text-sm font-black">{index + 1}. {question}</legend><div className="mt-2 grid gap-2">{options.map(([label, value]) => <button key={index + "-" + label} type="button" onClick={() => choose(index, value)} className={"p-3 text-left text-sm jshs-button " + (answers[index] === value ? "jshs-button-primary" : "jshs-button-secondary")}>{label}</button>)}</div></fieldset>)}</div>{result ? <p className="mt-5 rounded-2xl bg-[var(--jshs-brand-tint)] p-4 text-sm leading-7 text-[var(--jshs-primary)]">目前結果：優先比較「{result}」。這不是錄取判定，請再用課程與學校資料驗證。</p> : <p className="mt-5 text-sm jshs-muted-copy">請完成三題，系統會整理你的優先比較方向。</p>}<Link href="/schools" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-secondary">用學校資料驗證方向 →</Link></div>;
}

function GroupsGuide() {
  const groups = technicalGroupDirectory;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("all");
  const normalizedQuery = query.trim().toLocaleLowerCase("zh-TW");
  const filtered = groups.filter(({ group, programs }) => (selected === "all" || group === selected) && (!normalizedQuery || `${group} ${programs.map((program) => program.name).join(" ")}`.toLocaleLowerCase("zh-TW").includes(normalizedQuery)));
  return <div><section className="p-6 jshs-surface-card"><p className="jshs-eyebrow">技高群科探索</p><h2 className="mt-2 text-2xl">依群別與現有校科目錄探索</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">科別名稱來自現有學校目錄並保留來源 ID；尚未匯入官方課程資料時會直接標示待補。</p><div className="mt-5 grid gap-3 md:grid-cols-2"><label className="grid gap-2 text-sm font-black">搜尋科別或群別<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：電機、餐旅" /></label><label className="grid gap-2 text-sm font-black">群別篩選<select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="all">全部群別</option>{groups.map(({ group }) => <option key={group}>{group}</option>)}</select></label></div></section><section className="mt-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">群別 → 科別</p><h2 className="mt-2 text-2xl">{filtered.length} 個群別</h2></div></div><div className="mt-4 grid gap-4 md:grid-cols-2">{filtered.map(({ group, programs }) => <article key={group} className="p-5 jshs-surface-card"><h3 className="text-xl">{group}</h3><dl className="mt-4 grid gap-3 text-sm leading-6"><div><dt className="font-black">科別名稱</dt><dd className="jshs-muted-copy">{programs.length ? programs.map((program) => program.name).join("、") : "待補資料：現有學校目錄尚無可對應科別。"}</dd></div><div><dt className="font-black">主要學習內容／常見專業課程／可能升學方向</dt><dd className="jshs-muted-copy">待補資料：尚未匯入逐科可驗證的官方或校方課程來源。</dd></div></dl><Link href={`/schools?q=${encodeURIComponent(group)}`} className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-secondary">查看相關學校 →</Link></article>)}{!filtered.length ? <div className="rounded-2xl border border-dashed p-7 text-center text-sm leading-6 jshs-muted-copy">找不到符合條件的群別或科別，請調整搜尋或群別篩選。</div> : null}</div></section></div>;
}
