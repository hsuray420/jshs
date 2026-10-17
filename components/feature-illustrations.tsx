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
  // 1. Schools & Navigation (Spatial Radar, Bobbing Pin, 3D Grid)
  if (["school-search", "school-map", "commute"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Isometric perspective campus map plane */}
        <polygon points="50,172 180,218 310,172 180,126" fill="#0F172A" fillOpacity="0.04" />
        <polygon points="50,172 180,218 180,226 50,180" fill="#0F172A" fillOpacity="0.08" />
        <polygon points="180,218 310,172 310,180 180,226" fill="#0F172A" fillOpacity="0.12" />

        {/* Campus Academy Building */}
        <path d="M86 165V105l94-42 94 42v60H86Z" fill="#1E3A8A" fillOpacity="0.88" />
        <polygon points="180,42 145,63 215,63" fill="#3B82F6" />
        <rect x="168" y="63" width="24" height="26" fill="#FFFFFF" rx="4" />
        <circle cx="180" cy="74" r="5" fill="#1E3A8A" />

        {/* Architectural lines & Arched Portico */}
        <path d="M74 165h212M112 165v-48h136v48M180 89v76M130 135h22m76 0h22" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M166 165v-24c0-7 6-13 14-13s14 6 14 13v24" fill="#FFFFFF" />

        {/* Sonar Radar Waves radiating outwards */}
        <circle className="apple-radar-wave-1" cx="258" cy="66" r="14" fill="none" stroke="#2563EB" />
        <circle className="apple-radar-wave-2" cx="258" cy="66" r="14" fill="none" stroke="#2563EB" />

        {/* 3D Floating Droplet Pin with gentle levitation */}
        <g className="apple-pin-float" transform="translate(240, 42)">
          <path d="M18 42c6 0 12 3 12 6s-6 6-12 6-12-3-12-6 6-6 12-6Z" fill="#0F172A" fillOpacity="0.15" />
          <path d="M18 0C8 0 0 8 0 18c0 14 18 30 18 30s18-16 18-30C36 8 28 0 18 0Z" fill="url(#ill-grad-pin)" filter="url(#ill-shadow-card)" />
          <circle cx="18" cy="17" r="7" fill="#FFFFFF" />
          <circle cx="18" cy="17" r="3" fill="#1D4ED8" />
        </g>

        {/* Floating Haptic Chip: 15 就學區 */}
        <g className="apple-float-chip-left" transform="translate(36, 68)">
          <rect width="94" height="30" rx="15" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-chip)" />
          <circle cx="16" cy="15" r="7" fill="#EFF6FF" />
          <path d="M16 10l2 5-5-2 3-3z" fill="#2563EB" />
          <text x="28" y="19" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">15 就學區</text>
        </g>

        {name === "commute" && (
          <path d="M70 185c36-12 48 18 90 6 36-10 52-32 80-24" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
        )}
      </g>
    );
  }

  // 2. Exam History & Trend Analytics
  if (["admissions-history", "score-history", "planner-history"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Layered Frosted Glass Cards */}
        <rect x="94" y="44" width="172" height="138" rx="20" fill="#0F172A" fillOpacity="0.04" transform="rotate(-3 180 112)" />
        <rect x="88" y="50" width="184" height="144" rx="22" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-card)" />

        {/* Chart Grid Lines */}
        <path d="M116 88h128M116 120h128M116 152h128" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Trend Area Gradient & Smooth Line */}
        <path d="M124 148l32-26 34 16 46-52v62H124Z" fill="url(#ill-grad-trend)" />
        <path d="M124 148l32-26 34 16 46-52" fill="none" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Glowing Data Nodes with subtle pulse */}
        <circle cx="124" cy="148" r="5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
        <circle cx="156" cy="122" r="5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
        <circle cx="190" cy="138" r="5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
        <circle className="apple-indicator-dot" cx="236" cy="86" r="6" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />

        {/* Floating Haptic Chip */}
        <g className="apple-float-chip-right" transform="translate(228, 38)">
          <rect width="94" height="28" rx="14" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-chip)" />
          <circle cx="14" cy="14" r="4" fill="#10B981" />
          <text x="24" y="18" fill="#0F172A" fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif">歷年曲線</text>
        </g>
      </g>
    );
  }

  // 3. Side-by-Side Comparison & Placement Distribution
  if (["school-compare", "placement", "score-summary"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Left Column Card */}
        <rect x="62" y="60" width="104" height="132" rx="20" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-card)" />
        <rect x="76" y="76" width="76" height="12" rx="6" fill="#EFF6FF" />
        <path d="M76 102h54M76 124h74M76 146h42M76 166h60" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

        {/* VS / Comparison Glowing Beacon */}
        <circle cx="180" cy="124" r="22" fill="url(#ill-grad-orb)" filter="url(#ill-shadow-chip)" />
        <path d="M174 116l12 16m0-16l-12 16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

        {/* Right Column Card */}
        <rect x="194" y="60" width="104" height="132" rx="20" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-card)" />
        <rect x="208" y="76" width="76" height="12" rx="6" fill="#F0FDF4" />
        <path d="M208 102h74M208 124h54M208 146h68M208 166h48" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }

  // 4. Calculator & Admission Score Engine (Apple Kinetic Dynamic Stage)
  if (["cost-calculator", "score-calculator", "score-rules"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Kinetic Concentric Charge Arc */}
        <circle cx="180" cy="118" r="92" stroke="#0F172A" strokeOpacity="0.06" strokeWidth="5" fill="none" />
        <circle
          className="apple-kinetic-arc"
          cx="180"
          cy="118"
          r="92"
          stroke="url(#ill-grad-arc)"
          strokeWidth="6"
          strokeDasharray="578"
          strokeDashoffset="144"
          strokeLinecap="round"
          fill="none"
          transform="rotate(-90 180 118)"
        />

        {/* Central Frosted Glass Pod Body */}
        <rect x="114" y="38" width="132" height="162" rx="26" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1.5" filter="url(#ill-shadow-card)" />

        {/* Digital LCD Screen Display */}
        <rect x="126" y="52" width="108" height="42" rx="12" fill="#0F172A" />
        {/* Readiness Pulsing Dot */}
        <circle className="apple-indicator-dot" cx="138" cy="73" r="4" fill="#10B981" />
        {/* Digital Score Output */}
        <text x="148" y="78" fill="#F8FAFC" fontSize="15" fontWeight="850" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.02em">108.0</text>
        <text x="222" y="76" fill="#94A3B8" fontSize="9" fontWeight="600" textAnchor="end" fontFamily="system-ui, sans-serif">即時試算</text>

        {/* 4x3 Haptic Keypad Grid */}
        <rect x="126" y="104" width="22" height="18" rx="6" fill="#F8FAFC" stroke="rgba(15,23,42,0.06)" />
        <rect x="155" y="104" width="22" height="18" rx="6" fill="#F8FAFC" stroke="rgba(15,23,42,0.06)" />
        <rect x="184" y="104" width="22" height="18" rx="6" fill="#F8FAFC" stroke="rgba(15,23,42,0.06)" />
        <rect x="212" y="104" width="22" height="18" rx="6" fill="#ECFDF5" />

        <rect x="126" y="128" width="22" height="18" rx="6" fill="#F8FAFC" stroke="rgba(15,23,42,0.06)" />
        <rect x="155" y="128" width="22" height="18" rx="6" fill="#F8FAFC" stroke="rgba(15,23,42,0.06)" />
        <rect x="184" y="128" width="22" height="18" rx="6" fill="#F8FAFC" stroke="rgba(15,23,42,0.06)" />
        <rect x="212" y="128" width="22" height="18" rx="6" fill="#ECFDF5" />

        <rect x="126" y="152" width="51" height="20" rx="6" fill="#F8FAFC" stroke="rgba(15,23,42,0.06)" />
        <rect x="184" y="152" width="50" height="20" rx="6" fill="url(#ill-grad-pin)" />

        {/* Floating Haptic Chip 1: 會考 30 分 */}
        <g className="apple-float-chip-left" transform="translate(32, 68)">
          <rect width="92" height="30" rx="15" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-chip)" />
          <circle cx="16" cy="15" r="7" fill="#ECFDF5" />
          <path d="M13 15l2 2 4-4" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <text x="28" y="19" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">會考 30 分</text>
        </g>

        {/* Floating Haptic Chip 2: 多元 40 分 */}
        <g className="apple-float-chip-right" transform="translate(236, 142)">
          <rect width="92" height="30" rx="15" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-chip)" />
          <circle cx="16" cy="15" r="7" fill="#EFF6FF" />
          <polygon points="16,10 17.5,13.5 21,13.5 18,16 19.5,19.5 16,17.5 12.5,19.5 14,16 11,13.5 14.5,13.5" fill="#2563EB" />
          <text x="28" y="19" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">多元 40 分</text>
        </g>
      </g>
    );
  }

  // 5. Alumni & Community Sharing
  if (["alumni", "assistant", "support"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Floating Dialogue Bubble 1 */}
        <g className="apple-float-chip-left" transform="translate(68, 62)">
          <rect width="180" height="74" rx="20" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" filter="url(#ill-shadow-card)" />
          <path d="M22 28h136M22 46h92" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Floating Dialogue Bubble 2 */}
        <g className="apple-float-chip-right" transform="translate(140, 118)">
          <rect width="154" height="64" rx="18" fill="#1E293B" filter="url(#ill-shadow-chip)" />
          <path d="M22 24h110M22 40h72" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Floating Avatar Orb */}
        <g transform="translate(262, 54)">
          <circle cx="18" cy="18" r="22" fill="#3B82F6" filter="url(#ill-shadow-chip)" />
          <circle cx="18" cy="14" r="7" fill="#FFFFFF" />
          <path d="M7 30c0-6 5-10 11-10s11 4 11 10" fill="#FFFFFF" />
        </g>
      </g>
    );
  }

  // 6. Schedule, Calendar & Countdown Timeline (Apple Watch Chrono Style)
  if (["open-day", "schedule", "timeline", "schedule-now", "todo", "calendar-export"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Chronograph Dial Precision Ticks */}
        <circle cx="180" cy="118" r="92" stroke="#0F172A" strokeOpacity="0.08" strokeWidth="3" strokeDasharray="3 6" fill="none" />

        {/* Smooth Rotating Sweep Hand */}
        <g className="apple-sweep-hand">
          <line x1="180" y1="118" x2="180" y2="38" stroke="url(#ill-grad-amber)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="180" cy="38" r="4.5" fill="#D97706" />
        </g>

        {/* Central Apple-Style Calendar Flip Pod */}
        <rect x="122" y="62" width="116" height="112" rx="24" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1.5" filter="url(#ill-shadow-card)" />
        <path d="M122 62h116v32H122z" fill="url(#ill-grad-amber)" rx="24" />
        <text x="180" y="83" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="system-ui, sans-serif">116 國中會考</text>
        <text x="180" y="132" fill="#0F172A" fontSize="28" fontWeight="900" textAnchor="middle" letterSpacing="-0.03em" fontFamily="system-ui, sans-serif">倒數</text>
        <circle className="apple-indicator-dot" cx="180" cy="154" r="3.5" fill="#10B981" />

        {/* Floating Haptic Chip: 重要時程 */}
        <g className="apple-float-chip-left" transform="translate(34, 66)">
          <rect width="88" height="28" rx="14" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-chip)" />
          <text x="44" y="18" fill="#0F172A" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">行事曆整合</text>
        </g>
      </g>
    );
  }

  // 7. Knowledge Guide, Encyclopedia & Career Radar
  if (["career-groups", "guide", "admission-basics", "choice-score", "eligibility", "encyclopedia", "career-explore"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* 3D Unfolded Hardcover Book */}
        <path d="M72 74c44-18 72 2 108 26v100c-36-24-64-42-108-24V74Zm216 0c-44-18-72 2-108 26v100c36-24 64-42 108-24V74Z" fill="#0F766E" fillOpacity="0.85" filter="url(#ill-shadow-card)" />
        <path d="M180 100v100" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <path d="M98 108c24-8 44 2 62 14m-62 26c24-8 44 2 62 14m102-54c-24-8-44 2-62 14m62 26c-24-8-44 2-62 14" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
        {/* Top Glowing Compass / Beacon */}
        <g transform="translate(180, 52)">
          <circle cx="0" cy="0" r="22" fill="url(#ill-grad-orb)" filter="url(#ill-shadow-chip)" />
          <polygon points="0,-14 5,0 0,14 -5,0" fill="#FFFFFF" />
        </g>
      </g>
    );
  }

  // 8. Wishlist Planner, Sorting & Recommendations (Luminous iOS Card Widgets)
  if (["planner", "planner-recommendation", "planner-health", "planner-export", "official-platform"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* Magnetic Stack of iOS Widget Style Cards */}
        <g className="apple-stack-float">
          {/* Card 3 (Back) */}
          <g transform="translate(0, 0)">
            <rect x="74" y="44" width="198" height="46" rx="16" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-card)" />
            <circle cx="94" cy="67" r="11" fill="#F5F3FF" />
            <text x="94" y="71" fill="#7C3AED" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="system-ui, sans-serif">3</text>
            <text x="114" y="71" fill="#334155" fontSize="12" fontWeight="700" fontFamily="system-ui, sans-serif">成功高中 · 普通科</text>
            <rect x="224" y="57" width="38" height="20" rx="6" fill="#F8FAFC" />
            <text x="243" y="71" fill="#64748B" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">31.8</text>
          </g>

          {/* Card 2 (Middle) */}
          <g transform="translate(0, 0)">
            <rect x="80" y="92" width="198" height="46" rx="16" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-card)" />
            <circle cx="100" cy="115" r="11" fill="#EFF6FF" />
            <text x="100" y="119" fill="#2563EB" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="system-ui, sans-serif">2</text>
            <text x="120" y="119" fill="#334155" fontSize="12" fontWeight="700" fontFamily="system-ui, sans-serif">師大附中 · 普通科</text>
            <rect x="230" y="105" width="38" height="20" rx="6" fill="#F8FAFC" />
            <text x="249" y="119" fill="#64748B" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">33.6</text>
          </g>

          {/* Card 1 (Front Active Highlighted) */}
          <g transform="translate(0, 0)">
            <rect x="86" y="140" width="198" height="48" rx="16" fill="#FFFFFF" stroke="#E11D48" strokeOpacity="0.38" strokeWidth="1.5" filter="url(#ill-shadow-card)" />
            <rect x="98" y="152" width="68" height="24" rx="12" fill="#FFF1F2" />
            <text x="132" y="168" fill="#E11D48" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily="system-ui, sans-serif">#1 第一志願</text>
            <text x="174" y="169" fill="#0F172A" fontSize="12" fontWeight="800" fontFamily="system-ui, sans-serif">建國中學</text>
            <rect x="232" y="154" width="42" height="20" rx="10" fill="#ECFDF5" />
            <text x="253" y="168" fill="#059669" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">✓ 穩固</text>
          </g>
        </g>

        {/* Floating Haptic Chip: 即時排序中 */}
        <g className="apple-float-chip-right" transform="translate(232, 50)">
          <rect width="94" height="30" rx="15" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-chip)" />
          <circle className="apple-indicator-dot" cx="16" cy="15" r="3.5" fill="#E11D48" />
          <text x="28" y="19" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">即時排序中</text>
        </g>
      </g>
    );
  }

  // 9. Trust, Verification, Shield & Credibility
  if (["trust", "source-registry", "data-status", "credibility"].includes(name)) {
    return (
      <g className="jshs-art-group">
        {/* 3D Verification Shield */}
        <path d="M180 32 268 68v64c0 56-40 84-88 102-48-18-88-46-88-102V68l88-36Z" fill="#1E293B" filter="url(#ill-shadow-card)" />
        <path d="M180 44l76 32v56c0 48-34 72-76 88V44Z" fill="#FFFFFF" fillOpacity="0.18" />

        {/* Official Double Checkmark Seal */}
        <circle cx="180" cy="132" r="34" fill="url(#ill-grad-orb)" filter="url(#ill-shadow-chip)" />
        <path d="M164 132l11 11 22-24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Radiating Trust Beams */}
        <circle cx="180" cy="132" r="46" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4" />
      </g>
    );
  }

  // 10. Districts & Taiwan Map
  if (name === "districts") {
    return (
      <g className="jshs-art-group">
        <path d="M74 182 113 72l70 25 47-45 56 55-50 75-72-18-90 18Z" fill="#2563EB" fillOpacity="0.8" filter="url(#ill-shadow-card)" />
        <path d="m113 72 51 92m19-67 53 85m-6-130-66 112" stroke="#FFFFFF" strokeWidth="2.5" />
        <circle cx="125" cy="113" r="14" fill="#60A5FA" />
        <circle cx="184" cy="97" r="10" fill="#60A5FA" fillOpacity="0.6" />
        <circle cx="230" cy="107" r="10" fill="#60A5FA" fillOpacity="0.6" />
      </g>
    );
  }

  // 11. Search
  if (name === "site-search") {
    return (
      <g className="jshs-art-group">
        <circle cx="152" cy="114" r="62" fill="#2563EB" filter="url(#ill-shadow-card)" />
        <circle cx="152" cy="114" r="38" fill="#FFFFFF" />
        <path d="m196 158 58 58" stroke="#0F172A" strokeWidth="8" strokeLinecap="round" />
        <path d="M140 114h24m-12-12v24" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    );
  }

  // 12. Account & Member
  if (name === "account") {
    return (
      <g className="jshs-art-group">
        <circle cx="180" cy="90" r="46" fill="#1E293B" filter="url(#ill-shadow-card)" />
        <circle cx="180" cy="80" r="22" fill="#FFFFFF" />
        <path d="M96 204c6-48 38-70 84-70s78 22 84 70H96Z" fill="#1E293B" />
      </g>
    );
  }

  // Default Fallback
  return (
    <g className="jshs-art-group">
      <rect x="93" y="62" width="174" height="128" rx="18" fill="#FFFFFF" stroke="rgba(15,23,42,0.08)" strokeWidth="1" filter="url(#ill-shadow-card)" />
      <path d="M123 100h114M123 130h87M123 160h57" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m246 65 16 16 27-34" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
        {/* Dynamic Glow Radial & Linear Gradients */}
        <radialGradient id="ill-grad-orb" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="var(--feature-primary, #2563EB)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--feature-primary-hover, #1D4ED8)" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="ill-grad-pin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="ill-grad-arc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="60%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="ill-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="ill-grad-trend" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
        </linearGradient>

        {/* Apple Ambient Soft Elevation Filters */}
        <filter id="ill-shadow-chip" x="-15%" y="-25%" width="130%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.06" />
        </filter>
        <filter id="ill-shadow-card" x="-15%" y="-20%" width="130%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.07" />
        </filter>
      </defs>

      {/* Luminous Ambient Light Halo with clean feathered blur */}
      <circle cx="270" cy="74" r="56" fill="var(--feature-surface-strong, #EFF6FF)" opacity="0.4" filter="blur(20px)" />

      <Scene name={name} />
    </svg>
  );
}
