# JSHS Design System — 全國國中升學資訊網設計規範 (Master Specification)

> **版本**：v2.0 (Apple Human Interface & Education Clarity)  
> **適用範圍**：JSHS.CC 全站（首頁、查學校、會考落點、模擬考、排志願、升學行事曆、指南與信任中心）  
> **維護準則**：所有 UI/UX 開發與樣式修改必須嚴格依據本規範，並維持現有 363 項自動化測試契約與極速載入效能。

---

## 一、設計哲學與三大核心原則 (Core Philosophy)

1. **Apple Human Interface 的極致精緻感 (Apple Aesthetic Elegance)**
   - **透光感與微質感**：告別粗硬灰框與生硬漸層，以極淺微光細邊框（`rgba(15, 23, 42, 0.07)`）、柔和環境光散射（Radial Ambient Glow）與高品質毛玻璃（`backdrop-filter: blur(20px) saturate(180%)`）營造空靈通透的現代介面。
   - **超橢圓幾何語彙 (Squircle)**：卡片與圖示外觀採用 iOS 經典超橢圓曲率，提供溫潤和諧的視覺觸感。

2. **國家級升學平台的信任與親和力 (Clarity, Trust & Legibility)**
   - **高對比易讀性**：內文與重點資訊必須嚴格遵循 WCAG 2.1 AA 標準（文字對比度 $\ge 4.5:1$），避免使用灰弱難辨的低對比文字。
   - **任務導向資訊架構**：以學生與家長決策流為核心，層級清晰，降低升學焦慮。

3. **克制自然的動態體驗 (Restrained & Purposeful Motion)**
   - 動畫服務於「引導注意力」與「空間連續性」，絕不為了炫技而動。
   - 嚴格支援並落實 `@media (prefers-reduced-motion: reduce)` 無障礙規範。

---

## 二、基礎設計變數 (Design Tokens)

本專案樣式之唯一真實來源（Single Source of Truth）為 `public/design-tokens.css` 與 `app/globals.css`。

### 1. 畫布底色與表面階層 (Surface & Canvas System)
| 變數名稱 | 色碼 / 值 | 用途說明 |
| :--- | :--- | :--- |
| `--bg-page` | `#F7F9FC` (牛奶霧白) | 主畫布底色，高階清爽不刺眼 |
| `--bg-section-alt` | `#FFFFFF` (純淨白) | 區塊交替呼吸底色 |
| `--bg-subtle` | `#F1F5F9` (冰晶淡藍灰) | 次級面板、標籤底色、淺色區塊 |
| `--bg-elevated` | `#FFFFFF` | 卡片表面、對話框、選單底色 |
| `--bg-glass` | `rgba(255, 255, 255, 0.84)` | 頂部導覽列、搜尋條、底欄毛玻璃表面 |
| `--spotlight-dark` | `linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #1E3A8A 100%)` | 重點舞台、會考倒數、夜間大看板 |

### 2. 文字色彩階層 (Typography Ink Hierarchy)
| 變數名稱 | 色碼 / 值 | 用途說明 |
| :--- | :--- | :--- |
| `--text-primary` | `#0F172A` / `#172033` | 主標題、重點學校名稱、關鍵數據（深邃鈦黑藍） |
| `--text-secondary` | `#475569` / `#667085` | 說明內文、副標題、屬性標籤（石板沉穩灰） |
| `--text-tertiary` | `#94A3B8` / `#98A2B3` | 次要補充、來源標註、禁用或未提供提示 |

### 3. 功能專屬主題色 (Feature Themes)
依據 `lib/feature-themes.ts` 規範，各功能模組嚴格綁定語意主題色：
- **找學校（Schools）**：Apple 皇家藍 `Primary: #2563EB`｜`Surface: #EFF6FF`｜`Border: #BFDBFE`
- **成績分析 / 試算（Analytics / Tools）**：適性薄荷綠 `Primary: #047857`｜`Surface: #ECFDF5`｜`Border: #A7F3D0`
- **模擬考落點（Mock Exam）**：星芒紫 `Primary: #7C3AED`｜`Surface: #F5F3FF`｜`Border: #DDD6FE`
- **我的志願 / 規劃（Planner）**：珊瑚玫瑰紅 `Primary: #E11D48`｜`Surface: #FFF7ED`｜`Border: #FED7AA`
- **升學時程（Schedule）**：琥珀金 `Primary: #D97706`｜`Surface: #FFFBEB`｜`Border: #FDE68A`
- **升學指南（Guide）**：知識松石綠 `Primary: #0F766E`｜`Surface: #F0FDFA`｜`Border: #99F6E4`
- **資料與信任（Trust）**：中性石板灰 `Primary: #475569`｜`Surface: #F8FAFC`｜`Border: #CBD5E1`

