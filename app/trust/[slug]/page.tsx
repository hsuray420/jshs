import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import districtMetadata from "../../../public/it_hs/district-metadata.json";
import guideCatalog from "../../../data/admission-guides.json";

const pages = {
  sources: { title: "資料來源", eyebrow: "SOURCES", description: "查看每筆升學資料的年度、來源、狀態與最近一次整理時間。" },
  status: { title: "資料更新狀態", eyebrow: "DATA STATUS", description: "查看服務年度、來源年度、最後更新與 116 校核狀態。" },
  progress: { title: "15 區建置進度", eyebrow: "BUILD PROGRESS", description: "公開顯示各就學區規則建模與試算開放狀態。" },
  methodology: { title: "試算與分析方法", eyebrow: "METHODOLOGY", description: "說明規則資料如何供試算、互動說明、推薦與推估使用。" },
  versions: { title: "資料版本紀錄", eyebrow: "DATA VERSIONS", description: "查看資料發布、規則校核與版本變更脈絡。" },
  report: { title: "錯誤回報", eyebrow: "REPORT DATA", description: "提供可核對的資訊，協助修正學校、科別、名額、規則、日期或功能問題。" },
  credibility: { title: "平台可信度說明", eyebrow: "PLATFORM CREDIBILITY", description: "了解 JSHS 的角色、資料校核方式、官方與非官方界線，以及更正機制。" },
} as const;

const legacyRedirects = {
  feedback: "/trust/report",
  community: "/trust/credibility",
  voting: "/trust/credibility",
  stories: "/schools/alumni",
  privacy: "/trust/credibility",
  terms: "/trust/credibility",
  support: "/trust/report",
} as const;

type TrustSlug = keyof typeof pages;
type TrustPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return [...Object.keys(pages), ...Object.keys(legacyRedirects)].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: TrustPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug as TrustSlug];
  if (!page) return { robots: { index: false, follow: false } };
  return { title: `${page.title}｜資料與信任`, description: page.description, alternates: { canonical: `/trust/${slug}` } };
}

export default async function TrustDetailPage({ params }: TrustPageProps) {
  const { slug } = await params;
  const legacyHref = legacyRedirects[slug as keyof typeof legacyRedirects];
  if (legacyHref) redirect(legacyHref);
  const page = pages[slug as TrustSlug];
  if (!page) notFound();

  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/trust" /><header className="jshs-hero-section"><div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10 md:py-14"><nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"><Link href="/">首頁</Link><span aria-hidden="true">/</span><Link href="/trust">資料與信任</Link><span aria-hidden="true">/</span><span className="text-[var(--jshs-primary)]">{page.title}</span></nav><p className="mt-8 jshs-eyebrow">{page.eyebrow}</p><h1 className="mt-3 max-w-4xl">{page.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 jshs-muted-copy">{page.description}</p></div></header><section className="mx-auto w-[min(1120px,calc(100%-32px))] py-10"><div className="p-6 md:p-8 jshs-surface-card">{renderContent(slug as TrustSlug)}</div><Link href="/trust" className="mt-6 inline-flex px-4 py-3 text-sm jshs-button-secondary">← 返回資料與信任</Link></section><SiteFooter /></main>;
}

function renderContent(slug: TrustSlug): ReactNode {
  if (slug === "sources") return <SourceContent />;
  if (slug === "status") return <StatusContent />;
  if (slug === "progress") return <ProgressContent />;
  if (slug === "methodology") return <MethodologyContent />;
  if (slug === "versions") return <VersionContent />;
  if (slug === "report") return <ReportContent />;
  return <CredibilityContent />;
}

