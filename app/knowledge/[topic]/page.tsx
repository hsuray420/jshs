import type { Metadata } from "next";
import type { SupportPage } from "@/components/independent-support-page";
import { KnowledgeTopicWorkspace, type Topic } from "@/components/knowledge-topic-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const pages: Record<string, SupportPage> = {
  "admission-basics": { eyebrow: "3 分鐘入門", title: "3 分鐘看懂免試入學", description: "用四個問題掌握從就學區、成績到志願的完整順序。", sections: [{ title: "先確認適用區域", body: "就學區會影響規則、日期與可填學校範圍。" }, { title: "再試算與選校", body: "完成成績試算後，再用學校資料與個人條件建立志願。" }], action: { label: "開始成績試算", href: "/tools" } },
  glossary: { eyebrow: "名詞小百科", title: "升學名詞小百科", description: "搜尋超額比序、序位、志願序與群科等常見升學詞彙。", sections: [{ title: "快速理解", body: "先讀一句話定義，再回到規則與官方來源核對實際適用方式。" }, { title: "延伸操作", body: "名詞理解後，可以接著試算成績或查詢校科。" }], action: { label: "前往成績試算", href: "/tools" } },
  misconceptions: { eyebrow: "迷思破解", title: "常見升學迷思破解", description: "把官方規則、歷年參考與推估分開看，避免用單一分數做決定。", sections: [{ title: "歷年分數不是保證", body: "歷年資料只適合做參考，名額、報名人數與規則都可能改變。" }, { title: "推薦不是錄取預測", body: "系統建議用來整理選項，正式結果仍以招生單位公告為準。" }] },
  "alumni-stories": { eyebrow: "經驗整理", title: "過來人經驗談", description: "從學習內容、校園生活與通勤條件整理可借鑑的經驗。", sections: [{ title: "經驗怎麼看", body: "個人心得可以幫助你提出問題，但不代表每位學生都會有相同結果。" }, { title: "搭配資料判斷", body: "請把心得與學校官方課程、招生資料及自己的生活條件一起比較。" }], action: { label: "閱讀學長姐分享", href: "/schools/alumni" } },
  videos: { eyebrow: "短影音系列", title: "升學短影音系列", description: "每次理解一個升學概念，快速建立自己的判斷基礎。", sections: [{ title: "主題索引", body: "從就學區、積分、校科、志願排序到重要日期，依目前問題選擇主題。" }, { title: "看完下一步", body: "影音只負責快速入門，涉及權益的內容請回到官方來源核對。" }], action: { label: "查看官方來源", href: "/trust/sources" } },
  podcast: { eyebrow: "Podcast／語音版", title: "升學 Podcast／語音版", description: "用通勤時間聽懂重要概念，再回到頁面查閱完整資料。", sections: [{ title: "適合聽什麼", body: "制度入門、志願策略與家庭討論適合用語音先掌握重點。" }, { title: "資料核對", body: "語音內容是理解入口，正式日期、名額與資格仍以最新公告為準。" }] },
  "fit-quiz": { eyebrow: "學制探索", title: "學制適合度測驗", description: "用興趣與學習方式探索普通高中、技高與五專的差異。", sections: [{ title: "不替你做決定", body: "測驗只協助整理偏好，不會產生錄取機率或唯一答案。" }, { title: "接著比較", body: "完成自我探索後，回到校科查詢看課程、通勤與未來方向。" }], action: { label: "開始查學校", href: "/schools" } },
  "career-map": { eyebrow: "生涯選擇", title: "未來銜接大學科系地圖", description: "把高中職群科與可能的後續學習方向放在一起理解。", sections: [{ title: "先看學習內容", body: "群科不是職業保證，而是理解課程與技能方向的分類工具。" }, { title: "保留多條路", body: "升學、證照、就業與轉換方向都可能存在，請依個人興趣與實際課程比較。" }], action: { label: "查看群科介紹", href: "/knowledge/groups" } },
  groups: { eyebrow: "群科指南", title: "群科／十五群科介紹", description: "從學習內容、常見課程與未來方向認識技術型高中群科。", sections: [{ title: "群科是什麼", body: "群科用相近的專業學習內容整理科別，幫助你先理解方向再看學校。" }, { title: "選擇時比較", body: "請同時查看實際科別課程、招生名額、通勤與自己的學習偏好。" }], action: { label: "開始查詢校科", href: "/schools" } },
};
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map((topic) => ({ topic })); }
export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> { const { topic } = await params; const page = pages[topic]; return page ? { title: `${page.title}｜升學知識`, description: page.description, alternates: { canonical: `/knowledge/${topic}` } } : {}; }
export default async function KnowledgeTopicPage({ params }: { params: Promise<{ topic: string }> }) { const { topic } = await params; const page = pages[topic]; if (!page) return null; return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/knowledge" /><KnowledgeTopicWorkspace topic={topic as Topic} /><SiteFooter /></main>; }
