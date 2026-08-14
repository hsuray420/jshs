import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatNewsDate, getNewsArticle, type NewsArticle } from "@/lib/news";
import { getNewsCategoryHub, newsCategories, siteMapUpdatedAt } from "@/lib/site-map";

function requireCategory(slug: string) {
  const category = getNewsCategoryHub(slug);
  if (!category) throw new Error(`Unknown news category: ${slug}`);
  return category;
}

export function getNewsCategoryMetadata(slug: string): Metadata {
  const category = requireCategory(slug);
  const title = `${category.title}｜JSHS 升學情報`;

  return {
    title,
    description: category.description,
    alternates: { canonical: category.href },
    openGraph: {
      type: "website",
      locale: "zh_TW",
      url: category.href,
      siteName: "全國國中升學資訊網",
      title,
      description: category.description,
    },
    twitter: { card: "summary", title, description: category.description },
  };
}

export function NewsCategoryPage({ categorySlug }: { categorySlug: string }) {
  const category = requireCategory(categorySlug);
  const articles = category.articleSlugs
    .map((slug) => getNewsArticle(slug))
    .filter((article): article is NewsArticle => Boolean(article));
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.title}｜JSHS 升學情報`,
    url: `https://jshs.cc${category.href}`,
    description: category.description,
    dateModified: siteMapUpdatedAt,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://jshs.cc/news/${article.slug}`,
        name: article.title,
      })),
    },
  };

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#14213d]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <SiteHeader activeHref="/news" />

      <section className="border-b border-blue-100 bg-[radial-gradient(circle_at_85%_0%,#dcecff,transparent_32%),linear-gradient(135deg,#fff,#edf5ff)]">
        <div className="mx-auto w-[min(1080px,calc(100%-32px))] py-14 md:py-20">
          <nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
            <Link href="/">首頁</Link><span aria-hidden="true">/</span><Link href="/news">升學情報</Link><span aria-hidden="true">/</span><span className="text-[#2868d7]">{category.title}</span>
          </nav>
          <p className="mt-10 text-xs font-black tracking-[.18em] text-[#2868d7]">{category.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-.055em] md:text-7xl">{category.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{category.description}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {category.topics.map((topic) => <span key={topic} className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-extrabold text-[#173d78] shadow-sm">{topic}</span>)}
          </div>
        </div>
      </section>

      <section aria-labelledby="category-guides" className="mx-auto w-[min(1080px,calc(100%-32px))] py-14 md:py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black tracking-[.16em] text-[#ba6b18]">精選指南</p>
            <h2 id="category-guides" className="mt-3 text-4xl font-black tracking-[-.05em]">先從能立即完成的問題開始</h2>
          </div>
          <p className="max-w-md leading-7 text-slate-500">內容更新於 {formatNewsDate(siteMapUpdatedAt)}，涉及權益的規則仍以官方最新公告為準。</p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {articles.map((article) => (
            <Link key={article.slug} href={`/news/${article.slug}`} className="group flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10">
              <span className="text-xs font-black text-[#2868d7]">{article.kicker} · {article.readMinutes} 分鐘</span>
              <h2 className="mt-5 text-2xl font-black leading-snug tracking-[-.04em]">{article.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-500">{article.description}</p>
              <b className="mt-auto pt-8 text-sm text-[#173d78]">閱讀完整指南 <span className="inline-block transition group-hover:translate-x-1">→</span></b>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-blue-100 bg-[#eaf3ff] py-14">
        <div className="mx-auto flex w-[min(1080px,calc(100%-32px))] flex-col justify-between gap-6 rounded-[2rem] bg-[#173d78] p-8 text-white md:flex-row md:items-center md:p-10">
          <div><p className="text-xs font-black tracking-[.16em] text-blue-200">從內容進入決策</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-white">讀懂之後，完成自己的下一步。</h2></div>
          <Link className="shrink-0 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-[#173d78]" href={category.nextHref}>{category.nextLabel} →</Link>
        </div>
      </section>

      <nav aria-label="其他情報分類" className="mx-auto flex w-[min(1080px,calc(100%-32px))] flex-wrap gap-2 py-10">
        {newsCategories.map((item) => <Link key={item.slug} href={item.href} aria-current={item.slug === category.slug ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-extrabold ${item.slug === category.slug ? "bg-[#173d78] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item.title}</Link>)}
      </nav>

      <SiteFooter />
    </main>
  );
}
