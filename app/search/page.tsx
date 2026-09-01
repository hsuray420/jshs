import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { commonSearchEntrypoints, searchSite, searchSuggestions, type SearchResult } from "@/lib/search-index";

export const metadata: Metadata = { title: "全站搜尋與升學百科", description: "搜尋學校、科系、群科、文章、規則名詞、重要日程與官方來源。", alternates: { canonical: "/search" }, robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 80);
  const results = searchSite(query);
  const groups = groupResults(results);
  const hasResults = results.length > 0;

  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/search" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">全站搜尋</p><h1 className="mt-3 max-w-4xl">先找對內容，再回到正確功能。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">搜尋學校、科別、學制分類、升學指南、官方簡章、規則、公告與功能；每個結果都會標示內容類型。</p><form className="mt-7 flex flex-col gap-2 sm:flex-row" action="/search" method="get"><label className="sr-only" htmlFor="site-search">搜尋全站內容</label><input id="site-search" name="q" defaultValue={query} placeholder="學校、科系、會考、超額比序、群科…" className="min-h-12 flex-1" /><button className="px-5 py-3 jshs-button-primary" type="submit">搜尋</button></form></div></section>
    <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10">{query ? <><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">搜尋結果</p><h2 className="mt-2">「{query}」</h2></div><span className="text-sm jshs-muted-copy">{hasResults ? `找到 ${results.length} 筆相關內容` : "目前沒有直接結果"}</span></div>{hasResults ? <div className="mt-7 grid gap-8">{groups.map(([category, items]) => <ResultGroup key={category} title={category} eyebrow={category}><div className="grid gap-3 md:grid-cols-2">{items.map((item) => <ResultCard key={item.id} title={item.title} category={item.category} body={item.body} href={item.href} meta={item.meta} external={item.external} />)}</div></ResultGroup>)}</div> : <EmptySearchState />}</> : <BrowseIndex />}</section><SiteFooter /></main>;
}

function BrowseIndex() { return <div><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">全站搜尋</p><h2 className="mt-2">你現在想了解哪一類？</h2></div><Link href="/schools" className="text-sm text-[var(--jshs-primary)]">先找學校 →</Link></div><div className="mt-6 flex flex-wrap gap-2">{searchSuggestions.map((term) => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="jshs-chip">{term}</Link>)}</div><div className="mt-8 grid gap-3 md:grid-cols-3">{commonSearchEntrypoints.map((item) => <QuickLink key={item.href} title={item.title} body={item.category} href={item.href} />)}</div></div>; }
function EmptySearchState() { return <div className="mt-7 p-7 jshs-surface-card"><h2 className="text-xl">先換一個關鍵字</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">檢查是否有錯字，或改用較短的學校名、科別、就學區、規則名稱。</p><div className="mt-5 flex flex-wrap gap-2">{searchSuggestions.map((term) => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="jshs-chip">{term}</Link>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{commonSearchEntrypoints.map((item) => <QuickLink key={item.href} title={item.title} body={item.category} href={item.href} />)}</div></div>; }
function ResultGroup({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) { return <section><p className="jshs-eyebrow">{eyebrow}</p><h2 className="mt-2">{title}</h2><div className="mt-4">{children}</div></section>; }
function ResultCard({ title, category, body, href, meta, external = false }: { title: string; category: string; body: string; href: string; meta: string; external?: boolean }) { return <a className="group block p-5 jshs-surface-card" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}><span className="jshs-chip">{category}</span><h3 className="mt-3 text-lg">{title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><small className="mt-3 block text-xs text-slate-500">{meta}</small><b className="mt-4 block text-sm text-[var(--jshs-primary)]">查看內容 {external ? "↗" : "→"}</b></a>; }
function QuickLink({ title, body, href }: { title: string; body: string; href: string }) { return <Link href={href} className="p-5 jshs-surface-card"><h3 className="text-lg">{title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><span className="mt-4 block text-sm text-[var(--jshs-primary)]">前往指南 →</span></Link>; }
function groupResults(results: readonly SearchResult[]) {
  const order = ["學校", "科別", "升學指南", "積分規則", "官方資訊", "日程", "功能", "Trust", "公告"] as const;
  return order.map((category) => [category, results.filter((item) => item.category === category).slice(0, 12)] as const).filter(([, items]) => items.length);
}
