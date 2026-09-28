import type { Metadata } from "next";
import Link from "next/link";
import { SchoolMedia } from "@/components/school-media";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIcon } from "@/components/site-icons";
import { getSchoolSearchIndex } from "@/lib/school-search-index";
import { SITE_NAME } from "@/lib/brand";

const homeTitle = SITE_NAME;
const homeDescription = "找學校、成績分析、規劃志願與掌握升學資訊，讓每一步都更清楚。";
export const metadata: Metadata = { title: homeTitle, description: homeDescription, alternates: { canonical: "/" }, openGraph: { type: "website", locale: "zh_TW", url: "/", siteName: homeTitle, title: homeTitle, description: homeDescription }, twitter: { card: "summary", title: homeTitle, description: homeDescription } };

const featuredCodes = ["353301", "353303", "330301", "194303"];
// Canonical platform destinations remain discoverable: /planner /scores /schedule /knowledge /ai.

export default function HomePage() {
  const schools = getSchoolSearchIndex();
  const featured = featuredCodes.map((code) => schools.find((school) => school.code === code)).filter(Boolean);

  return <main className="jshs-v2-home min-h-screen">
    <SiteHeader activeHref="/" />
    <section className="jshs-v2-hero" aria-labelledby="home-hero-title">
      <div className="jshs-v2-container jshs-v2-hero-content">
        <div className="jshs-v2-hero-copy">
          <p className="jshs-home-eyebrow">116 學年度升學資訊</p>
          <h1 id="home-hero-title">找到屬於你的下一站。</h1>
          <p>探索高中、高職與五專，<br />從認識學校開始，找到適合自己的方向。</p>
          <form action="/schools" method="get" className="jshs-v2-search">
            <SiteIcon name="search" size={21} />
            <label className="sr-only" htmlFor="home-school-search">搜尋學校、科系或地區</label>
            <input id="home-school-search" name="q" type="search" placeholder="搜尋學校、科系或地區" />
            <button type="submit" aria-label="搜尋"><SiteIcon name="search" size={20} /></button>
          </form>
          <Link href="/schools" className="jshs-v2-all-schools">瀏覽所有學校 <span aria-hidden="true">→</span></Link>
        </div>
      </div>
      <div className="jshs-v2-hero-image" aria-hidden="true" />
    </section>
    <section className="jshs-v2-container jshs-home-popular" aria-labelledby="home-school-title">
      <div className="jshs-home-section-heading">
        <div>
          <p className="jshs-home-section-label"><span aria-hidden="true" />探索學校</p>
          <h2 id="home-school-title">認識更多學校</h2>
          <p>查看高中、高職與五專的官方資料，找到適合你的選擇。</p>
        </div>
        <Link href="/schools">瀏覽全部學校 <span aria-hidden="true">→</span></Link>
      </div>
      <div className="jshs-home-school-grid">{featured.map((school) => school ? <Link href={`/schools/${school.code}`} className="jshs-home-school-card" key={school.code}><SchoolMedia code={school.code} name={school.name} address={`${school.city}${school.area}`} /><span><strong>{school.name}</strong><small><SiteIcon name="school" size={14} />{school.city}</small></span><SiteIcon name="chevron-right" size={17} /></Link> : null)}</div>
    </section>
    <section className="jshs-v2-container jshs-home-belief is-truthful"><div><p className="jshs-home-eyebrow">MORE THAN SCHOOLS</p><h2>不只是升學，<br />而是更多可能</h2><p>{SITE_NAME}將官方升學資料整理成可查詢、可理解、可規劃的下一步。資料未提供的地方會清楚標示，不用漂亮數字填補。</p><Link href="/schools" className="jshs-home-dark-button">開始探索 <SiteIcon name="chevron-right" size={16} /></Link></div></section>
    <SiteFooter />
  </main>;
}
