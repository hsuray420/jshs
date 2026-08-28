"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type Topic = "admission-basics" | "rules" | "glossary" | "fit-quiz" | "groups";

const pageCopy: Record<Topic, readonly [string, string]> = {
  "admission-basics": ["升學入門", "從會考、積分、序位、志願到放榜，先建立完整流程。"],
  rules: ["志願與積分", "用白話理解判斷概念，再回到精確規則與試算工具。"],
  glossary: ["升學百科", "搜尋名詞、常見迷思與制度說明，分清楚資料與推估。"],
  "fit-quiz": ["生涯探索", "探索普通高中、技高與五專的學習方式與未來方向。"],
  groups: ["群科介紹", "從學習內容、常見科別與後續方向認識群科。"],
};

const terms = [
  ["超額比序", "當申請人數超過名額時，依招生區公告的項目與順序比較。"],
  ["序位", "依同區規則與資料產生的排序位置，本站試算不等於正式序位。"],
  ["免試入學", "依就學區規則、成績與志願選填辦理的入學管道。"],
  ["志願序", "你填寫學校或校科的先後順序，實際計分依各區規則。"],
  ["群科", "技術型高中把相近的專業學習內容整理成群科。"],
  ["五專", "五年制專科學校，完成後取得副學士學位。"],
] as const;

const misconceptions = [
  ["分數越高就一定能錄取", "不一定。名額、志願序、同分比序與資格審查都可能影響結果。"],
  ["歷年最低分就是今年門檻", "不是。歷年資料只能參考，不能當成今年錄取保證。"],
  ["技高只適合不想讀書的人", "不是。技高有完整的專業課程、實作與升學路徑。"],
] as const;

const pathways = [
  ["普通高中", "重視學科基礎與升學準備", "大學學系、學術研究、跨領域探索"],
  ["技術型高中", "專業群科、實作與證照", "科技大學、技專校院、產學與就業"],
  ["五專", "五年制專業學習", "副學士、二技、專業職涯"],
] as const;

export function KnowledgeTopicWorkspace({ topic }: { topic: Topic }) {
  const [title, description] = pageCopy[topic];
  return <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><div className="mb-6"><p className="jshs-eyebrow">{topic === "groups" ? "找學校 · 群科探索" : "升學指南"}</p><h1 className="mt-2">{title}</h1><p className="mt-3 max-w-3xl text-base leading-7 jshs-muted-copy">{description}</p></div>{topic === "admission-basics" ? <Basics /> : topic === "rules" ? <RulesGuide /> : topic === "glossary" ? <Glossary /> : topic === "fit-quiz" ? <FitQuiz /> : <GroupsGuide />}</section>;
}

function Basics() {
  const steps = [
    ["確認就學區", "就學區決定適用規則、日期與可填學校範圍。", "/schools"],
    ["完成成績試算", "先輸入會考與本區規則欄位，取得自己的分數依據。", "/tools"],
    ["查詢校科", "比較課程、群科、通勤、名額與歷年錄取參考。", "/schools"],
    ["整理志願", "選擇系統推薦或自己排，建立願意就讀的清單。", "/planner"],
  ] as const;
  const [active, setActive] = useState(0);
  return <div className="grid gap-4 md:grid-cols-[280px_1fr]"><nav className="grid gap-2" aria-label="升學入門步驟">{steps.map(([title], index) => <button key={title} type="button" onClick={() => setActive(index)} className={"p-4 text-left text-sm jshs-button " + (active === index ? "jshs-button-primary" : "jshs-button-secondary")}>{index + 1}. {title}</button>)}</nav><article className="p-6 jshs-surface-card"><p className="jshs-eyebrow">第 {active + 1} 步</p><h2 className="mt-2">{steps[active][0]}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">{steps[active][1]}</p><Link href={steps[active][2]} className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary">前往操作 →</Link></article></div>;
}

function RulesGuide() {
  const concepts = [
    ["積分", "把會考、多元學習表現與其他採計項目依就學區規則換算成比較依據。", "/tools/rules"],
    ["序位與同分比序", "分數相同時，招生區會依正式規則繼續比較；本站只整理與計算，不產生官方序位。", "/tools/summary"],
    ["志願序", "志願排列會影響分發結果，請先依願意就讀程度排序，再用健檢找出資料缺口。", "/planner/custom"],
  ] as const;
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
  const options = [["我喜歡理解原理與閱讀", "普通高中"], ["我喜歡實作與完成作品", "技術型高中"], ["我想保留兩種方向", "綜合高中／比較三種學制"]] as const;
  const choose = (index: number, value: string) => setAnswers((current) => { const next = [...current]; next[index] = value; return next; });
  const completed = answers.filter(Boolean).length === 3;
  const result = completed ? [...new Set(answers)].sort((a, b) => answers.filter((value) => value === b).length - answers.filter((value) => value === a).length)[0] : "";
  return <div className="p-6 jshs-surface-card"><div className="grid gap-4">{["平常最有興趣的學習方式？", "你希望先專注哪種內容？", "你對未來方向的想法？"].map((question, index) => <fieldset key={question}><legend className="text-sm font-black">{index + 1}. {question}</legend><div className="mt-2 grid gap-2">{options.map(([label, value]) => <button key={index + "-" + label} type="button" onClick={() => choose(index, value)} className={"p-3 text-left text-sm jshs-button " + (answers[index] === value ? "jshs-button-primary" : "jshs-button-secondary")}>{label}</button>)}</div></fieldset>)}</div>{result ? <p className="mt-5 rounded-2xl bg-[var(--jshs-brand-tint)] p-4 text-sm leading-7 text-[var(--jshs-primary)]">目前結果：優先比較「{result}」。這不是錄取判定，請再用課程與學校資料驗證。</p> : <p className="mt-5 text-sm jshs-muted-copy">請完成三題，系統會整理你的優先比較方向。</p>}<Link href="/schools" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-secondary">用學校資料驗證方向 →</Link></div>;
}

function GroupsGuide() {
  return <div className="grid gap-4 md:grid-cols-3">{pathways.slice(1).map(([title, learning, future]) => <article key={title} className="p-6 jshs-surface-card"><h2 className="text-xl">{title}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">{learning}</p><div className="mt-5 rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><strong>後續方向</strong><p className="mt-2 text-sm leading-7 jshs-muted-copy">{future}</p></div><Link href="/schools" className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-secondary">回到校科查詢 →</Link></article>)}</div>;
}
