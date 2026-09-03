import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ContentRenderer } from "@/components/content-renderer";
import { formatNewsDate, getNewsArticle, getRelatedNews, newsArticles } from "@/lib/news";

type ArticlePageProps = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return newsArticles.map((article) => ({ slug: article.slug })); }
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> { const article = getNewsArticle((await params).slug); if (!article) return { title: "找不到文章｜全國國中升學資訊網", robots: { index: false, follow: false } }; return { title: `${article.title}｜升學情報`, description: article.description, alternates: { canonical: `/news/${article.slug}` } }; }
export default async function NewsArticlePage({ params }: ArticlePageProps) {
  const article = getNewsArticle((await params).slug); if (!article) notFound(); const related = getRelatedNews(article);
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><article className="mx-auto w-[min(900px,calc(100%-32px))] py-12 md:py-16"><Link href="/news" className="text-sm font-black text-[var(--jshs-primary)]">← 回到升學情報</Link><p className="mt-8 jshs-eyebrow">{article.category} · {article.kicker}</p><h1 className="mt-3 text-4xl leading-tight md:text-6xl">{article.title}</h1><p className="mt-5 text-lg leading-8 jshs-muted-copy">{article.description}</p><p className="mt-4 text-sm text-slate-500">更新於 {formatNewsDate(article.updatedAt)} · 約 {article.readMinutes} 分鐘</p><div className="mt-8 rounded-2xl bg-[var(--jshs-brand-tint)] p-5 leading-7"><strong>先記住：</strong>{article.oneLineConclusion}</div><ContentRenderer content={article.content} /><div className="mt-10 rounded-2xl border border-[var(--jshs-border)] p-5"><h2 className="text-xl">下一步</h2><p className="mt-2 leading-7 jshs-muted-copy">{article.cta.detail}</p><Link href={article.cta.href} className="mt-4 inline-flex px-4 py-3 text-sm jshs-button-primary">{article.cta.label} →</Link></div>{related.length ? <section className="mt-12"><h2 className="text-xl">延伸閱讀</h2><div className="mt-4 grid gap-3">{related.map((item) => <Link key={item.slug} href={`/news/${item.slug}`} className="p-4 jshs-surface-card"><strong>{item.title}</strong><span className="mt-1 block text-sm jshs-muted-copy">{item.description}</span></Link>)}</div></section> : null}</article><SiteFooter /></main>;
}
