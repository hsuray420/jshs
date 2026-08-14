import type { Metadata } from "next";
import { HubPage, type HubCard } from "@/components/hub-page";

const title = "找學校｜全國高中職、校科與五專探索";
const description = "從全國就學區、校科、十五群科與五專路徑探索升學選項，將學習內容、通勤與後續發展放在同一套決策流程。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/schools" },
  openGraph: { type: "website", locale: "zh_TW", url: "/schools", siteName: "全國國中升學資訊網", title, description },
};

const cards: readonly HubCard[] = [
  { eyebrow: "DIRECTORY", title: "全國校科查詢", description: "依就學區查看高中職學校與科別資料，再進一步整理願意深入了解的候選選項。", href: "/districts", action: "選擇就學區", status: "15 區" },
  { eyebrow: "COMPARE", title: "學校與校科比較", description: "比較課程方向、通勤、名額與個人備註，不讓單一分數或熟悉校名取代完整判斷。", href: "/tools", action: "使用比較工具", status: "可使用" },
  { eyebrow: "GROUPS", title: "十五群科探索", description: "先理解不同群科在學什麼、需要哪些興趣與能力，再回到各區查找實際開設校科。", href: "/news/schools", action: "閱讀校科探索", status: "內容擴充中" },
  { eyebrow: "FIVE-YEAR", title: "五專專區", description: "理解五專的學習年限、專業方向與升學路徑，並和普通高中、技術型高中一起比較。", href: "/it_5/it_5.html", action: "查看五專資訊", status: "正式資料" }
];

export default function SchoolsPage() {
  return <HubPage activeHref="/schools" eyebrow="SCHOOL EXPLORATION" title="找的不是校名，\n是適合你的學習環境。" description={description} cards={cards} closingTitle="找到候選校科後，把它們放進同一份規劃。" closingDescription="收藏、比較、記錄疑問與通勤條件，之後再搭配正式規則與成績調整志願。" closingHref="/planner" closingAction="開啟我的規劃" />;
}
