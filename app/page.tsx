import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HomeProgress } from "@/components/home-progress";
import { HomeDistrictPicker } from "@/components/home-district-picker";
import { formatNewsDate, getFeaturedNews, type NewsArticle } from "@/lib/news";
import districtMetadata from "../public/it_hs/district-metadata.json";

const homeTitle = "全國國中升學資訊網｜校科查詢、積分試算與志願規劃";
const homeDescription = "整合全台就學區學校資料、積分試算、落點分析、升學情報與志願規劃；每筆規則標示資料年度、更新日與官方來源。";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    siteName: "全國國中升學資訊網",
    title: homeTitle,
    description: homeDescription,
  },
  twitter: { card: "summary", title: homeTitle, description: homeDescription },
};

type District = (typeof districtMetadata.districts)[keyof typeof districtMetadata.districts];
const districts = Object.entries(districtMetadata.districts) as Array<[string, District]>;
const keyTimeline = districtMetadata.timelineDefaults.ready;
const latestNews = getFeaturedNews(3);
const districtOptions = districts.map(([code, district]) => ({ code, label: district.label, academicYear: district.academicYear, dataStatus: district.dataStatus, updatedAt: district.updatedAt, calculator: district.calculator }));

export default function HomePage() {
  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader />

      <section className="border-b jshs-hero-section">
        <div className="mx-auto grid w-[min(1160px,calc(100%-32px))] gap-8 pb-8 pt-12 md:grid-cols-[1fr_340px] md:pb-12 md:pt-16">
          <div>
            <p className="jshs-eyebrow">全國國中升學資訊網</p>
            <h1 className="mt-3 max-w-3xl text-4xl leading-tight md:text-6xl">從下一步開始。</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 jshs-muted-copy">不必一次讀完所有升學資訊。先完成現在最需要的一件事，再沿著清楚的路徑繼續。</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <TaskCard icon="▤" tone="blue" title="讀懂規則" body="會考、入學規則與重要日期。" href="/news#latest" action="閱讀指南" />
              <TaskCard icon="⌂" tone="green" title="找校科" body="搜尋學校、科別、群科與學制。" href="/schools?district=ct" action="搜尋學校" />
              <TaskCard icon="∑" tone="blue" title="算積分" body="輸入成績，查看可核對的試算結果。" href="/tools?district=ct" action="開始試算" />
              <TaskCard icon="☷" tone="green" title="排志願" body="整理挑戰、適中與穩定的選項。" href="/planner" action="打開規劃" />
            </div>
          </div>
          <aside className="p-[14px] jshs-surface-card">
            <div className="flex items-center justify-between gap-3"><div><p className="jshs-eyebrow">你的使用情境</p><h2 className="mt-2">先選就學區。</h2></div><span className="jshs-icon-tile is-success" aria-hidden="true">✓</span></div>
            <p className="mt-3 text-sm leading-6 jshs-muted-copy">資料年度、可用工具與重要日期會依選擇的地區調整。</p>
            <div className="mt-5 grid gap-5 text-sm">
              <div>
                <p className="jshs-info-group-title">就學區資訊</p>
                <dl className="mt-2 grid gap-2"><StatusItem label="就學區" value={`${districts.length} 區`} /><StatusItem label="可查學校" value="全國資料" /></dl>
              </div>
              <div>
                <p className="jshs-info-group-title">資料與試算</p>
                <dl className="mt-2 grid gap-2"><StatusItem label="可試算" value="中投區已建置" /><StatusItem label="更新日" value={districtMetadata.updatedAt} /></dl>
              </div>
            </div>
            <p className="mt-5 text-xs leading-6 jshs-muted-copy">{districtMetadata.disclaimer}</p>
            <HomeDistrictPicker options={districtOptions} />
          </aside>
        </div>
      </section>

      <HomeProgress />

      <section aria-labelledby="news-preview-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8">
        <SectionHeading eyebrow="最新升學情報" id="news-preview-title" title="先讀懂規則，再查資料。" body="每篇標示更新日期、官方來源與下一步工具。" />
        <div className="mt-6 grid gap-3 lg:grid-cols-3">{latestNews.slice(0, 3).map((article) => <NewsPreview key={article.slug} article={article} />)}</div>
        <Link className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]" href="/news">前往全部升學情報 →</Link>
      </section>

      <section aria-labelledby="timeline-title" className="border-y border-[var(--jshs-border)] py-8 jshs-section-subtle">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <SectionHeading eyebrow="重要時程" id="timeline-title" title="只看已標示狀態的日期。" body="各區正式日期仍以招生單位最新公告為準。" />
          <div className="mt-6 grid gap-3 md:grid-cols-2">{keyTimeline.map((item) => <article key={item.title} className="p-5 jshs-surface-card"><span className="text-sm font-extrabold text-[var(--jshs-primary)]">{item.date}</span><h3 className="mt-2 text-lg font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{item.detail}</p><span className="mt-4 jshs-chip">{item.status}</span></article>)}</div>
          <Link className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]" href="/news/exam">查看完整會考準備 →</Link>
        </div>
      </section>

      <section id="districts" aria-labelledby="districts-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-8">
        <SectionHeading eyebrow="選擇就學區" id="districts-title" title="15 區資料入口。" body="先確認適用區域，再進入學校查詢或工具。" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{districts.map(([code, district]) => <a key={code} className="group p-5 jshs-surface-card" href={`/schools?district=${code}`}><div className="flex items-start justify-between gap-3"><span className="text-xs font-extrabold tracking-[.12em] text-[var(--jshs-primary)]">{code.toUpperCase()}</span><span className="rounded-full bg-[var(--jshs-muted-surface)] px-2.5 py-1 text-xs font-bold text-[var(--jshs-muted)]">{district.academicYear} 學年度</span></div><strong className="mt-3 block text-xl">{district.label}</strong><small className="mt-1 block min-h-10 text-sm jshs-muted-copy">{district.areas}</small><b className="mt-4 flex items-center justify-between text-sm text-[var(--jshs-primary)]">開啟學校查詢 <span className="transition group-hover:translate-x-1">→</span></b></a>)}</div>
        <Link className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]" href="/districts">查看全部就學區狀態 →</Link>
      </section>
      <SiteFooter />
    </main>
  );
}

