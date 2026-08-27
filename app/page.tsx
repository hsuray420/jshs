import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";
import { formatNewsDate, getFeaturedNews, type NewsArticle } from "@/lib/news";
import districtMetadata from "../public/it_hs/district-metadata.json";
import { PageContainer } from "@/components/ui/layout";

const homeTitle = "全國國中升學資訊網｜陪你找到升學方向";
const homeDescription = "不論是第一次探索升學，或已經知道下一步，這裡用可信資料陪你找到方向、完成試算並整理志願。";

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

const keyTimeline = districtMetadata.timelineDefaults.ready;
const latestNews = getFeaturedNews(3);

export default function HomePage() {
  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader />

      <section className="border-b jshs-hero-section">
        <PageContainer size="wide" className="pb-10 pt-12 md:pb-16 md:pt-20">
          <div>
            <p className="jshs-eyebrow">給正在陪孩子找方向的你</p>
            <h1 className="mt-3 max-w-4xl text-4xl leading-tight md:text-6xl">先別急，來到這裡，就能找到下一步。</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 jshs-muted-copy md:text-lg">升學資訊很多，但你不需要一次懂完。家長可以放心，孩子可以從現在的疑問開始；我們會陪你把方向、分數、學校和志願，一步一步整理清楚。</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <TaskCard icon="planner" tone="blue" title="我已經知道要做什麼" body="直接進入工具，完成成績試算、查學校科系或整理志願。" href="/tools" action="直接開始" />
              <TaskCard icon="knowledge" tone="green" title="我第一次來，不知道要做什麼" body="先用簡單導覽建立全貌，再決定從哪一件事開始。" href="/knowledge" action="先了解一下" />
              <TaskCard icon="sparkle" tone="blue" title="我想先找到適合的方向" body="從學制分類、群科與未來路徑探索，慢慢縮小選擇。" href="/knowledge/fit-quiz" action="探索我的方向" />
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer as="section" aria-labelledby="news-preview-title" className="py-8">
        <SectionHeading eyebrow="最新升學情報" id="news-preview-title" title="先讀懂規則，再查資料。" body="每篇標示更新日期、官方來源與下一步工具。" />
        <div className="mt-6 grid gap-3 lg:grid-cols-3">{latestNews.slice(0, 3).map((article) => <NewsPreview key={article.slug} article={article} />)}</div>
        <Link className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]" href="/news">前往全部升學情報 →</Link>
      </PageContainer>

      <section aria-labelledby="timeline-title" className="border-y border-[var(--jshs-border)] py-8 jshs-section-subtle">
        <PageContainer>
          <SectionHeading eyebrow="重要時程" id="timeline-title" title="只看已標示狀態的日期。" body="各區正式日期仍以招生單位最新公告為準。" />
          <div className="mt-6 grid gap-3 md:grid-cols-2">{keyTimeline.map((item) => <article key={item.title} className="p-5 jshs-surface-card"><span className="text-sm font-extrabold text-[var(--jshs-primary)]">{item.date}</span><h3 className="mt-2 text-lg font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 jshs-muted-copy">{item.detail}</p><span className="mt-4 jshs-chip">{item.status}</span></article>)}</div>
          <Link className="mt-5 inline-block text-sm font-black text-[var(--jshs-primary)]" href="/news/exam">查看完整會考準備 →</Link>
        </PageContainer>
      </section>

      <SiteFooter />
    </main>
  );
}

function SectionHeading({ eyebrow, id, title, body }: { eyebrow: string; id: string; title: string; body: string }) {
  return <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="jshs-eyebrow">{eyebrow}</p><h2 id={id} className="mt-2 text-2xl font-black md:text-3xl">{title}</h2></div><p className="max-w-md text-sm leading-6 jshs-muted-copy">{body}</p></div>;
}

function TaskCard({ icon, tone, title, body, href, action }: { icon: SiteIconName; tone: "blue" | "green"; title: string; body: string; href: string; action: string }) {
  return <Link href={href} className="group p-[14px] jshs-surface-card"><span className={`jshs-icon-tile jshs-task-icon ${tone === "green" ? "is-success" : ""}`} aria-hidden="true"><SiteIcon name={icon} size={18} /></span><h2 className="mt-4">{title}</h2><p className="mt-2 text-sm leading-6 jshs-muted-copy">{body}</p><b className="mt-4 block text-sm text-[var(--jshs-primary)]">{action} <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}

function NewsPreview({ article }: { article: NewsArticle }) {
  return <Link href={`/news/${article.slug}`} className="group flex min-h-56 flex-col p-5 jshs-surface-card"><div className="flex items-center justify-between gap-3 text-xs font-black"><span className="text-[var(--jshs-primary)]">{article.category}</span><span className="text-[var(--jshs-muted)]">更新 {formatNewsDate(article.updatedAt)}</span></div><h3 className="mt-4 text-xl font-black leading-snug">{article.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 jshs-muted-copy">{article.description}</p><span className="mt-3 text-xs font-bold text-[var(--jshs-muted)]">來源：{article.sources[0]?.label || "官方公告"}</span><b className="mt-auto pt-6 text-sm text-[var(--jshs-primary)]">閱讀完整指南 <span className="inline-block transition group-hover:translate-x-1">→</span></b></Link>;
}
