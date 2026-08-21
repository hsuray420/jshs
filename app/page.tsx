import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getFeaturedNews, type NewsArticle } from "@/lib/news";
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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--jshs-background)] text-[var(--jshs-ink)]">
      <SiteHeader />

      <section className="border-b jshs-hero-band">
        <div className="mx-auto grid w-[min(1160px,calc(100%-32px))] gap-8 py-10 md:grid-cols-[1fr_360px] md:py-14">
          <div>
            <p className="jshs-eyebrow">先選一件事完成</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-6xl">全國國中升學資訊網</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 jshs-muted-copy">查就學區、找校科、算積分、排志願。每一步都保留資料年度、更新日與官方來源提醒。</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <TaskCard title="升學指南" body="先讀懂會考、免試入學與志願策略。" href="/news#latest" action="閱讀指南" />
              <TaskCard title="找校科" body="從中投區 96 所學校開始搜尋與收藏。" href="/schools?district=ct" action="搜尋學校" />
              <TaskCard title="試算工具" body="使用已校核地區的積分試算。" href="/it_hs/guide.htm#calculator" action="開始試算" />
              <TaskCard title="我的規劃" body="整理候選校科、志願與待辦。" href="/it_hs/guide.htm#analysis" action="打開規劃" />
            </div>
          </div>
          <aside className="p-5 jshs-organic-card">
            <h2 className="text-lg font-black">目前資料狀態</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <StatusItem label="就學區" value={`${districts.length} 區`} />
              <StatusItem label="可查學校" value="全國資料" />
              <StatusItem label="可試算" value="中投區已建置" />
              <StatusItem label="更新日" value={districtMetadata.updatedAt} />
            </dl>
            <p className="mt-5 border-t border-[var(--jshs-border)] pt-4 text-sm leading-6 jshs-muted-copy">{districtMetadata.disclaimer}</p>
            <Link className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]" href="/districts">選擇就學區 →</Link>
          </aside>
        </div>
      </section>

      <section aria-labelledby="news-preview-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-10 md:py-12">
        <SectionHeading eyebrow="最新升學情報" id="news-preview-title" title="先讀懂規則，再查資料。" body="每篇標示更新日期、官方來源與下一步工具。" />
        <div className="mt-6 grid gap-3 lg:grid-cols-3">{latestNews.map((article) => <NewsPreview key={article.slug} article={article} />)}</div>
        <Link className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]" href="/news">前往全部升學情報 →</Link>
      </section>

      <section aria-labelledby="timeline-title" className="border-y border-[var(--jshs-border)] bg-[var(--jshs-muted-surface)]/50 py-10 md:py-12">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <SectionHeading eyebrow="重要時程" id="timeline-title" title="只看已標示狀態的日期。" body="各區正式日期仍以招生單位最新公告為準。" />
          <div className="mt-6 grid gap-3 md:grid-cols-2">{keyTimeline.map((item) => <article key={item.title} className="p-5 jshs-organic-card"><span className="text-sm font-extrabold text-[var(--jshs-primary)]">{item.date}</span><h3 className="mt-2 text-lg font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{item.detail}</p><span className="mt-4 inline-block rounded-full bg-[var(--jshs-accent)] px-3 py-1 text-xs font-extrabold text-[var(--jshs-secondary)]">{item.status}</span></article>)}</div>
          <Link className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]" href="/news/exam">查看完整會考準備 →</Link>
        </div>
      </section>

      <section id="districts" aria-labelledby="districts-title" className="mx-auto w-[min(1160px,calc(100%-32px))] py-10 md:py-12">
        <SectionHeading eyebrow="選擇就學區" id="districts-title" title="15 區資料入口。" body="先確認適用區域，再進入學校查詢或工具。" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{districts.map(([code, district]) => <a key={code} className="group p-5 jshs-organic-card" href={`/it_hs/guide.htm?district=${code}#schools`}><div className="flex items-start justify-between gap-3"><span className="text-xs font-extrabold tracking-[.12em] text-[var(--jshs-primary)]">{code.toUpperCase()}</span><span className="rounded-full bg-[var(--jshs-muted-surface)] px-2.5 py-1 text-xs font-bold text-[var(--jshs-muted)]">{district.academicYear} 學年度</span></div><strong className="mt-3 block text-xl">{district.label}</strong><small className="mt-1 block min-h-10 text-sm jshs-muted-copy">{district.areas}</small><b className="mt-4 flex items-center justify-between text-sm text-[var(--jshs-primary)]">開啟學校查詢 <span className="transition group-hover:translate-x-1">→</span></b></a>)}</div>
        <Link className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]" href="/it_hs/guide.htm#home">直接選擇就學區 →</Link>
      </section>
      <SiteFooter />
    </main>
  );
}

function SectionHeading({ eyebrow, id, title, body }: { eyebrow: string; id: string; title: string; body: string }) {
  return <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="jshs-eyebrow">{eyebrow}</p><h2 id={id} className="mt-2 text-2xl font-black md:text-3xl">{title}</h2></div><p className="max-w-md text-sm leading-6 jshs-muted-copy">{body}</p></div>;
}

function TaskCard({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return <Link href={href} className="group p-5 jshs-organic-card"><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><b className="mt-4 block text-sm text-[var(--jshs-primary)]">{action} <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}

function NewsPreview({ article }: { article: NewsArticle }) {
  return <Link href={`/news/${article.slug}`} className="group flex min-h-56 flex-col p-5 jshs-organic-card"><div className="flex items-center justify-between gap-3 text-xs font-black"><span className="text-[var(--jshs-primary)]">{article.category}</span><span className="text-[var(--jshs-muted)]">{article.readMinutes} 分鐘</span></div><h3 className="mt-4 text-xl font-black leading-snug">{article.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 jshs-muted-copy">{article.description}</p><b className="mt-auto pt-6 text-sm text-[var(--jshs-primary)]">閱讀完整指南 <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}

function StatusItem({ label, value }: { label: string; value: string | number }) {
  return <div className="flex items-center justify-between gap-4 border-b border-[var(--jshs-border)] pb-3"><dt className="font-bold text-[var(--jshs-muted)]">{label}</dt><dd className="font-black text-[var(--jshs-primary)]">{value}</dd></div>;
}
