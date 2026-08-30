import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatNewsDate, newsArticles } from "@/lib/news";

export const metadata: Metadata = { title: "升學動態｜升學指南", description: "JSHS 編輯整理的升學消息、制度更新、重要提醒與白話解析。", alternates: { canonical: "/knowledge/updates" } };

export default function KnowledgeUpdatesPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-12"><p className="jshs-eyebrow">升學指南 · 升學動態</p><h1 className="mt-3">JSHS 整理的升學動態</h1><p className="mt-4 max-w-3xl leading-7 jshs-muted-copy">這裡收納本站編輯的升學消息、制度更新與重要提醒；正式公告、簡章與招生單位原始文件仍在「官方資訊」。</p></div></section><section className="mx-auto grid w-[min(1120px,calc(100%-32px))] gap-4 py-10 md:grid-cols-2">{newsArticles.map((article) => <Link key={article.slug} href={`/news/${article.slug}`} className="p-6 jshs-surface-card"><p className="jshs-eyebrow">{article.category} · {formatNewsDate(article.updatedAt)}</p><h2 className="mt-2 text-xl">{article.title}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">{article.description}</p><span className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]">閱讀 JSHS 整理 →</span></Link>)}</section><SiteFooter /></main>;
}
