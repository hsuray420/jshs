import type { Metadata } from "next";
import { EligibilityChecker } from "@/components/eligibility-checker";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "特殊資格｜升學資格自我檢測與路徑說明", description: "先用自我檢測找到可能適用的特殊升學資格，再回到官方規則確認報名條件與文件。", alternates: { canonical: "/eligibility" } };

const sections = [
  ["特色招生", "特色招生／特色班", "依學校、專長或特色課程訂定甄選方式，可能包含術科、面試、競賽或其他校訂條件；招生方式與名額每年不同。"],
  ["資優與特教", "資優／特殊教育升學路徑", "請先確認個別化教育計畫、鑑定與安置紀錄，再與學校輔導或特教承辦人一起核對適用的升學安排。"],
  ["直升與甄選", "直升與甄選入學說明", "直升通常涉及校內資格與名額；甄選則依各校或各類型招生簡章辦理，不能只用一般免試入學分數判斷。"],
  ["跨區", "跨區就學資格判定", "居住地、就讀國中、戶籍與特殊就學原因可能影響適用區域。先確認資格再比較學校，避免把不適用的志願放進清單。"],
  ["外加名額", "外加名額說明", "外加名額的身分、比例、文件與審查方式依年度規定，看到可能符合時請保留證明並回到正式簡章。"],
  ["非應屆", "轉學生／非應屆生規則", "轉學、重讀、休學或非應屆身分可能有不同報名管道與成績認定，應向原就讀或報名學校確認。"],
  ["境外生", "僑生／境外生說明", "境外學歷、身分與文件驗證可能影響入學管道；請從主管機關與學校的正式說明開始。"],
] as const;

export default function EligibilityPage() {
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/eligibility" /><section className="jshs-hero-section"><div className="mx-auto w-[min(1160px,calc(100%-32px))] py-12 md:py-16"><p className="jshs-eyebrow">特殊資格中心</p><h1 className="mt-3 max-w-4xl">先找到可能適用的路，再確認正式資格。</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">特殊身分不是「多一個勾選就一定有名額」。這裡先幫你整理問題與查詢順序，再把判斷交回當年度招生單位。</p></div></section><EligibilityChecker /><section className="mx-auto w-[min(1160px,calc(100%-32px))] pb-12"><div className="grid gap-4 md:grid-cols-2">{sections.map(([id, title, body]) => <article id={id} key={id} className="scroll-mt-24 p-6 jshs-surface-card"><p className="jshs-eyebrow">{id}</p><h2 className="mt-2 text-xl">{title}</h2><p className="mt-3 text-sm leading-7 jshs-muted-copy">{body}</p><a href="/trust#sources" className="mt-4 inline-block text-sm font-black text-[var(--jshs-primary)]">查看資料來源與更新紀錄 →</a></article>)}</div><p className="mt-6 text-sm leading-7 jshs-muted-copy">頁面內容是查詢導覽與準備清單，不是個案法律或資格意見；申請前請以當年度簡章、招生委員會與學校承辦回覆為準。</p></section><SiteFooter /></main>;
}
