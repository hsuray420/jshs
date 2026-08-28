import type { Metadata } from "next";
import { IndependentSupportPage, type SupportPage } from "@/components/independent-support-page";
import { EligibilityTopicWorkspace } from "@/components/eligibility-topic-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const pages: Record<string, SupportPage> = {
  "special-admission": { eyebrow: "特色招生", title: "特色招生／特色班", description: "整理特色招生的準備方向與核對順序。", sections: [{ title: "先確認招生類型", body: "各校特色招生可能包含術科、面試、甄選或校訂條件，名額與時程每年不同。" }, { title: "申請前準備", body: "把專長證明、競賽紀錄、作品或面試準備列成清單，並以當年度學校簡章為準。" }], action: { label: "查看官方資料來源", href: "/trust/sources" } },
  "gifted-special-education": { eyebrow: "特殊資格", title: "資優／特殊教育升學路徑", description: "從鑑定、安置與個別需求開始整理可走的升學路徑。", sections: [{ title: "先找校內承辦人", body: "請與輔導室、特教組或個別化教育計畫團隊確認目前紀錄與適用管道。" }, { title: "準備文件", body: "整理鑑定、安置、學習支持與身分文件，交由正式承辦單位判定。" }] },
  "direct-selection": { eyebrow: "特殊資格", title: "直升與甄選入學說明", description: "比較校內直升與甄選入學的條件、名額與確認方式。", sections: [{ title: "直升", body: "通常涉及校內資格、名額與校內作業，請依就讀國中及招生學校公告確認。" }, { title: "甄選", body: "甄選可能有面試、術科、作品或其他校訂條件，不能只用一般免試分數判斷。" }] },
  "cross-district": { eyebrow: "特殊資格", title: "跨區就學資格判定", description: "先確認居住、就讀、戶籍與特殊就學原因，再比較跨區學校。", sections: [{ title: "需要核對的資料", body: "準備居住地、戶籍、就讀國中與可能的特殊原因資料。" }, { title: "判定原則", body: "跨區資格與文件由招生委員會或學校正式審查，本站僅提供查詢順序。" }], action: { label: "查看資料來源", href: "/trust/sources" } },
  "extra-quota": { eyebrow: "特殊資格", title: "外加名額說明", description: "了解外加名額的適用身分、文件與審查方式。", sections: [{ title: "名額不是自動取得", body: "外加名額仍須符合當年度身分與文件條件，並依招生單位審查。" }, { title: "申請前確認", body: "保留證明文件，向就讀國中承辦人與招生學校確認期限及繳交方式。" }] },
  "non-graduate": { eyebrow: "特殊資格", title: "轉學生／非應屆生規則", description: "整理轉學、重讀、休學與非應屆身分需要先問的問題。", sections: [{ title: "成績認定", body: "不同身分可能有不同的成績、學籍與報名管道認定方式。" }, { title: "正式確認", body: "請向原就讀學校、報名學校或招生委員會確認個案規則。" }] },
  "overseas-student": { eyebrow: "特殊資格", title: "僑生／境外生說明", description: "從身分、學歷與文件驗證開始確認適用管道。", sections: [{ title: "身分與學歷", body: "境外學歷、身分證明與文件驗證可能影響入學管道。" }, { title: "申請方式", body: "請以主管機關、招生學校與當年度正式說明為準，預留文件驗證時間。" }] },
};
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(pages).map((topic) => ({ topic })); }
export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> { const { topic } = await params; const page = pages[topic]; return page ? { title: `${page.title}｜特殊入學與資格`, description: page.description, alternates: { canonical: `/eligibility/${topic}` } } : {}; }
export default async function EligibilityTopicPage({ params }: { params: Promise<{ topic: string }> }) { const { topic } = await params; const page = pages[topic]; if (!page) return null; const interactiveTopic = ["special-admission", "gifted-special-education", "direct-selection"].includes(topic); return <><SiteHeader activeHref="/knowledge" /><DistrictGate><IndependentSupportPage page={page} />{interactiveTopic ? <EligibilityTopicWorkspace topic={topic as "special-admission" | "gifted-special-education" | "direct-selection"} /> : null}</DistrictGate><SiteFooter /></>; }
