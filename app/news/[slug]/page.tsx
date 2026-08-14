import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
      { "@type": "ListItem", position: 1, name: "首頁", item: "https://jshs.cc/jshs/home" },
      { "@type": "ListItem", position: 2, name: "升學情報", item: "https://jshs.cc/news" },
      { "@type": "ListItem", position: 3, name: article.title, item: canonicalUrl },
    ],
  };

  return (
    <main className="bg-[#f5f8fc] text-[#14213d]">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ArticleHeader />

      <article>
        <header className="border-y border-blue-100 bg-[radial-gradient(circle_at_85%_0%,#dcecff,transparent_32%),linear-gradient(135deg,#fff,#edf5ff)]">
          <div className="mx-auto w-[min(980px,calc(100%-32px))] py-14 md:py-20">
            <nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
              <a href="/jshs/home">首頁</a><span aria-hidden="true">/</span><Link href="/news">升學情報</Link><span aria-hidden="true">/</span><span className="text-[#2868d7]">{article.category}</span>
            </nav>
            <p className="mt-10 text-xs font-black tracking-[.18em] text-[#ba6b18]">{article.kicker}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.16] tracking-[-.055em] md:text-6xl">{article.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{article.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-slate-500">
              <span>JSHS 升學情報編輯部</span>
              <time dateTime={article.updatedAt}>更新於 {formatNewsDate(article.updatedAt)}</time>
              <span>{article.readMinutes} 分鐘閱讀</span>
              <span className="rounded-full bg-white px-3 py-1 text-[#2868d7] shadow-sm">{article.category}</span>
            </div>
          </div>
        </header>

        <div className="mx-auto grid w-[min(1120px,calc(100%-32px))] gap-12 py-14 lg:grid-cols-[minmax(0,760px)_280px] lg:items-start lg:justify-between lg:py-20">
          <div>
            <section aria-labelledby="article-summary" className="rounded-3xl border border-blue-100 bg-[#eaf3ff] p-7 md:p-8">
              <p className="text-xs font-black tracking-[.16em] text-[#2868d7]">先看結論</p>
              <h2 id="article-summary" className="mt-3 text-2xl font-black tracking-[-.035em]">這篇文章會幫你完成什麼</h2>
              <ul className="mt-5 space-y-3">
                {article.summary.map((item) => (
                  <li key={item} className="flex gap-3 leading-7 text-slate-700"><span className="mt-2 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#173d78] text-[10px] font-black text-white">✓</span><span>{item}</span></li>
                ))}
              </ul>
            </section>

            <div className="mt-12 space-y-12">
              {article.sections.map((section, index) => (
                <section key={section.heading} id={`section-${index + 1}`} className="scroll-mt-24">
                  <div className="flex items-start gap-4">
                    <span className="mt-1 text-sm font-black text-[#2868d7]">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h2 className="text-3xl font-black leading-tight tracking-[-.045em]">{section.heading}</h2>
                      <div className="mt-5 space-y-5 text-[1.05rem] leading-8 text-slate-600">
                        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                      </div>
                      {section.bullets && (
                        <ul className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-3 leading-7 text-slate-700"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ba6b18]" /><span>{bullet}</span></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <section aria-labelledby="official-sources" className="mt-14 rounded-3xl border border-slate-200 bg-white p-7 md:p-8">
              <p className="text-xs font-black tracking-[.16em] text-[#147a67]">FACT CHECK</p>
              <h2 id="official-sources" className="mt-3 text-2xl font-black">官方資料來源</h2>
              <p className="mt-3 leading-7 text-slate-500">以下連結用來核對本文的日期、招生入口或規則範圍。涉及報名權益時，請再次確認官方最新版本。</p>
              <ul className="mt-6 space-y-4">
                {article.sources.map((source) => (
                  <li key={source.url} className="rounded-2xl bg-[#f7fafc] p-5">
                    <a className="font-black text-[#173d78] underline decoration-blue-200 underline-offset-4 hover:decoration-[#173d78]" href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{source.note}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 rounded-[2rem] bg-[#173d78] p-8 text-white shadow-2xl shadow-blue-950/15 md:p-10">
              <p className="text-xs font-black tracking-[.16em] text-[#ffd2bb]">把方法用在自己身上</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.045em] text-white">{article.cta.label}</h2>
              <p className="mt-3 max-w-2xl leading-7 text-blue-100">{article.cta.detail}</p>
              <a className="mt-7 inline-flex rounded-xl bg-white px-5 py-3.5 text-sm font-black text-[#173d78] shadow-lg" href={article.cta.href}>立即開始 →</a>
            </section>
          </div>

          <aside className="hidden lg:sticky lg:top-6 lg:block">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black tracking-[.16em] text-[#2868d7]">文章目錄</p>
              <ol className="mt-5 space-y-4 text-sm font-bold leading-6 text-slate-600">
                {article.sections.map((section, index) => (
                  <li key={section.heading}><a className="flex gap-3 hover:text-[#173d78]" href={`#section-${index + 1}`}><span className="text-slate-300">{String(index + 1).padStart(2, "0")}</span><span>{section.heading}</span></a></li>
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
      <ArticleFooter />
    </main>
  );
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

function ArticleHeader() {
  return (
    <header className="bg-white">
      <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4 py-5">
        <a className="flex items-center gap-2.5 font-black tracking-tight" href="/jshs/home"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173d78] text-lg text-white">↗</span><span>全國國中升學資訊網</span></a>
        <nav aria-label="主要導覽" className="hidden items-center gap-6 text-sm font-bold text-slate-500 md:flex"><Link className="text-[#173d78]" href="/news">升學情報</Link><a href="/jshs/home#districts">選擇就學區</a><a href="/jshs/home#tools">升學工具</a></nav>
        <a className="rounded-xl bg-[#173d78] px-4 py-2.5 text-sm font-extrabold text-white" href="/it_hs/it_hs.html">開始查校</a>
      </div>
    </header>
  );
}

function RelatedArticles({ articles }: { articles: readonly NewsArticle[] }) {
  return (
    <section className="border-t border-slate-200 bg-white py-16 md:py-20">
      <div className="mx-auto w-[min(1120px,calc(100%-32px))]">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black tracking-[.16em] text-[#2868d7]">接著讀</p><h2 className="mt-3 text-3xl font-black tracking-[-.045em]">把下一個問題也弄懂</h2></div><Link className="hidden text-sm font-black text-[#173d78] md:block" href="/news">全部指南 →</Link></div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {articles.map((article) => (
            <a key={article.slug} href={`/news/${article.slug}`} className="group rounded-3xl border border-slate-200 bg-[#fbfdff] p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10">
              <span className="text-xs font-black text-[#2868d7]">{article.category} · {article.readMinutes} 分鐘</span>
              <h3 className="mt-4 text-xl font-black leading-snug tracking-[-.035em]">{article.title}</h3>
              <span className="mt-7 block text-sm font-black text-[#173d78]">閱讀指南 <span className="inline-block transition group-hover:translate-x-1">→</span></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#f7fafc] py-9">
      <div className="mx-auto flex w-[min(1120px,calc(100%-32px))] flex-col justify-between gap-4 text-sm text-slate-500 md:flex-row md:items-center">
        <b className="text-[#14213d]">全國國中升學資訊網</b>
        <div className="flex gap-5 font-bold"><Link href="/news">升學情報</Link><a href="/jshs/home#districts">就學區</a><a href="/it_hs/it_hs.html">校科查詢</a></div>
        <span>招生資訊請以各主管機關最新公告為準。</span>
      </div>
    </footer>
  );
}
