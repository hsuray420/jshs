import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  formatNewsDate,
  getFeaturedNews,
  getNewsCategories,
  newsArticles,
  newsUpdatedAt,
  type NewsArticle,
} from "@/lib/news";
import { newsCategories } from "@/lib/site-map";

const pageTitle = "升學情報中心｜會考時程、入學規則與志願策略";
const pageDescription = "以官方資料為底，整理國中教育會考、高中職免試入學、就學區、志願選填與五專升學的可執行指南。";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: ["國中教育會考", "高中免試入學", "志願選填", "高中職升學", "五專"],
  alternates: { canonical: "/news" },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/news",
    siteName: "全國國中升學資訊網",
    title: pageTitle,
    description: pageDescription,
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

const featuredNews = getFeaturedNews();
const categories = getNewsCategories();

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "JSHS 升學情報中心",
  url: "https://jshs.cc/news",
  description: pageDescription,
  dateModified: newsUpdatedAt,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: newsArticles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://jshs.cc/news/${article.slug}`,
      name: article.title,
    })),
  },
};

export default function NewsPage() {
  return (
    <main className="jshs-page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c") }}
      />
      <SiteHeader activeHref="/news" />

      <section className="jshs-hero-section">
        <div className="relative mx-auto grid w-[min(1180px,calc(100%-32px))] gap-12 py-16 lg:grid-cols-[1.18fr_.82fr] lg:items-end lg:py-24">
          <div className="relative">
            <p className="jshs-eyebrow">JSHS 升學情報中心</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.08] tracking-[-.055em] md:text-7xl">
              先讀懂規則，<br />再做關鍵選擇。
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 jshs-muted-copy">
              不追逐來路不明的分數線。從官方公告出發，把會考、就學區、積分與志願整理成現在就能完成的下一步。
            </p>
          </div>
          <aside className="relative p-7 md:p-8 jshs-surface-card">
            <span className="jshs-chip">本期重點</span>
            <p className="mt-5 text-sm font-bold text-[var(--jshs-primary)]">已確認官方資訊</p>
            <strong className="mt-2 block text-3xl font-black tracking-[-.04em]">116 會考日期</strong>
            <p className="mt-2 text-lg font-bold text-[var(--jshs-primary)]">2027 年 5 月 15、16 日</p>
            <p className="mt-5 border-t border-[var(--jshs-border)] pt-5 text-sm leading-6 jshs-muted-copy">
              各區免試入學時程與規則仍以後續簡章為準；文章會明確區分「已公告」與「待公告」。
            </p>
          </aside>
        </div>
      </section>

      <nav aria-label="文章分類" className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] gap-2 overflow-x-auto py-4">
          <a className="shrink-0 px-4 py-2 text-sm jshs-button-primary" href="#latest">最新指南</a>
          {newsCategories.map((category) => (
            <Link key={category.slug} className="shrink-0 px-4 py-2 text-sm jshs-button-secondary" href={category.href}>
              {category.title}
            </Link>
          ))}
        </div>
      </nav>

      <section id="latest" aria-labelledby="latest-title" className="mx-auto w-[min(1180px,calc(100%-32px))] py-16 md:py-20">
        <SectionHeading
          id="latest-title"
          eyebrow="編輯精選"
          title="現在最值得先讀的三篇"
          body="每篇都標示更新日期、官方來源與下一步工具，讓閱讀直接接到行動。"
        />
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {featuredNews.map((article, index) => (
            <FeaturedCard key={article.slug} article={article} primary={index === 0} />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 md:py-20">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
          <div className="grid gap-5 md:grid-cols-3">
            <TrustPoint number="01" title="官方來源可回查" body="文章末端列出資料來源與用途，不用猜資訊從哪裡來。" />
            <TrustPoint number="02" title="已公告與待公告分開" body="不拿去年日期冒充今年時程，也不把推估寫成確定答案。" />
            <TrustPoint number="03" title="閱讀後能立即行動" body="每篇都連到選區、校科查詢或志願規劃的下一步。" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-16 md:py-24">
        <SectionHeading
          id="all-guides-title"
          eyebrow="完整升學指南"
          title="從你現在卡住的問題開始"
          body={`內容資料更新於 ${formatNewsDate(newsUpdatedAt)}；涉及權益的時程與規則，仍以各招生單位最新公告為準。`}
        />

        <div className="mt-12 space-y-16">
          {categories.map((category, index) => {
            const categoryHub = newsCategories.find((item) => item.title === category);
            const categorySlugs = new Set(categoryHub?.articleSlugs ?? []);
            const articles = newsArticles.filter((article) => categorySlugs.has(article.slug));
            return (
              <section key={category} id={`category-${index}`} aria-labelledby={`category-title-${index}`} className="scroll-mt-24">
                <div className="flex items-center gap-4">
                  <h2 id={`category-title-${index}`} className="text-2xl font-black tracking-[-.035em]">{category}</h2>
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-sm font-bold text-slate-400">{articles.length} 篇</span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="jshs-section-subtle py-16">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col justify-between gap-7 p-8 md:flex-row md:items-center md:p-12 jshs-surface-card">
          <div>
            <p className="jshs-eyebrow">從閱讀進入規劃</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">知道怎麼做了，就從自己的就學區開始。</h2>
            <p className="mt-3 max-w-2xl leading-7 jshs-muted-copy">查看校科、資料年度與目前可用的積分功能，把文章方法套到自己的選項。</p>
          </div>
          <a className="shrink-0 px-5 py-3.5 text-sm jshs-button-primary" href="/districts">選擇就學區 →</a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function SectionHeading({ id, eyebrow, title, body }: { id: string; eyebrow: string; title: string; body: string }) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="jshs-eyebrow">{eyebrow}</p>
        <h2 id={id} className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">{title}</h2>
      </div>
      <p className="max-w-lg leading-7 text-slate-500">{body}</p>
    </div>
  );
}

function FeaturedCard({ article, primary }: { article: NewsArticle; primary: boolean }) {
  return (
    <a
      href={`/news/${article.slug}`}
      className={`group flex min-h-[360px] flex-col p-7 jshs-surface-card ${primary ? "ring-1 ring-[var(--jshs-primary)]" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="jshs-chip">{article.category}</span>
        <span className="text-xs font-bold text-[var(--jshs-muted)]">{article.readMinutes} 分鐘閱讀</span>
      </div>
      <p className="mt-8 text-xs font-black tracking-[.14em] text-[var(--jshs-primary)]">{article.kicker}</p>
      <h2 className="mt-3 text-2xl font-black leading-snug tracking-[-.04em]">{article.title}</h2>
      <p className="mt-4 line-clamp-3 text-sm leading-7 jshs-muted-copy">{article.description}</p>
      <span className="mt-auto pt-8 text-sm font-black text-[var(--jshs-primary)]">讀完整指南 <span className="inline-block transition group-hover:translate-x-1">→</span></span>
    </a>
  );
}

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <a href={`/news/${article.slug}`} className="group p-6 md:p-7 jshs-surface-card">
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
        <span className="text-[var(--jshs-primary)]">{article.kicker}</span>
        <span>{article.readMinutes} 分鐘</span>
      </div>
      <h3 className="mt-4 text-xl font-black leading-snug tracking-[-.035em] group-hover:text-[var(--jshs-primary)]">{article.title}</h3>
      <p className="mt-3 line-clamp-2 text-sm leading-7 jshs-muted-copy">{article.description}</p>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-400">
        <time dateTime={article.updatedAt}>更新 {formatNewsDate(article.updatedAt)}</time>
        <span className="text-[var(--jshs-primary)]">閱讀 →</span>
      </div>
    </a>
  );
}

function TrustPoint({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <article className="p-6 jshs-surface-card">
      <span className="text-xs font-black tracking-[.14em] text-[var(--jshs-primary)]">{number}</span>
      <h2 className="mt-5 text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-7 jshs-muted-copy">{body}</p>
    </article>
  );
}
