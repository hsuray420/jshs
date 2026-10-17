import type { FeatureThemeName } from "@/lib/feature-themes";

export type FeatureIllustrationName =
  | "school-search" | "admissions-history" | "school-map" | "school-compare" | "commute" | "cost-calculator" | "alumni" | "open-day" | "career-groups"
  | "score-calculator" | "score-rules" | "placement" | "score-summary" | "score-history"
  | "planner" | "planner-recommendation" | "planner-health" | "planner-history" | "planner-export" | "official-platform"
  | "schedule" | "timeline" | "schedule-now" | "todo" | "calendar-export"
  | "official-info" | "official-document" | "guide" | "admission-basics" | "choice-score" | "eligibility" | "encyclopedia" | "career-explore"
  | "trust" | "source-registry" | "data-status" | "credibility" | "assistant" | "districts" | "site-search" | "support" | "account";

const labels: Record<FeatureIllustrationName, string> = {
  "school-search": "學校、地圖定位與搜尋", "admissions-history": "歷年錄取資料", "school-map": "學校地圖", "school-compare": "學校比較", commute: "通勤比較", "cost-calculator": "費用試算", alumni: "學長姐分享", "open-day": "校園開放日", "career-groups": "群科介紹",
  "score-calculator": "積分計算", "score-rules": "積分規則", placement: "模擬考落點", "score-summary": "積分摘要", "score-history": "成績歷史",
  planner: "志願排序", "planner-recommendation": "志願探索", "planner-health": "志願檢查", "planner-history": "版本紀錄", "planner-export": "列印與下載", "official-platform": "官方選填平台",
  schedule: "升學日程", timeline: "重要時程", "schedule-now": "目前待辦", todo: "我的待辦", "calendar-export": "行事曆匯出",
  "official-info": "官方資訊", "official-document": "官方文件", guide: "升學指南", "admission-basics": "升學入門", "choice-score": "志願與積分", eligibility: "資格與特殊入學", encyclopedia: "升學百科", "career-explore": "生涯探索",
  trust: "資料與信任", "source-registry": "資料來源", "data-status": "資料狀態", credibility: "可信度說明", assistant: "升學助理", districts: "就學區", "site-search": "全站搜尋", support: "支援中心", account: "帳號設定",
};

