import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import districtMetadata from "../../../public/it_hs/district-metadata.json";
import privacyText from "../../../content/trust/privacy.txt?raw";
import supportText from "../../../content/trust/support.txt?raw";
import termsText from "../../../content/trust/terms.txt?raw";

const pages = {
  sources: { title: "資料來源與更新紀錄", eyebrow: "SOURCES & UPDATES", description: "查看每筆升學資料的年度、來源、狀態與最近一次整理時間。" },
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

  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/trust" /><header className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"><Link href="/">首頁</Link><span aria-hidden="true">/</span><Link href="/trust">信任與支援中心</Link><span aria-hidden="true">/</span><span className="text-[var(--jshs-primary)]">{page.title}</span></nav><p className="mt-8 jshs-eyebrow">{page.eyebrow}</p><h1 className="mt-3 max-w-4xl">{page.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">{page.description}</p></div></header><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><div className="p-6 md:p-8 jshs-surface-card">{renderContent(slug as TrustSlug)}</div><Link href="/trust" className="mt-6 inline-flex px-4 py-3 text-sm jshs-button-secondary">← 返回信任與支援中心</Link></section><SiteFooter /></main>;
}

function renderContent(slug: TrustSlug): ReactNode {
  if (slug === "sources") return <SourceContent />;
  if (slug === "feedback") return <FeedbackContent />;
  if (slug === "community") return <CommunityContent />;
  if (slug === "report") return <ReportContent />;
  if (slug === "voting") return <VotingContent />;
  if (slug === "stories") return <StoriesContent />;
  if (slug === "privacy") return <PolicyContent title="資料如何被處理" text={privacyText} />;
  if (slug === "terms") return <PolicyContent title="使用規範" text={termsText} />;
  return <PolicyContent title="合作與服務" text={supportText}><div className="mt-5 flex flex-wrap gap-3"><a className="px-4 py-3 text-sm jshs-button-primary" href="mailto:hello@jshs.cc">聯絡合作／回報</a><Link className="px-4 py-3 text-sm jshs-button-secondary" href="/news/parents">先看家庭討論指南</Link></div></PolicyContent>;
}

function SourceContent() { const districts = Object.entries(districtMetadata.districts); return <><p className="max-w-3xl text-sm leading-7 text-slate-600">學校資料來自各區公開招生資料與校方官方來源；規則與日期以招生委員會、教育部與會考官方網站為優先。每筆資料會標示年度、狀態、來源與更新日。</p><div className="mt-5 grid gap-3 md:grid-cols-3">{districts.map(([code, district]) => <div key={code} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-center justify-between gap-2"><strong>{district.label}</strong><span className="jshs-data-tag is-reference">{district.dataStatus === "ready" ? "已校核" : "參考"}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{district.academicYear} 學年度 · 更新 {district.updatedAt}</p><a className="mt-3 block text-sm text-[var(--jshs-primary)]" href={district.sourceUrl} target="_blank" rel="noreferrer">官方來源 ↗</a></div>)}</div><p className="mt-5 text-xs leading-6 jshs-muted-copy">全站版本：{districtMetadata.version}；資料總更新日：{districtMetadata.updatedAt}。{districtMetadata.disclaimer}</p></>; }
function FeedbackContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">你的回饋會協助我們判斷查詢流程是否清楚、資料欄位是否有用，以及哪些功能需要優先改善。回饋內容會先由平台整理，不會自動公開個人資訊。</p><a className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary" href="mailto:hello@jshs.cc?subject=全國校科查詢使用回饋">寄送使用回饋</a></>; }
function CommunityContent() { const districtCount = Object.keys(districtMetadata.districts).length; return <><div className="grid gap-4 sm:grid-cols-3"><Metric label="就學區" value={`${districtCount} 個`} /><Metric label="資料範圍" value="全國校科" /><Metric label="資料版本" value={districtMetadata.version} /></div><p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">這些數字代表目前平台整理與開放查詢的範圍，不代表使用者人數、錄取機率或官方統計；年度資料會依來源更新。</p></>; }
function ReportContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">回報時請附上學校代碼、欄位名稱、目前顯示內容、應修正內容與可核對的官方連結。涉及個人資格或特殊身分時，請直接詢問就讀國中承辦人。</p><div className="mt-5 flex flex-wrap gap-3"><a className="px-4 py-3 text-sm jshs-button-primary" href="https://forms.gle/qd6GuS1EFXkzjppz7" target="_blank" rel="noreferrer">填寫錯誤回報表單 ↗</a><Link className="px-4 py-3 text-sm jshs-button-secondary" href="/schools">回到找校科</Link></div></>; }
function VotingContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">社群投票入口正在整理中。正式開放前，我們會先定義題目來源、投票期間、重複投票限制與結果呈現方式，避免把未經核對的意見誤當成招生規則。</p><Link className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-secondary" href="/trust/feedback">先提供議題建議 →</Link></>; }
function StoriesContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">在校生心得會以匿名、經整理的方式呈現，讓讀者了解課程、校園與通勤的真實感受。心得屬於個人經驗，不能取代學校公告、招生簡章或正式資格判定。</p><Link className="mt-5 inline-flex px-4 py-3 text-sm jshs-button-primary" href="/schools?view=alumni">閱讀學長姐分享 →</Link></>; }
function PolicyContent({ title, text, children }: { title: string; text: string; children?: ReactNode }) { return <><p className="jshs-eyebrow">TRUST & SUPPORT</p><h2 className="mt-2">{title}</h2><div className="mt-4 max-w-3xl text-sm leading-7 text-slate-950">{text.split(/\n\s*\n/).map((paragraph) => <p key={paragraph} className="mt-3 first:mt-0">{paragraph}</p>)}{children}</div></>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[var(--jshs-muted-surface)] p-5"><span className="block text-xs font-black text-slate-500">{label}</span><strong className="mt-2 block text-2xl text-[var(--jshs-primary)]">{value}</strong></div>; }
