import type { Metadata } from "next";
import { HubPage, type HubCard } from "@/components/hub-page";

const title = "我的升學規劃｜收藏、志願與待辦";
const description = "整理收藏校科、志願結構、待辦清單與重要日期；個人規劃保存在使用中的瀏覽器，不建立公開搜尋頁面。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/planner" },
  robots: { index: false, follow: false },
};

const cards: readonly HubCard[] = [
  { eyebrow: "SAVED SCHOOLS", title: "收藏校科", description: "把有興趣的學校與科別先收進候選池，保留通勤、課程與待確認問題。", href: "/districts?target=analysis", action: "開啟原有收藏功能", status: "本機保存" },
  { eyebrow: "WISH ORDER", title: "我的志願", description: "用挑戰、適中與穩定理解風險，再依正式規則與真實意願整理順序。", href: "/districts?target=analysis", action: "進入原有志願規劃", status: "本機保存" },
  { eyebrow: "CHECKLIST", title: "待辦清單", description: "記錄簡章核對、校園了解、家庭討論與送出前檢查，不讓重要事項只存在記憶裡。", href: "/districts?target=analysis", action: "開啟原有待辦清單", status: "本機保存" },
  { eyebrow: "DATES", title: "重要日期", description: "把已公告的考試與招生日期排入規劃；尚未公告的項目只保留任務，不填入猜測日期。", href: "/news/exam", action: "查看最新時程", status: "持續更新" }
];

export default function PlannerPage() {
  return <HubPage activeHref="/planner" eyebrow="PRIVATE PLANNING" title="把查過的資料，變成自己的下一步。" description={description} cards={cards} closingTitle="還沒有候選校科？先從就學區開始。" closingDescription="確認適用地區後會直接進入你原本已完成的學校查詢，再把候選項目加入規劃。" closingHref="/districts?target=schools" closingAction="選區並開始查校" />;
}
