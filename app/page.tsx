import type { Metadata } from "next";
import Link from "next/link";
import { SchoolMedia } from "@/components/school-media";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIcon } from "@/components/site-icons";
import { getSchoolSearchIndex } from "@/lib/school-search-index";

const homeTitle = "全國國中生選資訊網";
const homeDescription = "找學校、成績分析、規劃志願與掌握升學資訊，讓每一步都更清楚。";
export const metadata: Metadata = { title: homeTitle, description: homeDescription, alternates: { canonical: "/" }, openGraph: { type: "website", locale: "zh_TW", url: "/", siteName: homeTitle, title: homeTitle, description: homeDescription }, twitter: { card: "summary", title: homeTitle, description: homeDescription } };

const featureCards = [{ label: "探索學校", description: "搜尋官方學校資料", href: "/schools", icon: "school" as const }, { label: "升學資訊", description: "理解制度與規則", href: "/knowledge", icon: "knowledge" as const }, { label: "志願規劃", description: "整理與檢查志願", href: "/planner", icon: "planner" as const }, { label: "試算工具", description: "依官方規則試算", href: "/tools", icon: "calculator" as const }];
const featuredCodes = ["353301", "353303", "330301", "194303"];
// Canonical platform destinations remain discoverable: /planner /scores /schedule /knowledge /ai.

export default function HomePage() {
  const schools = getSchoolSearchIndex();
  const featured = featuredCodes.map((code) => schools.find((school) => school.code === code)).filter(Boolean);

  return <main className="jshs-v2-home min-h-screen">
    <SiteHeader activeHref="/" />
    <section className="jshs-v2-hero" aria-labelledby="home-hero-title">
      <div className="jshs-v2-hero-image" aria-hidden="true" />
      <div className="jshs-v2-container jshs-v2-hero-content">
        <p className="jshs-home-eyebrow">FOR A BRIGHTER TOMORROW</p>
        <h1 id="home-hero-title">發現更大的<br />高中世界</h1>
        <p>全國國中生選資訊網整理官方升學資料，<br />讓你更了解學校、規則與下一步。</p>
        <form action="/schools" method="get" className="jshs-v2-search">
          <SiteIcon name="search" size={20} />
          <label className="sr-only" htmlFor="home-school-search">搜尋學校名稱、地區或關鍵字</label>
          <input id="home-school-search" name="q" placeholder="搜尋學校名稱、地區或關鍵字…" />
          <button type="submit" aria-label="開始搜尋"><SiteIcon name="chevron-right" size={20} /></button>
        </form>
        <div className="jshs-v2-feature-strip">{featureCards.map((card) => <Link key={card.label} href={card.href}><SiteIcon name={card.icon} size={21} /><span><strong>{card.label}</strong><small>{card.description}</small></span></Link>)}</div>
      </div>
    </section>
    <section className="jshs-v2-container jshs-home-popular" aria-labelledby="home-school-title">
      <div className="jshs-home-section-heading"><div><h2 id="home-school-title">開始認識學校</h2><p>從官方資料中的學校開始了解。</p></div><Link href="/schools">瀏覽全部學校 <SiteIcon name="chevron-right" size={15} /></Link></div>
      <div className="jshs-home-school-grid">{featured.map((school) => school ? <Link href={`/schools/${school.code}`} className="jshs-home-school-card" key={school.code}><SchoolMedia code={school.code} name={school.name} address={`${school.city}${school.area}`} /><span><strong>{school.name}</strong><small><SiteIcon name="school" size={14} />{school.city}</small></span><SiteIcon name="chevron-right" size={17} /></Link> : null)}</div>
    </section>
    <section className="jshs-v2-container jshs-home-belief is-truthful"><div><p className="jshs-home-eyebrow">MORE THAN SCHOOLS</p><h2>不只是升學，<br />而是更多可能</h2><p>全國國中生選資訊網將官方升學資料整理成可查詢、可理解、可規劃的下一步。資料未提供的地方會清楚標示，不用漂亮數字填補。</p><Link href="/schools" className="jshs-home-dark-button">開始探索 <SiteIcon name="chevron-right" size={16} /></Link></div></section>
    <SiteFooter />
  </main>;
}