### 4. 圓角尺度規範 (Border Radii)
- `--radius-sm: 8px`：小型微標籤、內部微控制項
- `--radius-md: 12px`：通用按鈕、表單輸入框、下拉選單
- `--radius-lg: 16px`：內部次級面板、手風琴摺疊區、App 圖示 Squircle
- `--radius-xl: 20px`：標準功能卡片、學校卡片、對話框
- `--radius-2xl: 28px`：首頁 Bento 大卡、Hero 舞台看板
- `--radius-full: 9999px`：膠囊標籤（Capsules）、Spotlight 搜尋列、浮動操作列

### 5. 蘋果風多層次環境陰影 (Apple Ambient Shadows)
- **卡片靜止陰影 (`--shadow-card`)**：  
  `0 2px 6px -1px rgba(15, 23, 42, 0.03), 0 10px 28px -4px rgba(15, 23, 42, 0.05)`
- **卡片懸停微浮 (`--shadow-hover`)**：  
  `0 14px 36px -6px rgba(15, 23, 42, 0.10), 0 4px 12px -2px rgba(15, 23, 42, 0.05)`
- **下拉浮層與導覽選單 (`--shadow-dropdown`)**：  
  `0 24px 60px -12px rgba(15, 23, 42, 0.14), 0 4px 16px -2px rgba(15, 23, 42, 0.06)`

---

## 三、字體排版與層級節奏 (Typography & Rhythm)

### 1. 字型棧 (Font Stack)
全站統一採用跨平台系統最適字型棧，嚴禁載入未經審查的外部裝飾性 Webfont：
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
```

### 2. 標題與內文字級比例 (Type Scale)
- **Display 1 (超大標)**：`clamp(36px, 4.5vw, 52px)`｜`line-height: 1.15`｜`letter-spacing: -0.035em`｜`font-weight: 800`
- **H1 (頁面主標)**：`clamp(30px, 3.8vw, 38px)`｜`line-height: 1.2`｜`letter-spacing: -0.03em`｜`font-weight: 800`
- **H2 (章節標題)**：`24px`｜`line-height: 1.35`｜`letter-spacing: -0.025em`｜`font-weight: 750`
- **H3 (卡片標題)**：`18px ~ 20px`｜`line-height: 1.4`｜`letter-spacing: -0.02em`｜`font-weight: 700`
- **Body (標準內文)**：`15px ~ 16px`｜`line-height: 1.65`｜`font-weight: 400 ~ 500`
- **Small (次要資訊 / 輔助說明)**：`13px ~ 14px`｜`line-height: 1.5`｜`font-weight: 500`
- **Capsule / Badge (膠囊微標籤)**：`11px ~ 12px`｜`line-height: 1.35`｜`font-weight: 700`

---

## 四、版面佈局與響應式規則 (Layout & Responsive Breakpoints)

### 1. 版面軌道規範 (Layout Rails)
- **最大內容寬度 (`--content-max`)**：`1200px`（置中對齊，兩側安全 Gutter: `24px`，手機端 `16px`）
- **文字閱讀窄軌 (`--content-narrow-max`)**：`760px`（文章、指南、問答與隱私條款）
- **全屏舞台 (Full-bleed Hero)**：背景延展至 100vw，內部內容嚴格約束於 1200px 軌道內

### 2. 斷點規格 (Breakpoints)
- **手機端 (Mobile)**：`< 768px`
  - 導覽轉為底部 5 欄式毛玻璃導覽列（`mobile-bottom-nav`）
  - 網格全面收縮為 1 欄（卡片）或 2 欄（緊湊方塊）
  - 底部自動避讓安全距離：`padding-bottom: calc(68px + env(safe-area-inset-bottom))`
- **平板端 (Tablet)**：`768px ~ 1023px`
  - 網格為 2 欄至 3 欄
  - 抽屜選單保持觸控友善模式
- **桌面端 (Desktop)**：`1024px ~ 1439px`
  - 頂部完整 3 欄式導覽列（品牌、下拉選單、搜尋與會員）
  - 學校網格為 3 欄式佈局
- **寬螢幕 (Wide Screen)**：`1440px+`
  - 學校網格與 Bento 擴展為標準 4 欄式佈局

---

## 五、共用元件標準規格 (Component Specifications)

### 1. 按鈕系統 (Buttons)
- **Primary Button (主要操作)**：
  - 尺寸：高 `42px ~ 46px`，左右 Padding `18px ~ 24px`，`border-radius: 9999px`
  - 樣式：主題色漸層，搭配頂部 1px 晶瑩微光高光
  - 交互：懸停微浮 `translateY(-2px)`，點擊彈性按壓 `scale(0.97)`
- **Secondary / Quiet Button (次要操作)**：
  - 樣式：純白表面，微光細邊框 `rgba(15, 23, 42, 0.08)`，文字深藍黑
  - 交互：懸停背景轉為 `#F8FAFC`，邊框呈現主題色光暈
