import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  formatNewsDate,
  getNewsArticle,
  getRelatedNews,
  newsArticles,
  type NewsArticle,
} from "@/lib/news";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return newsArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsArticle(slug);

  if (!article) return {};

  return {
    title: `${article.title}｜JSHS 升學情報`,
    description: article.description,
    keywords: [...article.keywords],
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      type: "article",
      locale: "zh_TW",
      url: `/news/${article.slug}`,
      siteName: "全國國中升學資訊網",
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      tags: [...article.keywords],
    },
    twitter: {
      card: "summary",
      title: article.title,
      description: article.description,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getNewsArticle(slug);

  if (!article) notFound();

  const relatedNews = getRelatedNews(article);
  const canonicalUrl = `https://jshs.cc/news/${article.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: "zh-TW",
    mainEntityOfPage: canonicalUrl,
    author: { "@type": "Organization", name: "JSHS 升學情報編輯部", url: "https://jshs.cc/news" },
    publisher: { "@type": "Organization", name: "全國國中升學資訊網", url: "https://jshs.cc" },
    keywords: article.keywords.join(", "),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: "https://jshs.cc/" },
      { "@type": "ListItem", position: 2, name: "升學情報", item: "https://jshs.cc/news" },
      { "@type": "ListItem", position: 3, name: article.title, item: canonicalUrl },
    ],
  };

  return (
    <main className="jshs-page-shell">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <SiteHeader activeHref="/news" />

      <article>
        <header className="jshs-hero-section">
          <div className="mx-auto w-[min(980px,calc(100%-32px))] py-14 md:py-20">
            <nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
              <Link href="/">首頁</Link><span aria-hidden="true">/</span><Link href="/news">升學情報</Link><span aria-hidden="true">/</span><span className="text-[var(--jshs-primary)]">{article.category}</span>
            </nav>
            <p className="mt-10 jshs-eyebrow">{article.kicker}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.16] tracking-[-.055em] md:text-6xl">{article.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 jshs-muted-copy">{article.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-slate-500">
              <span>JSHS 升學情報編輯部</span>
              <time dateTime={article.updatedAt}>更新於 {formatNewsDate(article.updatedAt)}</time>
              <span>{article.readMinutes} 分鐘閱讀</span>
              <span className="jshs-chip">{article.category}</span>
            </div>
          </div>
        </header>

        <div className="mx-auto grid w-[min(1120px,calc(100%-32px))] gap-12 py-14 lg:grid-cols-[minmax(0,760px)_280px] lg:items-start lg:justify-between lg:py-20">
          <div>
            <section aria-labelledby="article-summary" className="p-7 md:p-8 jshs-surface-card">
              <p className="jshs-eyebrow">先看結論</p>
              <h2 id="article-summary" className="mt-3 text-2xl font-black tracking-[-.035em]">這篇文章會幫你完成什麼</h2>
              <ul className="mt-5 space-y-3">
                {article.summary.map((item) => (
                  <li key={item} className="flex gap-3 leading-7 text-slate-700"><span className="mt-2 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--jshs-primary)] text-[10px] font-black text-white">✓</span><span>{item}</span></li>
                ))}
              </ul>
            </section>

            <div className="mt-12 space-y-12">
              {article.sections.map((section, index) => (
                <section key={section.heading} id={`section-${index + 1}`} className="scroll-mt-24">
                  <div className="flex items-start gap-4">
                    <span className="mt-1 text-sm font-black text-[var(--jshs-primary)]">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h2 className="text-3xl font-black leading-tight tracking-[-.045em]">{section.heading}</h2>
                      <div className="mt-5 space-y-5 text-[1.05rem] leading-8 text-slate-600">
                        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                      </div>
                      {section.bullets && (
                        <ul className="mt-6 grid gap-3 p-6 jshs-surface-card">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-3 leading-7 text-slate-700"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--jshs-primary)]" /><span>{bullet}</span></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <section aria-labelledby="official-sources" className="mt-14 p-7 md:p-8 jshs-surface-card">
              <p className="jshs-eyebrow">FACT CHECK</p>
              <h2 id="official-sources" className="mt-3 text-2xl font-black">官方資料來源</h2>
              <p className="mt-3 leading-7 jshs-muted-copy">以下連結用來核對本文的日期、招生入口或規則範圍。涉及報名權益時，請再次確認官方最新版本。</p>
              <ul className="mt-6 space-y-4">
                {article.sources.map((source) => (
                  <li key={source.url} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-5">
                    <a className="font-black text-[var(--jshs-primary)] underline decoration-blue-200 underline-offset-4 hover:decoration-[var(--jshs-primary)]" href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{source.note}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 p-8 md:p-10 jshs-surface-card">
              <p className="jshs-eyebrow">把方法用在自己身上</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">{article.cta.label}</h2>
              <p className="mt-3 max-w-2xl leading-7 jshs-muted-copy">{article.cta.detail}</p>
              <a className="mt-7 inline-flex px-5 py-3.5 text-sm jshs-button-primary" href={article.cta.href}>立即開始 →</a>
            </section>
          </div>

          <aside className="hidden lg:sticky lg:top-6 lg:block">
            <div className="p-6 jshs-surface-card">
              <p className="jshs-eyebrow">文章目錄</p>
              <ol className="mt-5 space-y-4 text-sm font-bold leading-6 text-slate-600">
                {article.sections.map((section, index) => (
                  <li key={section.heading}><a className="flex gap-3 hover:text-[var(--jshs-primary)]" href={`#section-${index + 1}`}><span className="text-slate-300">{String(index + 1).padStart(2, "0")}</span><span>{section.heading}</span></a></li>
                ))}
              </ol>
              <div className="mt-6 border-t border-slate-100 pt-5 text-xs leading-6 text-slate-400">
                最後更新<br /><time className="font-bold text-slate-600" dateTime={article.updatedAt}>{formatNewsDate(article.updatedAt)}</time>
              </div>
            </div>
          </aside>
        </div>
      </article>

      <RelatedArticles articles={relatedNews} />
      <SiteFooter />
    </main>
  );
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

function RelatedArticles({ articles }: { articles: readonly NewsArticle[] }) {
  return (
    <section className="border-t border-slate-200 bg-white py-16 md:py-20">
      <div className="mx-auto w-[min(1120px,calc(100%-32px))]">
        <div className="flex items-end justify-between gap-4"><div><p className="jshs-eyebrow">接著讀</p><h2 className="mt-3 text-3xl font-black tracking-[-.045em]">把下一個問題也弄懂</h2></div><Link className="hidden text-sm font-black text-[var(--jshs-primary)] md:block" href="/news">全部指南 →</Link></div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {articles.map((article) => (
            <a key={article.slug} href={`/news/${article.slug}`} className="group p-6 jshs-surface-card">
              <span className="text-xs font-black text-[var(--jshs-primary)]">{article.category} · {article.readMinutes} 分鐘</span>
              <h3 className="mt-4 text-xl font-black leading-snug tracking-[-.035em]">{article.title}</h3>
              <span className="mt-7 block text-sm font-black text-[var(--jshs-primary)]">閱讀指南 <span className="inline-block transition group-hover:translate-x-1">→</span></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
