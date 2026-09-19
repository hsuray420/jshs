import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { HomeAiPanel } from "@/components/home-ai-panel";
import { SERVICE_YEAR } from "@/lib/trust";

const homeTitle = "全國國中升學資訊網｜JSHS";
const homeDescription = "找學校、成績分析、規劃志願與掌握升學資訊，讓每一步都更清楚。";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "zh_TW", url: "/", siteName: "全國國中升學資訊網", title: homeTitle, description: homeDescription },
  twitter: { card: "summary", title: homeTitle, description: homeDescription },
};

const scoreCards = [
  { tone: "mock", eyebrow: "模擬考", status: "● 即時更新", title: "剛考完？從這裡開始。", description: "掌握歷次模擬考落點分佈，支援對答案、等級對照與全區標準比較。", href: "/scores/mock", action: "進入模考中心", shortcuts: ["對答案", "成績趨勢"] },
  { tone: "admission", eyebrow: "會考免試", status: "15 就學區", title: "想知道目前的升學積分？", description: "依所在就學區試算積分並查看完整規則，多元學習表現、志願序積分一目了然。", href: "/scores/admission", action: "開始積分試算", shortcuts: ["含超額比序"] },
] as const;

export default function HomePage() {
  return <main className="stitch-home-shell"><SiteHeader activeHref="/" /><div className="stitch-home-workspace"><div className="stitch-home-main">
    <section className="stitch-home-hero" aria-labelledby="home-hero-title"><div className="stitch-home-hero-copy"><p className="stitch-home-eyebrow"><span aria-hidden="true">●</span>{SERVICE_YEAR} 學年度 · 升學規劃</p><h1 id="home-hero-title">先確認下一步，<br />升學規劃會更清楚</h1><p>第一次來？用幾個問題找到升學起點。<br />已經知道目標？直接前往需要的工具。</p><div className="stitch-home-hero-actions"><Link href="/districts" className="stitch-primary-action">幫我確認下一步 <span aria-hidden="true">→</span></Link><Link href="/planner" className="stitch-secondary-action">直接開始規劃</Link></div></div></section>
    <section className="stitch-score-section" aria-labelledby="score-section-title"><div className="stitch-section-heading"><p>成績分析</p><h2 id="score-section-title">現在想先處理哪件事？</h2></div><div className="stitch-score-grid">{scoreCards.map((card) => <article key={card.tone} className={`stitch-score-card is-${card.tone}`}><div className="stitch-card-meta"><span>{card.eyebrow}</span><small>{card.status}</small></div><h3>{card.title}</h3><p>{card.description}</p><div className="stitch-card-footer"><Link href={card.href}>{card.action} <span aria-hidden="true">›</span></Link><div>{card.shortcuts.map((shortcut) => <Link key={shortcut} href={card.tone === "mock" ? "/scores/mock" : "/scores/rules"}>{shortcut}</Link>)}</div></div></article>)}</div></section>
  </div><HomeAiPanel /></div></main>;
}
