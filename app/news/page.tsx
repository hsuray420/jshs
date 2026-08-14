import type { Metadata } from "next";
import {
  formatNewsDate,
  getFeaturedNews,
  getNewsCategories,
  newsArticles,
  newsUpdatedAt,
  type NewsArticle,
} from "@/lib/news";

const pageTitle = "升學情報中心｜會考時程、規則解讀與志願策略";
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
    <main className="bg-[#f5f8fc] text-[#14213d]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />

      <section className="overflow-hidden border-y border-blue-100 bg-[#102f60] text-white">
        <div className="relative mx-auto grid w-[min(1180px,calc(100%-32px))] gap-12 py-16 lg:grid-cols-[1.18fr_.82fr] lg:items-end lg:py-24">
          <div className="pointer-events-none absolute -right-32 -top-48 h-[520px] w-[520px] rounded-full bg-[#3b82f6]/25 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-black tracking-[.2em] text-[#9bc6ff]">JSHS 升學情報中心</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.08] tracking-[-.055em] text-white md:text-7xl">
              先讀懂規則，<br />再做關鍵選擇。
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100">
              不追逐來路不明的分數線。從官方公告出發，把會考、就學區、積分與志願整理成現在就能完成的下一步。
            </p>
          </div>
          <aside className="relative rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur md:p-8">
            <span className="inline-flex rounded-full bg-[#ffeadf] px-3 py-1 text-xs font-black text-[#a94718]">本期重點</span>
            <p className="mt-5 text-sm font-bold text-blue-200">已確認官方資訊</p>
            <strong className="mt-2 block text-3xl font-black tracking-[-.04em] text-white">116 會考日期</strong>
            <p className="mt-2 text-lg font-bold text-[#ffd2bb]">2027 年 5 月 15、16 日</p>
            <p className="mt-5 border-t border-white/15 pt-5 text-sm leading-6 text-blue-100">
              各區免試入學時程與規則仍以後續簡章為準；文章會明確區分「已公告」與「待公告」。
            </p>
          </aside>
        </div>
      </section>

      <nav aria-label="文章分類" className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] gap-2 overflow-x-auto py-4">
          <a className="shrink-0 rounded-full bg-[#173d78] px-4 py-2 text-sm font-extrabold text-white" href="#latest">最新指南</a>
          {categories.map((category, index) => (
            <a key={category} className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-600 hover:border-blue-300 hover:text-[#173d78]" href={`#category-${index}`}>
              {category}
            </a>
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
            const articles = newsArticles.filter((article) => article.category === category);
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

      <section className="bg-[#eaf3ff] py-16">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col justify-between gap-7 rounded-[2rem] bg-[#173d78] p-8 text-white shadow-2xl shadow-blue-950/15 md:flex-row md:items-center md:p-12">
          <div>
            <p className="text-xs font-black tracking-[.18em] text-blue-200">從閱讀進入規劃</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em] text-white">知道怎麼做了，就從自己的就學區開始。</h2>
            <p className="mt-3 max-w-2xl leading-7 text-blue-100">查看校科、資料年度與目前可用的積分功能，把文章方法套到自己的選項。</p>
          </div>
          <a className="shrink-0 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-[#173d78] shadow-lg" href="/it_hs/it_hs.html">選擇就學區 →</a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="bg-white">
      <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4 py-5">
        <a className="flex items-center gap-2.5 font-black tracking-tight" href="/jshs/home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173d78] text-lg text-white">↗</span>
          <span>全國國中升學資訊網</span>
        </a>
        <nav aria-label="主要導覽" className="hidden items-center gap-6 text-sm font-bold text-slate-500 md:flex">
          <a className="text-[#173d78]" href="/news">升學情報</a>
          <a href="/jshs/home#districts">選擇就學區</a>
          <a href="/jshs/home#tools">升學工具</a>
        </nav>
        <a className="rounded-xl bg-[#173d78] px-4 py-2.5 text-sm font-extrabold text-white" href="/it_hs/it_hs.html">開始查校</a>
      </div>
    </header>
  );
}

function SectionHeading({ id, eyebrow, title, body }: { id: string; eyebrow: string; title: string; body: string }) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-black tracking-[.18em] text-[#2868d7]">{eyebrow}</p>
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
      className={`group flex min-h-[360px] flex-col rounded-[1.75rem] border p-7 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/10 ${primary ? "border-[#173d78] bg-[#173d78] text-white" : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${primary ? "bg-white/12 text-blue-100" : "bg-blue-50 text-[#2868d7]"}`}>{article.category}</span>
        <span className={`text-xs font-bold ${primary ? "text-blue-200" : "text-slate-400"}`}>{article.readMinutes} 分鐘閱讀</span>
      </div>
      <p className={`mt-8 text-xs font-black tracking-[.14em] ${primary ? "text-[#ffd2bb]" : "text-[#ba6b18]"}`}>{article.kicker}</p>
      <h2 className={`mt-3 text-2xl font-black leading-snug tracking-[-.04em] ${primary ? "text-white" : "text-[#14213d]"}`}>{article.title}</h2>
      <p className={`mt-4 line-clamp-3 text-sm leading-7 ${primary ? "text-blue-100" : "text-slate-500"}`}>{article.description}</p>
      <span className={`mt-auto pt-8 text-sm font-black ${primary ? "text-white" : "text-[#2868d7]"}`}>讀完整指南 <span className="inline-block transition group-hover:translate-x-1">→</span></span>
    </a>
  );
}

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <a href={`/news/${article.slug}`} className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10 md:p-7">
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
        <span className="text-[#2868d7]">{article.kicker}</span>
        <span>{article.readMinutes} 分鐘</span>
      </div>
      <h3 className="mt-4 text-xl font-black leading-snug tracking-[-.035em] group-hover:text-[#173d78]">{article.title}</h3>
      <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{article.description}</p>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-400">
        <time dateTime={article.updatedAt}>更新 {formatNewsDate(article.updatedAt)}</time>
        <span className="text-[#2868d7]">閱讀 →</span>
      </div>
    </a>
  );
}

function TrustPoint({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-[#fbfdff] p-6">
      <span className="text-xs font-black tracking-[.14em] text-[#ba6b18]">{number}</span>
      <h2 className="mt-5 text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-500">{body}</p>
    </article>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-9">
      <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col justify-between gap-4 text-sm text-slate-500 md:flex-row md:items-center">
        <b className="text-[#14213d]">全國國中升學資訊網</b>
        <div className="flex gap-5 font-bold"><a href="/news">升學情報</a><a href="/jshs/home#districts">就學區</a><a href="/it_hs/it_hs.html">校科查詢</a></div>
        <span>招生資訊請以各主管機關最新公告為準。</span>
      </div>
    </footer>
  );
}
