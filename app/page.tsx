import type { Metadata } from "next";
import Link from "next/link";
import { SchoolMedia } from "@/components/school-media";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIcon } from "@/components/site-icons";
import { getSchoolSearchIndex } from "@/lib/school-search-index";
import { SITE_NAME } from "@/lib/brand";

const homeTitle = `${SITE_NAME} — 全國國中升學資訊與免試志願試算平台`;
const homeDescription = "找學校、模擬考落點、會考免試積分試算、志願排序與升學時程指南，全台 15 就學區官方資料整理。";
export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    siteName: SITE_NAME,
    title: homeTitle,
    description: homeDescription,
  },
  twitter: {
    card: "summary",
    title: homeTitle,
    description: homeDescription,
  },
};

const featuredCodes = ["353301", "353303", "330301", "194303"];

export default function HomePage() {
  const schools = getSchoolSearchIndex();
  const featured = featuredCodes.map((code) => schools.find((school) => school.code === code)).filter(Boolean);

  return (
    <main className="jshs-v2-home min-h-screen">
      <SiteHeader activeHref="/" />

      {/* Hero Stage with Apple Morning Dawn Lighting */}
      <section className="jshs-v2-hero" aria-labelledby="home-hero-title">
        <div className="jshs-v2-container jshs-v2-hero-content">
          <div className="jshs-v2-hero-copy">
            <div className="jshs-home-badge">
              <span className="jshs-badge-dot" aria-hidden="true" />
              <p className="jshs-home-eyebrow">116 學年度升學資訊 · 官方資料整理</p>
            </div>

            <h1 id="home-hero-title">
              找到屬於你的下一站。
            </h1>

            <p className="jshs-home-lead">
              探索高中、高職與五專，<br />
              從認識學校開始，找到適合自己的方向。
            </p>

            <form action="/schools" method="get" className="jshs-v2-search" role="search">
              <SiteIcon name="search" size={21} className="jshs-search-icon" />
              <label className="sr-only" htmlFor="home-school-search">
                搜尋學校、科系或地區
              </label>
              <input
                id="home-school-search"
                name="q"
                type="search"
                autoComplete="off"
                placeholder="搜尋學校、科系或地區"
              />
              <button type="submit" aria-label="搜尋" className="jshs-search-submit">
                <SiteIcon name="search" size={20} />
              </button>
            </form>

            <div className="jshs-hero-actions">
              <Link href="/schools" className="jshs-v2-all-schools">
                瀏覽所有學校 <span aria-hidden="true">→</span>
              </Link>
              <span className="jshs-hero-divider" aria-hidden="true">·</span>
              <Link href="/districts" className="jshs-hero-district-link">
                切換 15 就學區
              </Link>
            </div>
          </div>
        </div>
        <div className="jshs-v2-hero-image" aria-hidden="true" />
      </section>

      {/* Apple 2x2 Bento Grid: Four Core Mission Arenas */}
      <section className="jshs-v2-container jshs-home-bento" aria-labelledby="home-bento-title">
        <div className="jshs-home-section-heading">
          <div>
            <p className="jshs-home-section-label"><span aria-hidden="true" />核心升學功能</p>
            <h2 id="home-bento-title">清楚規劃每一個升學關鍵決定</h2>
            <p>全站依據教育部官方簡章與 15 就學區免試入學比序規則建構。</p>
          </div>
        </div>

        <div className="jshs-bento-grid">
          {/* Bento Card 1: 找學校 (Sky Blue Theme) */}
          <div className="jshs-bento-card is-schools">
            <div className="jshs-bento-content">
              <div className="jshs-bento-header">
                <span className="jshs-bento-tag is-schools">全國校科資料庫</span>
                <span className="jshs-bento-num">01</span>
              </div>
              <h3 className="jshs-bento-title">找學校</h3>
              <p className="jshs-bento-desc">
                探索全國 500+ 所高中職與五專，清楚比對公私立、學制群科、地理位置與通勤距離。
              </p>
              <div className="jshs-bento-shortcuts">
                <Link href="/schools" className="jshs-bento-pill">全國校科查詢</Link>
                <Link href="/schools/map" className="jshs-bento-pill">學校地圖</Link>
                <Link href="/schools/compare" className="jshs-bento-pill">學校比較</Link>
                <Link href="/schools/commute" className="jshs-bento-pill">通勤比較</Link>
                <Link href="/schools/history" className="jshs-bento-pill">歷年錄取</Link>
              </div>
            </div>
            <div className="jshs-bento-visual is-schools" aria-hidden="true">
              <div className="jshs-visual-map-pin">
                <div className="jshs-visual-pin-head" />
                <div className="jshs-visual-pin-pulse" />
              </div>
              <div className="jshs-visual-arch" />
            </div>
          </div>

          {/* Bento Card 2: 成績分析 ＆ 模擬考 (Mint Green x Star Purple) */}
          <div className="jshs-bento-card is-analytics">
            <div className="jshs-bento-content">
              <div className="jshs-bento-header">
                <span className="jshs-bento-tag is-analytics">會考落點與試算</span>
                <span className="jshs-bento-num">02</span>
              </div>
              <h3 className="jshs-bento-title">成績分析 ＆ 模擬考</h3>
              <p className="jshs-bento-desc">
                輸入五科與寫作等級，自動套用 15 就學區免試積分算法，即時試算總積分與比序落點。
              </p>
              <div className="jshs-bento-shortcuts">
                <Link href="/scores/admission" className="jshs-bento-pill">會考積分試算</Link>
                <Link href="/scores/mock/calculator" className="jshs-bento-pill">模擬考分數試算</Link>
                <Link href="/scores/mock" className="jshs-bento-pill">模考對答案</Link>
                <Link href="/scores/rules" className="jshs-bento-pill">各區比序規則</Link>
                <Link href="/scores/placement" className="jshs-bento-pill">落點分析</Link>
              </div>
            </div>
            <div className="jshs-bento-visual is-analytics" aria-hidden="true">
              <div className="jshs-visual-gauge">
                <svg viewBox="0 0 100 100" className="jshs-gauge-svg">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(5,150,105,0.15)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="65" strokeLinecap="round" />
                </svg>
                <span className="jshs-gauge-val">A++</span>
              </div>
            </div>
          </div>

          {/* Bento Card 3: 我的志願 (Sunrise Orange Theme) */}
          <div className="jshs-bento-card is-planner">
            <div className="jshs-bento-content">
              <div className="jshs-bento-header">
                <span className="jshs-bento-tag is-planner">智能排序決策</span>
                <span className="jshs-bento-num">03</span>
              </div>
              <h3 className="jshs-bento-title">我的志願</h3>
              <p className="jshs-bento-desc">
                拖曳排定 1~30 個志願序，即時檢查志願序扣分群組與風險分佈，一鍵匯出正式志願草稿。
              </p>
              <div className="jshs-bento-shortcuts">
                <Link href="/planner/custom" className="jshs-bento-pill">模擬志願選填</Link>
                <Link href="/planner/recommend" className="jshs-bento-pill">探索推薦志願</Link>
                <Link href="/knowledge/fit-quiz" className="jshs-bento-pill">Holland 興趣測驗</Link>
                <Link href="/planner/versions" className="jshs-bento-pill">版本紀錄</Link>
                <Link href="/planner/export" className="jshs-bento-pill">A4 列印下載</Link>
              </div>
            </div>
            <div className="jshs-bento-visual is-planner" aria-hidden="true">
              <div className="jshs-visual-rank-cards">
                <div className="jshs-visual-card is-rank1">
                  <span className="jshs-crown">👑</span>
                  <span>第 1 志願</span>
                </div>
                <div className="jshs-visual-card is-rank2">第 2 志願</div>
              </div>
            </div>
          </div>

          {/* Bento Card 4: 日程 ＆ 指南 (Amber Gold x Teal Theme) */}
          <div className="jshs-bento-card is-schedule">
            <div className="jshs-bento-content">
              <div className="jshs-bento-header">
                <span className="jshs-bento-tag is-schedule">時程與升學百科</span>
                <span className="jshs-bento-num">04</span>
              </div>
              <h3 className="jshs-bento-title">日程 ＆ 升學指南</h3>
              <p className="jshs-bento-desc">
                掌握 116 會考倒數、免試報名、特招甄選與選填放榜時程，3 分鐘秒懂超額比序專業術語。
              </p>
              <div className="jshs-bento-shortcuts">
                <Link href="/schedule/timeline" className="jshs-bento-pill">重要時程</Link>
                <Link href="/schedule/now" className="jshs-bento-pill">現在該做什麼</Link>
                <Link href="/knowledge" className="jshs-bento-pill">升學指南總覽</Link>
                <Link href="/knowledge/glossary" className="jshs-bento-pill">升學專有名詞</Link>
                <Link href="/eligibility" className="jshs-bento-pill">特殊資格檢測</Link>
              </div>
            </div>
            <div className="jshs-bento-visual is-schedule" aria-hidden="true">
              <div className="jshs-visual-calendar">
                <div className="jshs-cal-head" />
                <div className="jshs-cal-body">
                  <span className="jshs-cal-day">會考</span>
                  <span className="jshs-cal-check">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Schools Poster Card Wall */}
      <section className="jshs-v2-container jshs-home-popular" aria-labelledby="home-school-title">
        <div className="jshs-home-section-heading">
          <div>
            <p className="jshs-home-section-label"><span aria-hidden="true" />探索學校</p>
            <h2 id="home-school-title">認識更多學校</h2>
            <p>查看高中、高職與五專的官方資料，找到適合你的選擇。</p>
          </div>
          <Link href="/schools" className="jshs-heading-more">
            瀏覽全部學校 <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="jshs-home-school-grid">
          {featured.map((school) =>
            school ? (
              <Link
                href={`/schools/${school.code}`}
                className="jshs-home-school-card"
                key={school.code}
              >
                <div className="jshs-card-media-wrap">
                  <SchoolMedia
                    code={school.code}
                    name={school.name}
                    address={`${school.city}${school.area}`}
                  />
                </div>
                <span className="jshs-card-meta">
                  <strong>{school.name}</strong>
                  <small>
                    <SiteIcon name="school" size={14} />
                    {school.city}
                  </small>
                </span>
                <SiteIcon name="chevron-right" size={17} className="jshs-card-arrow" />
              </Link>
            ) : null
          )}
        </div>
      </section>

      {/* Spotlight Dark Card: Brand Commitment & Trust Arena */}
      <section className="jshs-v2-container jshs-home-belief is-truthful">
        <div className="jshs-belief-glow" aria-hidden="true" />
        <div className="jshs-belief-body">
          <p className="jshs-home-eyebrow">MORE THAN SCHOOLS · 資料真實性承諾</p>
          <h2>
            不只是升學，<br />
            而是更多可能
          </h2>
          <p>
            {SITE_NAME}將官方升學資料整理成可查詢、可理解、可規劃的下一步。資料未提供的地方會清楚標示，不用漂亮數字填補。
          </p>
          <div className="jshs-belief-actions">
            <Link href="/schools" className="jshs-home-dark-button">
              開始探索 <SiteIcon name="chevron-right" size={16} />
            </Link>
            <Link href="/trust" className="jshs-home-ghost-button">
              查看資料與信任說明 →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