function SourceContent() { const districts = Object.entries(districtMetadata.districts); return <><p className="max-w-3xl text-sm leading-7 text-slate-600">學校資料來自各區公開招生資料與校方官方來源；規則與日期以招生委員會、教育部與會考官方網站為優先。每筆資料會標示年度、狀態、來源與更新日。</p><div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--jshs-brand-tint)] p-5"><div><p className="jshs-eyebrow">115 學年度原始文件</p><h2 className="mt-1 text-xl">15 區免試入學官方簡章</h2><p className="mt-2 text-sm leading-6 text-[var(--jshs-primary)]">重要時程、資格、特殊身分與應備文件的原始依據；成績計算另使用獨立規則資料。</p></div><Link href="/admission-guides" className="shrink-0 px-4 py-3 text-sm jshs-button-primary">查看與下載簡章 →</Link></div><div className="mt-5 grid gap-3 md:grid-cols-3">{districts.map(([code, district]) => { const guide = guideCatalog.guides.find((item) => item.code === code); return <div key={code} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-4"><div className="flex items-center justify-between gap-2"><strong>{district.label}</strong><span className="jshs-data-tag is-reference">{district.dataStatus === "ready" ? "已整理" : "參考"}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{district.academicYear} 學年度 · 更新 {district.updatedAt}</p><div className="mt-3 flex flex-wrap gap-3 text-sm"><a className="text-[var(--jshs-primary)]" href={guide?.file || district.sourceUrl} target="_blank" rel="noreferrer">官方簡章 ↗</a><a className="text-[var(--jshs-primary)]" href={district.sourceUrl} target="_blank" rel="noreferrer">官方來源 ↗</a></div></div>; })}</div><p className="mt-5 text-xs leading-6 jshs-muted-copy">全站資料版本：{districtMetadata.version}；資料總更新日：{districtMetadata.updatedAt}。{districtMetadata.disclaimer}</p></>; }
function StatusContent() { return <div className="grid gap-3 sm:grid-cols-2"><Metric label="服務年度" value="116" /><Metric label="規則來源年度" value="115" /><Metric label="最後資料更新" value={districtMetadata.updatedAt} /><Metric label="116 校核狀態" value="正式規則待公告" /><p className="sm:col-span-2 text-sm leading-7 text-slate-600">116 學年度服務不會把 115 官方資料改名冒充；在 116 正式簡章公告前，依規則計算的結果都會保留來源年度與待校核狀態。</p></div>; }
function ProgressContent() { const districts = ["基北", "中投", "宜蘭", "桃連", "竹苗", "彰化", "雲林", "嘉義", "臺南", "高雄", "屏東", "花蓮", "臺東", "澎湖", "金門"]; return <><div className="rounded-2xl bg-emerald-50 p-5"><h2 className="text-lg">15 個就學區皆已開放</h2><p className="mt-2 text-sm leading-7">{districts.join("、")}</p></div><p className="mt-5 text-sm leading-7 text-slate-600">各區均可使用試算、填志願與志願健檢；正式年度資料仍以各區招生委員會公告為準。</p></>; }
function MethodologyContent() { return <div className="grid gap-4 text-sm leading-7 text-slate-600"><p>規則資料經過核對後，提供給試算引擎、互動規則表、欄位提示與同分比序說明。</p><p>學校與官方文件屬官方或 JSHS 整理；試算結果屬依官方資料計算；推薦、落點與風險分層屬 JSHS 推估；學長姐分享屬社群資料。</p><p>推薦不使用保證語言，且會保留資料缺漏、年度差異與官方公告變動的限制。</p></div>; }
function VersionContent() { return <div className="grid gap-3"><Metric label="目前服務版本" value={districtMetadata.version} /><Metric label="資料更新日" value={districtMetadata.updatedAt} /><p className="text-sm leading-7 text-slate-600">版本變更會記錄資料發布、JSHS 規則校核與來源更新。116 正式簡章公告後，會重新校核受影響區域並更新版本。</p></div>; }
function ReportContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">回報時請附上當前頁 URL、功能名稱、資料版本、學年度、學校代碼、欄位名稱、目前顯示內容、應修正內容與可核對的官方連結。</p><div className="mt-5 flex flex-wrap gap-3"><a className="px-4 py-3 text-sm jshs-button-primary" href="https://forms.gle/qd6GuS1EFXkzjppz7" target="_blank" rel="noreferrer">填寫錯誤回報表單 ↗</a><Link className="px-4 py-3 text-sm jshs-button-secondary" href="/schools">回到找學校</Link></div></>; }
function CredibilityContent() { return <div className="grid gap-4 text-sm leading-7 text-slate-600"><p>JSHS 是升學資料整理與決策輔助平台，不取代教育主管機關、招生委員會、學校或正式志願選填平台的公告與資格認定。</p><p>「官方」只表示官方單位直接公布；「依官方資料計算」表示規則來自官方但結果由 JSHS 計算；「JSHS 整理」、「JSHS 推估」與「社群資料」會用不同標籤清楚區分。</p><p>發現錯誤時，平台會保留資料版本、來源與校核時間，依可核對的官方資料進行更正；推估結果不代表當年度錄取門檻或錄取保證。</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[var(--jshs-muted-surface)] p-5"><span className="block text-xs font-black text-slate-500">{label}</span><strong className="mt-2 block text-2xl text-[var(--jshs-primary)]">{value}</strong></div>; }
