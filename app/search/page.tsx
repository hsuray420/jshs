import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { newsArticles } from "@/lib/news";
import { schoolDirectory } from "@/lib/school-directory";
import districtMetadata from "../../public/it_hs/district-metadata.json";

export const metadata: Metadata = { title: "全站搜尋與升學百科", description: "搜尋學校、科系、群科、文章、規則名詞、重要日程與官方來源。", alternates: { canonical: "/search" } };

const terms = [
  ["超額比序", "入學規則", "把各項比序拆成可核對的資料與順序。", "/news/rules"],
  ["就學區", "規則名詞", "先確認適用區域，再選擇學校、工具與正式來源。", "/districts"],
  ["積分、序位、落點", "規則名詞", "三種不同證據，應用來設計風險區間，不是錄取保證。", "/news/rules"],
  ["普通高中／技高／綜高／五專", "學制分類", "先比較學習方式與後續路徑，再回到校科資料。", "/news/schools"],
  ["十五群科", "群科百科", "從群科名稱進一步理解課程、實習與適合的學習方式。", "/news/schools"],
] as const;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 80);
  const normalized = normalize(query);
  const schools = normalized ? schoolDirectory.filter((school) => normalize([school.name, school.code, school.city, school.area, school.program, school.departmentsRaw, ...school.groups].join(" ")).includes(normalized)).slice(0, 12) : [];
  const articles = normalized ? newsArticles.filter((article) => normalize([article.title, article.description, article.category, ...article.keywords].join(" ")).includes(normalized)).slice(0, 8) : [];
  const matchedTerms = normalized ? terms.filter(([title, category, body]) => normalize(`${title} ${category} ${body}`).includes(normalized)) : [];
  const dates = normalized ? districtMetadata.timelineDefaults.ready.filter((item) => normalize(`${item.title} ${item.detail} ${item.status}`).includes(normalized)) : [];
  const sources = normalized ? [...new Map(Object.entries(districtMetadata.districts).map(([code, district]) => [district.sourceUrl, { code, label: district.sourceName, url: district.sourceUrl }])).values()].filter((source) => normalize(`${source.label} ${source.code}`).includes(normalized)).slice(0, 8) : [];
  const hasResults = schools.length || articles.length || matchedTerms.length || dates.length || sources.length;

  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/search" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><p className="jshs-eyebrow">搜尋與百科中心</p><h1 className="mt-3 max-w-4xl">先看結論，再展開細節，最後回到工具。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">全站搜尋不只找學校，也把文章、群科、規則名詞、重要日程與官方來源放在同一個入口。</p><form className="mt-7 flex flex-col gap-2 sm:flex-row" action="/search" method="get"><label className="sr-only" htmlFor="site-search">搜尋全站內容</label><input id="site-search" name="q" defaultValue={query} placeholder="搜尋學校、科系、會考、超額比序、群科…" className="min-h-12 flex-1" /><button className="px-5 py-3 jshs-button-primary" type="submit">搜尋</button></form></div></section>
    <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10">{query ? <><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">搜尋結果</p><h2 className="mt-2">「{query}」</h2></div><span className="text-sm jshs-muted-copy">{hasResults ? "找到相關內容" : "目前沒有直接結果"}</span></div>{hasResults ? <div className="mt-7 grid gap-8">{schools.length ? <ResultGroup title="學校／校科" eyebrow="SCHOOLS"><div className="grid gap-3 md:grid-cols-2">{schools.map((school) => <ResultCard key={`${school.districtCode}-${school.code}`} title={school.name} category="學校" body={`${school.districtLabel} · ${school.program || "學制分類待確認"} · ${school.departmentsRaw || "科系待補"}`} href={`/schools/${school.districtCode}/${school.code}`} meta={`${school.academicYear} 學年度 · ${school.dataStatus === "ready" ? "已校核" : "參考資料"}`} />)}</div></ResultGroup> : null}{articles.length ? <ResultGroup title="升學指南文章" eyebrow="ARTICLES"><div className="grid gap-3 md:grid-cols-2">{articles.map((article) => <ResultCard key={article.slug} title={article.title} category={article.category} body={article.description} href={`/news/${article.slug}`} meta={`更新 ${article.updatedAt} · ${article.districtScope}`} />)}</div></ResultGroup> : null}{matchedTerms.length ? <ResultGroup title="百科與規則名詞" eyebrow="KNOWLEDGE"><div className="grid gap-3 md:grid-cols-2">{matchedTerms.map(([title, category, body, href]) => <ResultCard key={title} title={title} category={category} body={body} href={href} meta="先看一句話結論，再展開完整說明" />)}</div></ResultGroup> : null}{dates.length ? <ResultGroup title="重要日程" eyebrow="DATES"><div className="grid gap-3 md:grid-cols-2">{dates.map((item) => <ResultCard key={item.title} title={item.title} category="重要日程" body={item.detail} href="/news/exam" meta={`${item.date} · ${item.status}`} />)}</div></ResultGroup> : null}{sources.length ? <ResultGroup title="官方來源" eyebrow="OFFICIAL SOURCES"><div className="grid gap-3 md:grid-cols-2">{sources.map((source) => <ResultCard key={source.url} title={source.label} category="官方來源" body={`就學區代碼：${source.code.toUpperCase()}`} href={source.url} meta="外部官方網站" external />)}</div></ResultGroup> : null}</div> : <div className="mt-7 p-7 text-center jshs-surface-card"><h2 className="text-xl">先換一個關鍵字</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">可以搜尋「學校名稱」、「資訊科」、「會考」、「超額比序」或「志願」。</p></div>}</> : <BrowseIndex />}</section><SiteFooter /></main>;
}

function BrowseIndex() { return <div><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="jshs-eyebrow">三段式百科</p><h2 className="mt-2">你現在想了解哪一類？</h2></div><Link href="/districts" className="text-sm text-[var(--jshs-primary)]">先選就學區 →</Link></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{terms.map(([title, category, body, href]) => <ResultCard key={title} title={title} category={category} body={body} href={href} meta="先看結論 → 展開細節 → 前往工具" />)}</div><div className="mt-8 grid gap-3 md:grid-cols-3"><QuickLink title="會考準備" body="重要日期、準備路線與考前任務" href="/news/exam" /><QuickLink title="入學規則" body="免試、比序、跨區與序位" href="/news/rules" /><QuickLink title="志願策略" body="挑戰、適中、穩定與排序" href="/news/strategy" /></div></div>; }
function ResultGroup({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) { return <section><p className="jshs-eyebrow">{eyebrow}</p><h2 className="mt-2">{title}</h2><div className="mt-4">{children}</div></section>; }
function ResultCard({ title, category, body, href, meta, external = false }: { title: string; category: string; body: string; href: string; meta: string; external?: boolean }) { return <a className="group block p-5 jshs-surface-card" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}><span className="jshs-chip">{category}</span><h3 className="mt-3 text-lg">{title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><small className="mt-3 block text-xs text-slate-500">{meta}</small><b className="mt-4 block text-sm text-[var(--jshs-primary)]">查看內容 {external ? "↗" : "→"}</b></a>; }
function QuickLink({ title, body, href }: { title: string; body: string; href: string }) { return <Link href={href} className="p-5 jshs-surface-card"><h3 className="text-lg">{title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><span className="mt-4 block text-sm text-[var(--jshs-primary)]">前往指南 →</span></Link>; }
function normalize(value: string) { return value.replace(/臺/g, "台").trim().toLocaleLowerCase("zh-TW"); }
