import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CommunityVoting } from "@/components/community-voting";
import { getMemberSession } from "../../../lib/member-auth";
import districtMetadata from "../../../public/it_hs/district-metadata.json";
import guideCatalog from "../../../data/admission-guides.json";
import privacyText from "../../../content/trust/privacy.txt?raw";
import supportText from "../../../content/trust/support.txt?raw";
import termsText from "../../../content/trust/terms.txt?raw";

const pages = {
  sources: { title: "資料來源與更新紀錄", eyebrow: "SOURCES & UPDATES", description: "查看每筆升學資料的年度、來源、狀態與最近一次整理時間。" },
  status: { title: "資料更新狀態", eyebrow: "DATA STATUS", description: "查看服務年度、來源年度、最後更新與 116 校核狀態。" },
  progress: { title: "15 區建置進度", eyebrow: "BUILD PROGRESS", description: "公開顯示各就學區規則建模與試算開放狀態。" },
  methodology: { title: "試算與分析方法", eyebrow: "METHODOLOGY", description: "說明規則資料如何供試算、互動說明、推薦與推估使用。" },
  versions: { title: "資料版本紀錄", eyebrow: "DATA VERSIONS", description: "查看資料發布、規則校核與版本變更脈絡。" },
  feedback: { title: "評分與回饋", eyebrow: "RATING & FEEDBACK", description: "分享使用體驗與建議，協助我們持續改善查詢與規劃流程。" },
  community: { title: "使用人數展示", eyebrow: "COMMUNITY", description: "了解平台目前整理的就學區與校科服務範圍。" },
  report: { title: "資料錯誤回報", eyebrow: "REPORT DATA", description: "提供可核對的資訊，協助修正學校、科別、名額或來源內容。" },
  voting: { title: "社群投票互動", eyebrow: "COMMUNITY VOTING", description: "參與公開議題與經驗整理，投票結果會標示資料狀態與用途。" },
  stories: { title: "在校生真實心得", eyebrow: "STUDENT STORIES", description: "閱讀匿名整理的學習經驗，將個人感受與官方規則分開看。" },
  privacy: { title: "隱私權", eyebrow: "PRIVACY", description: "了解個人資料、瀏覽器暫存與規劃分享的處理方式。" },
  terms: { title: "服務條款", eyebrow: "TERMS OF SERVICE", description: "了解資料使用範圍、官方資訊優先原則與使用者責任。" },
  support: { title: "支持／合作", eyebrow: "SUPPORT & PARTNERSHIPS", description: "提供資料校核、教育合作建議或服務問題的聯絡入口。" },
} as const;

type TrustSlug = keyof typeof pages;
type TrustPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: TrustPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug as TrustSlug];
  if (!page) return {};
  return { title: `${page.title}｜信任與支援中心`, description: page.description, alternates: { canonical: `/trust/${slug}` } };
}

