import type { Metadata } from "next";
import Link from "next/link";
import { HomeAiPanel } from "@/components/home-ai-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIcon, type SiteIconName } from "@/components/site-icons";
import { formatNewsDate, newsArticles } from "@/lib/news";

const homeTitle = "全國國中升學資訊網｜JSHS";
const homeDescription = "找學校、成績分析、規劃志願與掌握升學資訊，讓每一步都更清楚。";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "zh_TW", url: "/", siteName: "全國國中升學資訊網", title: homeTitle, description: homeDescription },
  twitter: { card: "summary", title: homeTitle, description: homeDescription },
};

const featureCards: ReadonlyArray<{ label: string; description: string; href: string; icon: SiteIconName; tone: string }> = [
  { label: "找學校", description: "全國高中職資訊，地區、特色、交通一次掌握", href: "/schools", icon: "school", tone: "blue" },
  { label: "成績分析", description: "模擬考、會考落點，積分試算，了解自己的位置", href: "/scores", icon: "chart", tone: "green" },
  { label: "我的志願", description: "建立志願清單，模擬分發結果", href: "/planner", icon: "planner", tone: "orange" },
  { label: "升學日程", description: "重要時程不錯過，升學每步有計畫", href: "/schedule", icon: "calendar", tone: "red" },
  { label: "升學指南", description: "制度解析、選校建議，常見問題一次看懂", href: "/knowledge", icon: "knowledge", tone: "purple" },
  { label: "更多", description: "官方資訊、資料與信任，以及完整功能", href: "/admission-guides", icon: "more", tone: "slate" },
];

const quickTools: ReadonlyArray<{ label: string; href: string; icon: SiteIconName; tone: string }> = [
  { label: "會考積分試算", href: "/scores/admission", icon: "calculator", tone: "orange" },
  { label: "模考落點分析", href: "/scores/mock", icon: "chart", tone: "purple" },
  { label: "學校比較", href: "/schools/compare", icon: "compare", tone: "blue" },
  { label: "志願序試排", href: "/planner", icon: "planner", tone: "cyan" },
  { label: "歷年資料查詢", href: "/schools/history", icon: "knowledge", tone: "orange" },
  { label: "常見問題", href: "/knowledge/faq", icon: "sparkle", tone: "green" },
];

const popularSearches = ["台中二中", "台中女中", "文華高中", "惠文高中", "板橋高中"];

export default function HomePage() {
  const latestNews = [...newsArticles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  return (
    <main className="jshs-v2-home min-h-screen">
      <SiteHeader activeHref="/" />
      <section className="jshs-v2-hero" aria-labelledby="home-hero-title">
        <div className="jshs-v2-hero-image" aria-hidden="true" />
        <div className="jshs-v2-container jshs-v2-hero-content">
          <h1 id="home-hero-title">找到屬於你的下一站</h1>
          <p>最完整、最可信的全國升學資訊平台<br />讓升學選擇，變得更簡單。</p>
          <form action="/schools" method="get" className="jshs-v2-search">
            <SiteIcon name="search" size={20} />
            <label className="sr-only" htmlFor="home-school-search">搜尋學校名稱、地區、關鍵字</label>
            <input id="home-school-search" name="q" placeholder="搜尋學校名稱、地區、關鍵字..." />
            <button type="submit">搜尋</button>
          </form>
          <div className="jshs-v2-popular"><span>熱門搜尋</span>{popularSearches.map((term) => <Link key={term} href={`/schools?q=${encodeURIComponent(term)}`}>{term}</Link>)}</div>
        </div>
      </section>

      <section className="jshs-v2-container jshs-v2-feature-grid" aria-label="主要功能">
        {featureCards.map((card) => <Link key={card.label} href={card.href} className={`jshs-v2-feature-card is-${card.tone}`}><span className="jshs-v2-feature-icon"><SiteIcon name={card.icon} size={25} /></span><span className="jshs-v2-feature-copy"><strong>{card.label}</strong><small>{card.description}</small></span><span className="jshs-v2-feature-arrow" aria-hidden="true">→</span></Link>)}
      </section>

      <section className="jshs-v2-container jshs-v2-dashboard" aria-label="首頁資訊">
        <section className="jshs-v2-panel jshs-v2-news-panel" aria-labelledby="home-news-title">
          <div className="jshs-v2-panel-heading"><h2 id="home-news-title">最新消息</h2><Link href="/news">查看更多 ›</Link></div>
          <div className="jshs-v2-news-list">{latestNews.map((article, index) => <Link key={article.slug} href={`/news/${article.slug}`} className="jshs-v2-news-item"><span className={`jshs-v2-news-tag is-${index === 0 ? "notice" : index === 3 ? "event" : "update"}`}>{index === 0 ? "公告" : index === 3 ? "活動" : "更新"}</span><span className="jshs-v2-news-title">{article.title}</span><time dateTime={article.updatedAt}>{formatNewsDate(article.updatedAt).replace(/年|月/g, "/").replace("日", "")}</time></Link>)}</div>
        </section>

        <section className="jshs-v2-panel jshs-v2-tools-panel" aria-labelledby="home-tools-title">
          <div className="jshs-v2-panel-heading"><h2 id="home-tools-title">快速工具</h2></div>
          <div className="jshs-v2-tools-grid">{quickTools.map((tool) => <Link key={tool.label} href={tool.href} className={`jshs-v2-tool is-${tool.tone}`}><span><SiteIcon name={tool.icon} size={18} /></span>{tool.label}</Link>)}</div>
        </section>

        <HomeAiPanel />
      </section>
      <SiteFooter />
    </main>
  );
}