function Scene({ name }: { name: FeatureIllustrationName }) {
  // 1. Schools & Navigation (Map, Pin, Academy Arch, Route)
  if (["school-search", "school-map", "commute"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Isometric perspective campus map plane */}
        <polygon points="50,170 180,215 310,170 180,125" className="jshs-illustration-plane" fill="currentColor" fillOpacity="0.08" />
        <polygon points="50,170 180,215 180,225 50,180" fill="currentColor" fillOpacity="0.12" />
        <polygon points="180,215 310,170 310,180 180,225" fill="currentColor" fillOpacity="0.18" />

        {/* Campus Academy Main Building */}
        <path className="jshs-illustration-fill" d="M86 165V105l94-42 94 42v60H86Z" />
        {/* Bell Tower & Gable Roof */}
        <polygon points="180,42 145,63 215,63" className="jshs-illustration-accent" />
        <rect x="168" y="63" width="24" height="26" fill="white" fillOpacity="0.9" rx="3" />
        <circle cx="180" cy="74" r="5" fill="currentColor" />

        {/* Architectural lines & windows */}
        <path className="jshs-illustration-line" d="M74 165h212M112 165v-48h136v48M180 89v76M130 135h22m76 0h22" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arched Portico */}
        <path d="M166 165v-24c0-7 6-13 14-13s14 6 14 13v24" fill="white" />

        {/* 3D Glowing Droplet Pin */}
        <g transform="translate(240, 48)">
          <path className="jshs-illustration-pin-shadow" d="M18 42c6 0 12 3 12 6s-6 6-12 6-12-3-12-6 6-6 12-6Z" fill="currentColor" fillOpacity="0.2" />
          <path className="jshs-illustration-pin" d="M18 0C8 0 0 8 0 18c0 14 18 30 18 30s18-16 18-30C36 8 28 0 18 0Z" fill="url(#ill-grad-pin)" />
          <circle cx="18" cy="17" r="7" fill="white" />
          <circle cx="18" cy="17" r="3" fill="currentColor" />
        </g>

        {name === "commute" && (
          <path className="jshs-illustration-accent" d="M70 185c36-12 48 18 90 6 36-10 52-32 80-24" fill="none" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
        )}
      </g>
    );
  }

  // 2. Exam History & Trend Analytics
  if (["admissions-history", "score-history", "planner-history"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Layered Card Deck */}
        <rect x="96" y="44" width="168" height="136" rx="18" fill="currentColor" fillOpacity="0.06" transform="rotate(-3 180 112)" />
        <rect className="jshs-illustration-fill" x="88" y="52" width="184" height="142" rx="20" />

        {/* Chart Grid Lines */}
        <path className="jshs-illustration-line" d="M116 88h128M116 120h128M116 152h128" strokeOpacity="0.2" strokeWidth="1.5" />
        {/* Trend Area Gradient & Smooth Line */}
        <path d="M124 148l32-26 34 16 46-52v62H124Z" fill="url(#ill-grad-trend)" fillOpacity="0.35" />
        <path d="M124 148l32-26 34 16 46-52" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Glowing Data Nodes */}
        <circle cx="124" cy="148" r="5" fill="white" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="156" cy="122" r="5" fill="white" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="190" cy="138" r="5" fill="white" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="236" cy="86" r="6" className="jshs-illustration-accent" stroke="white" strokeWidth="2.5" />
      </g>
    );
  }

  // 3. Side-by-Side Comparison & Placement Distribution
  if (["school-compare", "placement", "score-summary"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Left Column Card */}
        <rect className="jshs-illustration-fill" x="62" y="62" width="102" height="128" rx="18" />
        <rect x="76" y="78" width="74" height="12" rx="6" fill="currentColor" fillOpacity="0.2" />
        <path className="jshs-illustration-line" d="M76 104h54M76 126h74M76 148h42M76 166h60" strokeWidth="2" strokeLinecap="round" />

        {/* VS / Comparison Glowing Beacon */}
        <circle cx="180" cy="124" r="22" fill="url(#ill-grad-orb)" />
        <path className="jshs-illustration-accent" d="M174 116l12 16m0-16l-12 16" stroke="white" strokeWidth="3" strokeLinecap="round" />

        {/* Right Column Card */}
        <rect className="jshs-illustration-fill" x="196" y="62" width="102" height="128" rx="18" />
        <rect x="210" y="78" width="74" height="12" rx="6" className="jshs-illustration-accent" fillOpacity="0.28" />
        <path className="jshs-illustration-line" d="M210 104h74M210 126h54M210 148h68M210 166h48" strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }

  // 4. Calculator & Admission Score Engine
  if (["cost-calculator", "score-calculator", "score-rules"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Calculator Body */}
        <rect className="jshs-illustration-fill" x="108" y="38" width="144" height="172" rx="24" />
        {/* Glowing Screen Display */}
        <rect x="126" y="58" width="108" height="40" rx="10" fill="white" />
        <rect x="136" y="72" width="48" height="12" rx="4" fill="currentColor" fillOpacity="0.25" />
        <circle cx="218" cy="78" r="5" className="jshs-illustration-accent" />

        {/* Keypad Buttons Grid */}
        <rect x="126" y="112" width="22" height="20" rx="6" fill="white" fillOpacity="0.8" />
        <rect x="156" y="112" width="22" height="20" rx="6" fill="white" fillOpacity="0.8" />
        <rect x="186" y="112" width="22" height="20" rx="6" fill="white" fillOpacity="0.8" />
        <rect x="214" y="112" width="20" height="20" rx="6" className="jshs-illustration-accent" fillOpacity="0.8" />

        <rect x="126" y="140" width="22" height="20" rx="6" fill="white" fillOpacity="0.8" />
        <rect x="156" y="140" width="22" height="20" rx="6" fill="white" fillOpacity="0.8" />
        <rect x="186" y="140" width="22" height="20" rx="6" fill="white" fillOpacity="0.8" />
        <rect x="214" y="140" width="20" height="20" rx="6" className="jshs-illustration-accent" fillOpacity="0.8" />

        <rect x="126" y="168" width="52" height="22" rx="6" fill="white" fillOpacity="0.8" />
        <rect x="186" y="168" width="48" height="22" rx="6" fill="url(#ill-grad-pin)" />

        {/* Floating Checkmark Badge */}
        <g transform="translate(242, 134)">
          <circle cx="18" cy="18" r="18" fill="white" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.12))" />
          <path d="M11 18l5 5 11-12" fill="none" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    );
  }

  // 5. Alumni & Community Sharing
  if (["alumni", "assistant", "support"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Primary Message Balloon */}
        <path className="jshs-illustration-fill" d="M82 66h160c14 0 26 12 26 26v64c0 14-12 26-26 26h-76l-46 30 11-30H82c-14 0-26-12-26-26V92c0-14 12-26 26-26Z" />
        <path className="jshs-illustration-line" d="M96 108h132M96 138h88" strokeWidth="3" strokeLinecap="round" />
        {/* Floating Avatar Orb */}
        <circle className="jshs-illustration-accent" cx="248" cy="58" r="24" />
        <circle cx="248" cy="52" r="8" fill="white" />
        <path d="M234 72c0-7 6-12 14-12s14 5 14 12" fill="white" />
      </g>
    );
  }

  // 6. Schedule, Calendar & Countdown Timeline
  if (["open-day", "schedule", "timeline", "schedule-now", "todo", "calendar-export"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* 3D Flip Calendar Card */}
        <rect className="jshs-illustration-fill" x="88" y="48" width="184" height="156" rx="22" />
        {/* Top Header Bar */}
        <path d="M88 48h184v38H88z" fill="url(#ill-grad-pin)" rx="22" />
        {/* Twin Spiral Binders */}
        <rect x="124" y="34" width="12" height="26" rx="6" fill="white" stroke="currentColor" strokeWidth="2" />
        <rect x="224" y="34" width="12" height="26" rx="6" fill="white" stroke="currentColor" strokeWidth="2" />

        {/* Calendar Grid & Dates */}
        <path className="jshs-illustration-line" d="M112 118h30m34 0h30m34 0h30M112 152h30m34 0h30" strokeWidth="2.5" strokeLinecap="round" />
        {/* Glowing Success Checked Badge */}
        <g transform="translate(204, 138)">
          <circle cx="22" cy="22" r="22" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <path d="M14 22l6 6 12-14" fill="none" stroke="#D97706" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    );
  }

  // 7. Knowledge Guide, Encyclopedia & Career Radar
  if (["career-groups", "guide", "admission-basics", "choice-score", "eligibility", "encyclopedia", "career-explore"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* 3D Unfolded Hardcover Book */}
        <path className="jshs-illustration-fill" d="M72 74c44-18 72 2 108 26v100c-36-24-64-42-108-24V74Zm216 0c-44-18-72 2-108 26v100c36-24 64-42 108-24V74Z" />
        {/* Book Spine Centerline */}
        <path className="jshs-illustration-line" d="M180 100v100" strokeWidth="3" strokeLinecap="round" />
        {/* Book Page Lines */}
        <path className="jshs-illustration-line" d="M98 108c24-8 44 2 62 14m-62 26c24-8 44 2 62 14m102-54c-24-8-44 2-62 14m62 26c-24-8-44 2-62 14" strokeWidth="2" strokeLinecap="round" />
        {/* Top Glowing Compass / Beacon */}
        <g transform="translate(180, 52)">
          <circle cx="0" cy="0" r="22" fill="url(#ill-grad-orb)" />
          <polygon points="0,-15 5,0 0,15 -5,0" fill="white" />
        </g>
      </g>
    );
  }

  // 8. Wishlist Planner, Sorting & Recommendations
  if (["planner", "planner-recommendation", "planner-health", "planner-export", "official-platform"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Reorderable Wishlist Cards Stack */}
        <rect x="70" y="52" width="200" height="44" rx="14" fill="currentColor" fillOpacity="0.08" />
        <rect x="74" y="96" width="200" height="44" rx="14" fill="currentColor" fillOpacity="0.12" />
        <rect className="jshs-illustration-fill" x="80" y="140" width="200" height="46" rx="14" />

        {/* Card 1: 1st Choice Crown Medal */}
        <g transform="translate(86, 62)">
          <circle cx="16" cy="12" r="12" fill="#FED7AA" />
          <path d="M10 16l2-8 4 4 4-4 2 8H10Z" fill="#EA580C" />
          <rect x="36" y="8" width="100" height="8" rx="4" fill="currentColor" fillOpacity="0.3" />
        </g>

        {/* Card 2: 2nd Choice */}
        <g transform="translate(90, 106)">
          <circle cx="16" cy="12" r="12" fill="white" />
          <text x="16" y="16" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#EA580C">2</text>
          <rect x="36" y="8" width="80" height="8" rx="4" fill="currentColor" fillOpacity="0.3" />
        </g>

        {/* Card 3: 3rd Choice */}
        <g transform="translate(96, 150)">
          <circle cx="16" cy="14" r="12" fill="white" />
          <text x="16" y="18" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#EA580C">3</text>
          <rect x="36" y="10" width="70" height="8" rx="4" fill="currentColor" fillOpacity="0.4" />
        </g>

        {/* Floating Heart / Match Badge */}
        <g transform="translate(244, 94)">
          <circle cx="22" cy="22" r="22" fill="url(#ill-grad-pin)" filter="drop-shadow(0 6px 14px rgba(234,88,12,0.3))" />
          <path d="M22 29s-9-5.5-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 11-9 11Z" fill="white" />
        </g>
      </g>
    );
  }

  // 9. Trust, Verification, Shield & Credibility
  if (["trust", "source-registry", "data-status", "credibility"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* 3D Verification Shield */}
        <path className="jshs-illustration-fill" d="M180 32 268 68v64c0 56-40 84-88 102-48-18-88-46-88-102V68l88-36Z" />
        <path d="M180 44l76 32v56c0 48-34 72-76 88V44Z" fill="white" fillOpacity="0.18" />

        {/* Official Double Checkmark Seal */}
        <circle cx="180" cy="132" r="34" fill="url(#ill-grad-orb)" />
        <path d="M164 132l11 11 22-24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Radiating Trust Beams */}
        <circle cx="180" cy="132" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4" />
      </g>
    );
  }

  // 10. Districts & Taiwan Map
  if (name === "districts") {
    return (
      <g className="jshs-art-group">
        <path className="jshs-illustration-fill" d="M74 182 113 72l70 25 47-45 56 55-50 75-72-18-90 18Z" />
        <path className="jshs-illustration-line" d="m113 72 51 92m19-67 53 85m-6-130-66 112" strokeWidth="2.5" />
        <circle className="jshs-illustration-accent" cx="125" cy="113" r="14" />
        <circle cx="184" cy="97" r="10" className="jshs-illustration-accent" fillOpacity="0.6" />
        <circle cx="230" cy="107" r="10" className="jshs-illustration-accent" fillOpacity="0.6" />
      </g>
    );
  }

  // 11. Search
  if (name === "site-search") {
    return (
      <g className="jshs-art-group">
        <circle className="jshs-illustration-fill" cx="152" cy="114" r="62" />
        <circle fill="white" cx="152" cy="114" r="38" />
        <path className="jshs-illustration-line" d="m196 158 58 58" strokeWidth="8" strokeLinecap="round" />
        <path className="jshs-illustration-accent" d="M140 114h24m-12-12v24" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    );
  }

  // 12. Account & Member
  if (name === "account") {
    return (
      <g className="jshs-art-group">
        <circle className="jshs-illustration-fill" cx="180" cy="90" r="46" />
        <circle cx="180" cy="80" r="22" fill="white" />
        <path className="jshs-illustration-fill" d="M96 204c6-48 38-70 84-70s78 22 84 70H96Z" />
      </g>
    );
  }

  // Default Fallback
  return (
    <g className="jshs-art-group">
      <rect className="jshs-illustration-fill" x="93" y="62" width="174" height="128" rx="18" />
      <path className="jshs-illustration-line" d="M123 100h114M123 130h87M123 160h57" strokeWidth="2.5" strokeLinecap="round" />
      <path className="jshs-illustration-accent" d="m246 65 16 16 27-34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  );
}

