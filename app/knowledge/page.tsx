import type { Metadata } from "next";
import Link from "next/link";
import { KnowledgeHelper } from "@/components/knowledge-helper";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { listPublishedContent, parseContentBody } from "@/db/content-store";

export const metadata: Metadata = { title: "升學知識｜免試入學、名詞百科與學制探索", description: "用三分鐘入門、名詞百科、迷思破解與學制適合度探索，建立自己的升學判斷基礎。", alternates: { canonical: "/knowledge" } };

const knowledgeCards = [
  ["免試入學", "3 分鐘看懂免試入學", "先理解就學區、規則、積分與志願的關係，再進入適用地區。", "/knowledge/admission-basics"],
  ["迷思", "常見迷思破解", "分清楚官方規則、歷年參考、推估與不能保證的事情。", "/knowledge/misconceptions"],
  ["經驗", "過來人經驗談", "把選校時常遇到的學習、通勤、家庭討論問題整理成提問。", "/knowledge/alumni-stories"],
  ["影音", "短影音系列", "每次只理解一個概念：適合在通勤或等待時快速複習。", "/knowledge/videos"],
  ["podcast", "Podcast／語音版", "把文章轉成可以朗讀的重點，先聽結論再回看來源。", "/knowledge/podcast"],
  ["科系地圖", "未來銜接大學科系地圖", "從學制與群科看後續可能路徑，不把任何一條路說成唯一答案。", "/knowledge/career-map"],
] as const;

export default async function KnowledgePage() {
  const [terms, cards] = await Promise.all([listPublishedContent("knowledge_term"), listPublishedContent("knowledge_card")]);
  const editableTerms = terms.length ? terms.map((entry) => [entry.title, parseContentBody(entry, { body: entry.summary }).body] as const) : undefined;
  const editableCards = cards.length ? cards.map((entry) => { const body = parseContentBody(entry, { eyebrow: "知識主題", href: "/news" }); return [body.eyebrow, entry.title, entry.summary, safeInternalHref(body.href)] as const; }) : knowledgeCards;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1160px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">升學知識中心</p><h1 className="mt-3 max-w-4xl">先建立自己的判斷，再使用工具。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">升學不是只查一個分數。從制度入門、名詞、學制、群科到未來方向，先找到你真正想比較的問題。</p></div></section><section id="免試入學" className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><div className="p-6 md:p-8 jshs-surface-card"><p className="jshs-eyebrow">3 分鐘看懂免試入學</p><h2 className="mt-2">四個問題，串起完整流程</h2><div className="mt-6 grid gap-3 md:grid-cols-4">{[["1", "我適用哪一區？", "先選就學區"], ["2", "規則怎麼算？", "查看比序"], ["3", "我想去哪裡？", "比較校科"], ["4", "怎麼排比較穩？", "建立三層志願"]].map(([number, title, detail]) => <div key={number} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><span className="jshs-icon-tile">{number}</span><h3 className="mt-3 text-base">{title}</h3><p className="mt-1 text-sm text-[var(--jshs-primary)]">{detail}</p></div>)}</div><div className="mt-5 flex flex-wrap gap-2"><Link href="/districts" className="px-4 py-3 text-sm jshs-button-primary">先選就學區</Link><Link href="/schools" className="px-4 py-3 text-sm jshs-button-secondary">開始查學校</Link></div></div></section><KnowledgeHelper terms={editableTerms} /><section id="迷思" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8"><div className="grid gap-4 md:grid-cols-3">{editableCards.map(([eyebrow, title, body, href]) => <Link key={title} href={href} className="flex min-h-48 flex-col p-5 jshs-surface-card"><p className="jshs-eyebrow">{eyebrow}</p><h2 className="mt-2 text-xl">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><b className="mt-auto pt-5 text-sm text-[var(--jshs-primary)]">開始閱讀 →</b></Link>)}</div></section><SiteFooter /></main>;
}

function safeInternalHref(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/news";
}