export default async function TrustDetailPage({ params }: TrustPageProps) {
  const { slug } = await params;
  const page = pages[slug as TrustSlug];
  if (!page) notFound();

  const member = await getMemberSession();
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/trust" /><header className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"><Link href="/">首頁</Link><span aria-hidden="true">/</span><Link href="/trust">信任與支援中心</Link><span aria-hidden="true">/</span><span className="text-[var(--jshs-primary)]">{page.title}</span></nav><p className="mt-8 jshs-eyebrow">{page.eyebrow}</p><h1 className="mt-3 max-w-4xl">{page.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">{page.description}</p></div></header><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><div className="p-6 md:p-8 jshs-surface-card">{slug === "voting" ? <><VotingContent /><CommunityVoting isMember={Boolean(member)} /></> : renderContent(slug as TrustSlug)}</div><Link href="/trust" className="mt-6 inline-flex px-4 py-3 text-sm jshs-button-secondary">← 返回信任與支援中心</Link></section><SiteFooter /></main>;
}

function renderContent(slug: TrustSlug): ReactNode {
  if (slug === "sources") return <SourceContent />;
  if (slug === "status") return <StatusContent />;
  if (slug === "progress") return <ProgressContent />;
  if (slug === "methodology") return <MethodologyContent />;
  if (slug === "versions") return <VersionContent />;
  if (slug === "feedback") return <FeedbackContent />;
  if (slug === "community") return <CommunityContent />;
  if (slug === "report") return <ReportContent />;
  if (slug === "voting") return <VotingContent />;
  if (slug === "stories") return <StoriesContent />;
  if (slug === "privacy") return <PolicyContent title="資料如何被處理" text={privacyText} />;
  if (slug === "terms") return <PolicyContent title="使用規範" text={termsText} />;
  return <PolicyContent title="合作與服務" text={supportText}><div className="mt-5 flex flex-wrap gap-3"><a className="px-4 py-3 text-sm jshs-button-primary" href="mailto:hello@jshs.cc">聯絡合作／回報</a><Link className="px-4 py-3 text-sm jshs-button-secondary" href="/news/parents">先看家庭討論指南</Link></div></PolicyContent>;
}

function SourceContent() { const districts = Object.entries(districtMetadata.districts); return <><p className="max-w-3xl text-sm leading-7 text-slate-600">學校資料來自各區公開招生資料與校方官方來源；規則與日期以招生委員會、教育部與會考官方網站為優先。每筆資料會標示年度、狀態、來源與更新日。</p><div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--jshs-brand-tint)] p-5"><div><p className="jshs-eyebrow">115 學年度原始文件</p><h2 className="mt-1 text-xl">15 區免試入學官方簡章</h2><p className="mt-2 text-sm leading-6 text-[var(--jshs-primary)]">重要時程、資格、特殊身分與應備文件的原始依據；成績計算另使用獨立規則資料。</p></div><Link href="/admission-guides" className="shrink-0 px-4 py-3 text-sm jshs-button-primary">查看與下載簡章 →</Link></div><div className="mt-5 grid gap-3 md:grid-cols-3">{districts.map(([code, district]) => { const guide = guideCatalog.guides.find((item) => item.code === code); return <div key={code} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-center justify-between gap-2"><strong>{district.label}</strong><span className="jshs-data-tag is-reference">{district.dataStatus === "ready" ? "已校核" : "參考"}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{district.academicYear} 學年度 · 更新 {district.updatedAt}</p><div className="mt-3 flex flex-wrap gap-3 text-sm"><a className="text-[var(--jshs-primary)]" href={guide?.file || district.sourceUrl} target="_blank" rel="noreferrer">官方簡章 ↗</a><a className="text-[var(--jshs-primary)]" href={district.sourceUrl} target="_blank" rel="noreferrer">官方來源 ↗</a></div></div>; })}</div><p className="mt-5 text-xs leading-6 jshs-muted-copy">全站版本：{districtMetadata.version}；資料總更新日：{districtMetadata.updatedAt}。{districtMetadata.disclaimer}</p></>; }
function StatusContent() { return <div className="grid gap-3 sm:grid-cols-2"><Metric label="服務年度" value="116" /><Metric label="規則來源年度" value="115" /><Metric label="最後資料更新" value={districtMetadata.updatedAt} /><Metric label="116 校核狀態" value="正式規則待公告" /><p className="sm:col-span-2 text-sm leading-7 text-slate-600">116 學年度服務不會把 115 官方資料改名冒充；在 116 正式簡章公告前，依規則計算的結果都會保留來源年度與待校核狀態。</p></div>; }
function ProgressContent() { const ready = ["基北", "中投", "宜蘭", "桃連", "竹苗", "彰化", "雲林", "高雄"]; const pending = ["嘉義", "臺南", "屏東", "花蓮", "臺東", "澎湖", "金門"]; return <><div className="grid gap-3 sm:grid-cols-2"><article className="rounded-2xl bg-emerald-50 p-5"><h2 className="text-lg">已開放 8／15</h2><p className="mt-2 text-sm leading-7">{ready.join("、")}</p></article><article className="rounded-2xl bg-amber-50 p-5"><h2 className="text-lg">尚未開放 7／15</h2><p className="mt-2 text-sm leading-7">{pending.join("、")}</p></article></div><p className="mt-5 text-sm leading-7 text-slate-600">尚未完成規則建模的區域不提供假試算器；仍可查詢已提供的官方資料與學校資訊。</p></>; }
function MethodologyContent() { return <div className="grid gap-4 text-sm leading-7 text-slate-600"><p>研究 JSON／MD 是規則資料來源，透過 adapter 提供給試算引擎、互動規則表、欄位提示與同分比序說明。</p><p>學校與官方文件屬官方或 JSHS 整理；試算結果屬依官方資料計算；推薦、落點與風險分層屬 JSHS 推估；學長姐分享屬社群資料。</p><p>推薦不使用保證語言，且會保留資料缺漏、年度差異與官方公告變動的限制。</p></div>; }
function VersionContent() { return <div className="grid gap-3"><Metric label="目前服務版本" value={districtMetadata.version} /><Metric label="資料更新日" value={districtMetadata.updatedAt} /><p className="text-sm leading-7 text-slate-600">版本變更會記錄資料發布、JSHS 規則校核與來源更新。116 正式簡章公告後，會重新校核受影響區域並更新版本。</p></div>; }
function FeedbackContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">你的回饋會協助我們判斷查詢流程是否清楚、資料欄位是否有用，以及哪些功能需要優先改善。回饋內容會先由平台整理，不會自動公開個人資訊。</p><a className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary" href="mailto:hello@jshs.cc?subject=全國校科查詢使用回饋">寄送使用回饋</a></>; }
function CommunityContent() { const districtCount = Object.keys(districtMetadata.districts).length; return <><div className="grid gap-4 sm:grid-cols-3"><Metric label="就學區" value={`${districtCount} 個`} /><Metric label="資料範圍" value="全國校科" /><Metric label="資料版本" value={districtMetadata.version} /></div><p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">這些數字代表目前平台整理與開放查詢的範圍，不代表使用者人數、錄取機率或官方統計；年度資料會依來源更新。</p></>; }
function ReportContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">回報時請附上學校代碼、欄位名稱、目前顯示內容、應修正內容與可核對的官方連結。涉及個人資格或特殊身分時，請直接詢問就讀國中承辦人。</p><div className="mt-5 flex flex-wrap gap-3"><a className="px-4 py-3 text-sm jshs-button-primary" href="https://forms.gle/qd6GuS1EFXkzjppz7" target="_blank" rel="noreferrer">填寫錯誤回報表單 ↗</a><Link className="px-4 py-3 text-sm jshs-button-secondary" href="/schools">回到找校科</Link></div></>; }
function VotingContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">社群投票只反映會員意見，不代表招生規則或官方統計。每個議題每個 LINE 帳號只能投一次，結果會以票數呈現。</p>{/* Topics are managed through the database; an empty state is shown until one is published. */}</>; }
function StoriesContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">在校生心得會以匿名、經整理的方式呈現，讓讀者了解課程、校園與通勤的真實感受。心得屬於個人經驗，不能取代學校公告、招生簡章或正式資格判定。</p><Link className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary" href="/schools?view=alumni">閱讀學長姐分享 →</Link></>; }
function PolicyContent({ title, text, children }: { title: string; text: string; children?: ReactNode }) { return <><p className="jshs-eyebrow">TRUST & SUPPORT</p><h2 className="mt-2">{title}</h2><div className="mt-4 max-w-3xl text-sm leading-7 text-slate-950">{text.split(/\n\s*\n/).map((paragraph) => <p key={paragraph} className="mt-3 first:mt-0">{paragraph}</p>)}{children}</div></>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[var(--jshs-muted-surface)] p-5"><span className="block text-xs font-black text-slate-500">{label}</span><strong className="mt-2 block text-2xl text-[var(--jshs-primary)]">{value}</strong></div>; }