function SectionHeading({ eyebrow, id, title, body }: { eyebrow: string; id: string; title: string; body: string }) {
  return <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="jshs-eyebrow">{eyebrow}</p><h2 id={id} className="mt-2 text-2xl font-black md:text-3xl">{title}</h2></div><p className="max-w-md text-sm leading-6 jshs-muted-copy">{body}</p></div>;
}

function TaskCard({ icon, tone, title, body, href, action }: { icon: string; tone: "blue" | "green"; title: string; body: string; href: string; action: string }) {
  return <Link href={href} className="group p-[14px] jshs-surface-card"><span className={`jshs-icon-tile jshs-task-icon ${tone === "green" ? "is-success" : ""}`} aria-hidden="true"><span>{icon}</span></span><h2 className="mt-4">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><b className="mt-4 block text-sm text-[var(--jshs-primary)]">{action} <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}

function NewsPreview({ article }: { article: NewsArticle }) {
  return <Link href={`/news/${article.slug}`} className="group flex min-h-56 flex-col p-5 jshs-surface-card"><div className="flex items-center justify-between gap-3 text-xs font-black"><span className="text-[var(--jshs-primary)]">{article.category}</span><span className="text-[var(--jshs-muted)]">更新 {formatNewsDate(article.updatedAt)}</span></div><h3 className="mt-4 text-xl font-black leading-snug">{article.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 jshs-muted-copy">{article.description}</p><span className="mt-3 text-xs font-bold text-[var(--jshs-muted)]">來源：{article.sources[0]?.label || "官方公告"}</span><b className="mt-auto pt-6 text-sm text-[var(--jshs-primary)]">閱讀完整指南 <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}

function StatusItem({ label, value }: { label: string; value: string | number }) {
  return <div className="flex items-center justify-between gap-4 py-1"><dt className="text-[var(--jshs-muted)]">{label}</dt><dd className="font-medium text-[var(--jshs-primary)]">{value}</dd></div>;
}
