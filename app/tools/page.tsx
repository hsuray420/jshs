import type { Metadata } from "next";
import { HubPage, type HubCard } from "@/components/hub-page";

const title = "升學工具｜從積分試算到志願清單";
const description = "集中使用積分試算、落點分析、志願清單、校科比較、通勤比較與升學時程，讓每次查資料都能留下可執行的結果。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tools" },
  openGraph: { type: "website", locale: "zh_TW", url: "/tools", siteName: "全國國中升學資訊網", title, description },
};

const cards: readonly HubCard[] = [
  { eyebrow: "SCORE", title: "積分試算", description: "依就學區與學年度規則整理會考、多元表現與其他採計項目，清楚看見積分組成。", href: "/districts", action: "先選擇就學區", status: "依區開放" },
  { eyebrow: "PLACEMENT", title: "落點分析", description: "把目前資料轉成挑戰、適中與穩定區間，用來討論風險，而不是宣稱保證錄取。", href: "/districts", action: "查看可用地區", status: "依區開放" },
  { eyebrow: "WISH LIST", title: "志願清單", description: "收藏願意就讀的校科、安排順序並記錄待確認問題，讓志願不是只剩一串校名。", href: "/planner", action: "開啟我的規劃", status: "本機保存" },
  { eyebrow: "COMPARE", title: "校科比較", description: "把科別、名額、通勤與備註放在同一張比較表，降低在多個網頁來回切換的負擔。", href: "/schools", action: "開始找學校", status: "全區資料" },
  { eyebrow: "COMMUTE", title: "通勤比較", description: "用可長期承受的每日移動時間檢查候選選項，將生活條件納入升學決策。", href: "/planner", action: "整理候選清單", status: "本機保存" },
  { eyebrow: "TIMELINE", title: "升學時程表", description: "分開呈現已公告日期與待公告事項，不拿上一學年度日期冒充本年度正式時程。", href: "/news/exam", action: "查看會考準備", status: "持續更新" }
];

export default function ToolsPage() {
  return <HubPage activeHref="/tools" eyebrow="ADMISSION TOOLKIT" title="工具不是答案，\n是把選擇做清楚。" description={description} cards={cards} closingTitle="先確認就學區，再使用正確版本的工具。" closingDescription="不同就學區的採計方式與功能開放狀態不同；從地區入口開始，系統會標示可使用的項目。" closingHref="/districts" closingAction="選擇就學區" />;
}