- **觸控目標規範**：手機端所有可點擊元件（按鈕、選單項目、分頁）之點擊面積**不得小於 44px $\times$ 44px**。

### 2. Apple Spotlight 指令級搜尋列 (Command Bar)
- 全曲率流體膠囊（`border-radius: 9999px`），內建毛玻璃（`backdrop-filter: blur(24px)`）
- 聚焦狀態（Focus Ring）：呈現平滑發散之 Apple Blue 微光環（`box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12)`）
- 提交按鈕：內嵌於搜尋列右側，純圓微立體漸層按鈕，點擊時具備微彈性反饋。

### 3. 學校卡片與 App Icon Squircle
- 卡片主體：白色底、`border-radius: 20px`、微光細邊框，懸停時上浮 4px 並產生主題色發光邊框。
- 左側象徵圖示（Symbol）：
  - 比例：`52px × 52px`，圓角 `16px`（超橢圓比例）
  - 公立學校：採用 Apple 寶石藍漸層（`#3B82F6` $\to$ `#1D4ED8`）＋ 頂部 1px 內發光
  - 私立學校：採用 Apple 皇家紫漸層（`#8B5CF6` $\to$ `#6D28D9`）＋ 頂部 1px 內發光
  - 符號：白色俐落向量 SVG，懸停時平滑微動態放大 `scale(1.06)`

### 4. 膠囊標籤 (Capsules & Badges)
- 統一採用 9999px 膠囊，禁用直角方塊：
  - 公立：天藍膠囊（底色 `#EFF6FF`，字色 `#1D4ED8`，邊框 `rgba(37, 99, 235, 0.16)`）
  - 學校類型：淡紫膠囊（底色 `#F5F3FF`，字色 `#6D28D9`，邊框 `rgba(124, 58, 237, 0.16)`）
  - 性別限制：石板灰膠囊（底色 `#F1F5F9`，字色 `#475569`，邊框 `rgba(15, 23, 42, 0.08)`）

---

## 六、圖示系統規範 (Iconography)

1. 全站圖示統一調用 `components/site-icons.tsx` 中的 `<SiteIcon name="..." />` 元件。
2. 向量規格：統一 `viewBox="0 0 24 24"`，描邊 `strokeWidth={1.8}`，端點與連接點圓角（`strokeLinecap="round"`, `strokeLinejoin="round"`），著色一律繼承 `currentColor`。
3. **嚴禁在介面以 Emoji 作為導覽與核心功能圖示**，確保專業度與跨作業系統（iOS / Android / Windows）一致性。

---

## 七、動畫與動態體驗規範 (Motion & Animation System)

### 1. 動態準則
- **時間長度**：微互動（點擊、懸停）`160ms ~ 220ms`；區域切換、抽屜滑出 `280ms ~ 360ms`。
- **緩動曲線 (Apple Curve)**：
  ```css
  --ease-apple: cubic-bezier(0.22, 1, 0.36, 1);
  ```
- **效能鐵律**：動畫僅允許操作 GPU 硬體加速屬性（`transform` 與 `opacity`），嚴禁對 `width`、`height`、`top`、`margin` 進行頻繁連續動畫。

### 2. 無障礙動態支援 (Prefers Reduced Motion)
當系統開啟減少動態效果時，全站必須立即停用位移動畫，僅保留微弱透明度淡入：
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 八、開發與回歸驗證檢驗清單 (Verification Checklist)

任何 UI 與樣式修改完成後，工程師必須依序通過以下檢核方可提報：
- [ ] 執行 `pnpm run typecheck`（TypeScript 零型別錯誤）
- [ ] 執行 `pnpm run lint`（ESLint 零規則警告或錯誤）
- [ ] 執行 `pnpm run test`（363 項測試全數通過，0 failed）
- [ ] 執行 `pnpm run build`（RSC 與客戶端打包成功）
- [ ] 執行實際瀏覽器驗收：以 1280px 桌面與 390px 手機尺寸進行截圖與佈局檢查
- [ ] 檢查點擊面積：所有行動裝置按鈕與連結均符合 $\ge 44\text{px}$ 觸控規格
- [ ] 檢查色彩對比：所有文字與背景對比度均高於 4.5:1
- [ ] 檢查底欄避讓：手機版畫面底部無任何重要操作被底部導覽列或 Safe Area 遮擋