export function FeatureIllustration({
  name,
  theme,
  className = "",
}: {
  name: FeatureIllustrationName;
  theme: FeatureThemeName;
  className?: string;
}) {
  return (
    <svg
      className={`jshs-feature-illustration ${className}`}
      data-theme={theme}
      viewBox="0 0 360 240"
      role="img"
      aria-label={labels[name]}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Theme Ambient Radial Orbs */}
        <radialGradient id="ill-grad-orb" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--feature-primary, #2563EB)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--feature-primary-hover, #1D4ED8)" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="ill-grad-pin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--feature-primary, #2563EB)" />
          <stop offset="100%" stopColor="var(--feature-accent, #60A5FA)" />
        </linearGradient>
        <linearGradient id="ill-grad-trend" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--feature-primary, #2563EB)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--feature-surface, #EFF6FF)" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Apple-grade Ambient Blurred Light Halos */}
      <circle className="jshs-illustration-orb" cx="284" cy="76" r="64" fill="var(--feature-surface-strong, #DBEAFE)" opacity="0.65" filter="blur(16px)" />
      <circle className="jshs-illustration-orb is-small" cx="77" cy="183" r="38" fill="var(--feature-surface, #EFF6FF)" opacity="0.75" filter="blur(12px)" />

      <Scene name={name} />
    </svg>
  );
}
