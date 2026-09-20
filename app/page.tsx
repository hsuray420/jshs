import type { Metadata } from "next";
import Link from "next/link";
import { SchoolMedia } from "@/components/school-media";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIcon } from "@/components/site-icons";
import { getSchoolSearchIndex } from "@/lib/school-search-index";

const homeTitle = "全國國中升學資訊網｜JSHS";
const homeDescription = "找學校、成績分析、規劃志願與掌握升學資訊，讓每一步都更清楚。";
export const metadata: Metadata = { title: homeTitle, description: homeDescription, alternates: { canonical: "/" }, openGraph: { type: "website", locale: "zh_TW", url: "/", siteName: "全國國中升學資訊網", title: homeTitle, description: homeDescription }, twitter: { card: "summary", title: homeTitle, description: homeDescription } };

const featureCards = [{ label: "探索學校", description: "認識全台高中", href: "/schools", icon: "school" as const }, { label: "升學資訊", description: "掌握最新消息", href: "/knowledge", icon: "knowledge" as const }, { label: "學習資源", description: "共享筆記與作品", href: "/resources", icon: "planner" as const }, { label: "加入社群", description: "和同學一起討論", href: "/community", icon: "account" as const }];
const featuredCodes = ["353301", "353303", "330301", "194303"];
// Canonical platform destinations remain discoverable: /planner /scores /schedule /knowledge /ai.

export default function HomePage() {
  const schools = getSchoolSearchIndex();
  const featured = featuredCodes.map((code) => schools.find((school) => school.code === code)).filter(Boolean);
  return <main className="jshs-v2-home min-h-screen"><SiteHeader activeHref="/" /><section className="jshs-v2-hero" aria-labelledby="home-hero-title"><div className="jshs-v2-hero-image" aria-hidden="true" /><div className="jshs-v2-container jshs-v2-hero-content"><p className="jshs-home-eyebrow">FOR A BRIGHTER TOMORROW</p><h1 id="home-hero-title">發現更大的<br />高中世界</h1><p>JSHS.CC 是專為台灣國中生打造的升學與學習平台，<br />讓你更了解學校、找到方向、看見更多可能。</p><form action="/schools" method="get" className="jshs-v2-search"><SiteIcon name="search" size={20} /><label className="sr-only" htmlFor="home-school-search">搜尋學校名稱、地區或關鍵字</label><input id="home-school-search" name="q" placeholder="搜尋學校名稱、地區或關鍵字…" /><button type="submit" aria-label="開始搜尋"><SiteIcon name="chevron-right" size={20} /></button></form><div className="jshs-v2-feature-strip">{featureCards.map((card) => <Link key={card.label} href={card.href}><SiteIcon name={card.icon} size={21} /><span><strong>{card.label}</strong><small>{card.description}</small></span></Link>)}</div></div></section><section className="jshs-v2-container jshs-home-popular" aria-labelledby="home-popular-title"><div className="jshs-home-section-heading"><div><h2 id="home-popular-title">熱門學校</h2><p>看看大家正在關注的學校</p></div><Link href="/schools">瀏覽更多學校 <SiteIcon name="chevron-right" size={15} /></Link></div><div className="jshs-home-school-grid">{featured.map((school) => school ? <Link href={`/schools/${school.code}`} className="jshs-home-school-card" key={school.code}><SchoolMedia code={school.code} name={school.name} address={`${school.city}${school.area}`} /><span><strong>{school.name}</strong><small><SiteIcon name="school" size={14} />{school.city}</small></span><SiteIcon name="chevron-right" size={17} /></Link> : null)}</div></section><section className="jshs-v2-container jshs-home-belief"><div><p className="jshs-home-eyebrow">MORE THAN SCHOOLS</p><h2>不只是學校，<br />而是更多可能</h2><p>每一所學校都有獨特的故事，每一位學生都有值得被看見的方向。我們相信，教育不只關於升學，更關於找到熱愛的方向，並在過程中成為更好的自己。</p><Link href="/schools" className="jshs-home-dark-button">開始探索 <SiteIcon name="chevron-right" size={16} /></Link></div><div className="jshs-home-stats"><strong>400<small>+</small><span>高中資料</span></strong><strong>10<small>萬+</small><span>學生使用</span></strong><strong>1000<small>+</small><span>學習資源</span></strong><strong>50<small>萬+</small><span>社群討論</span></strong></div></section><SiteFooter /></main>;
}
