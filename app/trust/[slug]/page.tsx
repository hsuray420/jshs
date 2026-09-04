import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LEGAL_DOCUMENTS } from "@/lib/legal-documents";
import { DataReportForm } from "@/components/data-report-form";
import districtMetadata from "../../../public/it_hs/district-metadata.json";
import { capabilityRows, dataChangeLog, sourceRegistry } from "@/lib/trust-registry";
import { capabilityStatusLabel } from "@/lib/source-registry";

const pages = {
  sources: { title: "資料來源", eyebrow: "SOURCES", description: "查看每筆升學資料的年度、來源、狀態與最近一次整理時間。" },
  status: { title: "資料更新狀態", eyebrow: "DATA STATUS", description: "查看服務年度、來源年度、最後更新與 116 校核狀態。" },
  progress: { title: "15 區建置進度", eyebrow: "BUILD PROGRESS", description: "公開顯示各就學區規則建模與試算開放狀態。" },
  methodology: { title: "試算與分析方法", eyebrow: "METHODOLOGY", description: "說明規則資料如何供試算、互動說明、推薦與推估使用。" },
  versions: { title: "資料版本紀錄", eyebrow: "DATA VERSIONS", description: "查看資料發布、規則校核與版本變更脈絡。" },
  report: { title: "錯誤回報", eyebrow: "REPORT DATA", description: "提供可核對的資訊，協助修正學校、科別、名額、規則、日期或功能問題。" },
  credibility: { title: "平台可信度說明", eyebrow: "PLATFORM CREDIBILITY", description: "了解 JSHS 的角色、資料校核方式、官方與非官方界線，以及更正機制。" },
  privacy: { title: "隱私權政策", eyebrow: "PRIVACY POLICY", description: "說明本站如何處理、保存與保護使用者資料及瀏覽器本機資料。" },
  terms: { title: "服務條款", eyebrow: "TERMS OF SERVICE", description: "說明使用本站服務時的權利、責任與重要限制。" },
  about: { title: "關於 JSHS", eyebrow: "ABOUT JSHS", description: "了解本站定位、資料來源、維護方式與和官方招生單位的界線。" },
  sponsor: { title: "贊助與編輯獨立", eyebrow: "SPONSOR POLICY", description: "公開支持方式、經費用途與不影響資料判斷的原則。" },
  updates: { title: "資料更新紀錄", eyebrow: "JSHS UPDATES", description: "查看資料、規則與產品維護的實際更新紀錄。" },
} as const;

const legacyRedirects = {
  feedback: "/trust/report",
  community: "/trust/credibility",
  voting: "/trust/credibility",
  stories: "/schools/alumni",
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
  if (slug === "privacy") return <LegalDocument content={LEGAL_DOCUMENTS.privacy} />;
  if (slug === "terms") return <LegalDocument content={LEGAL_DOCUMENTS.terms} />;
  if (slug === "about") return <AboutContent />;
  if (slug === "sponsor") return <SponsorContent />;
  if (slug === "updates") return <UpdatesContent />;
  return <CredibilityContent />;
}

function LegalDocument({ content }: { content: string }) { return <article className="whitespace-pre-wrap break-words text-sm leading-8 text-slate-700">{content}</article>; }

function SourceContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">這是目前實際被功能使用的資料來源清冊；每筆皆有來源 ID、擷取／核對時間與資料狀態。狀態會顯示可用範圍，而不是把缺資料的功能寫成已完成。</p><div className="mt-5 overflow-x-auto"><table><thead><tr><th>資料集</th><th>區域／年度</th><th>來源單位</th><th>狀態</th><th>擷取／核對</th><th>來源</th></tr></thead><tbody>{sourceRegistry.map((source) => <tr key={source.id}><th>{source.dataset}</th><td>{source.district} · {source.schoolYear || "不適用"}</td><td>{source.issuer}</td><td>{capabilityStatusLabel(source.status)}</td><td>{source.retrievedAt} / {source.verifiedAt || "待核對"}</td><td><a href={source.sourceUrl} className="font-bold underline">查看</a></td></tr>)}</tbody></table></div></>; }
function StatusContent() { return <div className="grid gap-3 sm:grid-cols-2"><Metric label="服務年度" value="116" /><Metric label="規則來源年度" value="115" /><Metric label="最後資料更新" value={districtMetadata.updatedAt} /><Metric label="116 校核狀態" value="正式規則待公告" /><p className="sm:col-span-2 text-sm leading-7 text-slate-600">116 學年度服務不會把 115 官方資料改名冒充；在 116 正式簡章公告前，依規則計算的結果都會保留來源年度與待校核狀態。</p></div>; }
function ProgressContent() { const columns = ["admissionRules", "schoolDirectory", "admissionHistory", "schedule", "map", "planner"] as const; const labels = ["積分規則", "學校資料", "歷史資料", "升學日程", "地圖", "志願功能"]; return <><p className="text-sm leading-7 text-slate-600">15 個就學區逐列顯示目前可驗證能力，不以功能頁存在與否推定完成。滑過狀態可查看來源限制。</p><div className="mt-5 overflow-x-auto"><table><thead><tr><th>就學區</th>{labels.map((label) => <th key={label}>{label}</th>)}<th>來源年度</th><th>最後核對</th></tr></thead><tbody>{capabilityRows.map((row) => <tr key={row.district}><th>{row.label}</th>{columns.map((column) => <td key={column} title={row.reasons[column]}>{capabilityStatusLabel(row[column])}</td>)}<td>{row.sourceYear}</td><td>{row.lastVerifiedAt}</td></tr>)}</tbody></table></div></>; }
function MethodologyContent() { return <div className="grid gap-4 text-sm leading-7 text-slate-600"><section><h2>積分試算</h2><p>輸入：使用者填寫的事實欄位與就學區規則。輸出：總積分、項目拆解與同分比序說明；不產生官方序位或錄取判定。</p></section><section><h2>推薦與落點</h2><p>模型版本：無。資料集版本：無。由於缺少可比較年度、可驗證來源、完整校科資料、confidence 方法與 validation result，本站目前不提供落點預測或錄取傾向。</p></section><section><h2>資料限制</h2><p>社群歷史資料不參與預測；OSRM 僅提供道路路線估算，不含即時交通或大眾運輸。OSRM 無法取得時，頁面只顯示直線距離，不顯示分鐘數。</p></section></div>; }
function VersionContent() { return <div><h2>資料異動紀錄</h2><p className="mt-2 text-sm leading-7 text-slate-600">以下只記錄實際發生的資料或行為變更；不補寫不存在的歷史事件。</p><div className="mt-5 overflow-x-auto"><table><thead><tr><th>日期</th><th>版本</th><th>資料集</th><th>受影響地區</th><th>修改內容</th><th>原因／來源</th></tr></thead><tbody>{dataChangeLog.map((event) => <tr key={event.version}><td>{event.date}</td><th>{event.version}</th><td>{event.dataset}</td><td>{event.districts}</td><td>{event.change}</td><td>{event.reason} · {event.source}</td></tr>)}</tbody></table></div></div>; }
function ReportContent() { return <><p className="max-w-3xl text-sm leading-7 text-slate-600">如果資料、規則、日期、來源或功能有問題，請提供目前內容與建議修正。回報會先進入待確認，核對後才標記已接受、已修正或不採用。</p><DataReportForm initialPageUrl="/trust/report" /><div className="mt-5 flex flex-wrap gap-3"><a className="px-4 py-3 text-sm jshs-button-secondary" href="https://forms.gle/qd6GuS1EFXkzjppz7" target="_blank" rel="noreferrer">填寫錯誤回報表單（舊版）↗</a><Link className="px-4 py-3 text-sm jshs-button-secondary" href="/schools">回到找學校</Link></div></>; }
function CredibilityContent() { return <div className="grid gap-5 text-sm leading-7 text-slate-600"><p>JSHS 是升學資料整理與決策輔助平台，不取代教育主管機關、招生委員會、學校或正式志願選填平台的公告與資格認定。</p><p>「官方」只表示官方單位直接公布；「依官方資料計算」表示規則來自官方但結果由 JSHS 計算；「JSHS 整理」、「JSHS 推估」與「社群資料」會用不同標籤清楚區分。</p><div className="rounded-2xl bg-[var(--jshs-muted-surface)] p-5"><h2 className="text-xl text-[var(--jshs-primary)]">我們相信四件事</h2><ul className="mt-3 grid gap-2"><li>看得懂：把制度講成人話。</li><li>查得到：重要資料附上來源和年度。</li><li>算得清楚：結果可以回看怎麼算。</li><li>自己決定：工具協助判斷，不替你選學校。</li></ul></div><p>發現錯誤時，平台會保留資料版本、來源與校核時間，依可核對的官方資料進行更正；推估結果不代表當年度錄取門檻或錄取保證。</p></div>; }
function AboutContent() { return <div className="grid gap-5 text-sm leading-7 text-slate-600"><p className="text-lg font-bold text-[var(--jshs-primary)]">讓每一個升學選擇，都有資料可以理解、有來源可以確認。</p><p>JSHS.CC 是獨立的升學資訊整理平台，服務學生、家長與老師。本站不是教育部、各招生委員會、任何學校或補習班的官方網站，也不代表上述單位做出資格或錄取判定。</p><section><h2>資料哪裡來？</h2><p>招生規則、簡章、日期與正式平台會優先連回官方來源；學校目錄、生活資料與工具結果則標示 JSHS 整理、計算、推估或社群資料，並保留資料年度與最後確認時間。</p></section><section><h2>誰維護？</h2><p>平台維護者負責整理來源、修正錯誤、更新功能與公開更新紀錄。若你發現問題，請使用資料回報，讓每筆修正都有可追溯的處理入口。</p></section><section><h2>我們不收什麼？</h2><p>能不收的資料就不收。查詢與試算主要可匿名完成；請不要在備註、回報或分享中填寫身分證字號、完整地址、電話或其他不必要的敏感資料。</p></section></div>; }
function SponsorContent() { return <div className="grid gap-5 text-sm leading-7 text-slate-600"><p>JSHS 可以接受支持，用於維持伺服器、網域、資料維護、AI API 與其他必要維運；支持不會購買排序、推薦或內容結論。</p><section><h2>編輯獨立原則</h2><ul className="grid gap-2"><li>贊助不影響學校排序、落點說明、志願推薦、升學資訊內容與資料呈現。</li><li>若未來出現 sponsored content，會在內容旁清楚標示。</li><li>官方資料與 JSHS 整理、推估、社群資料不會因贊助關係混用。</li><li>若有可公開的合作或支持資訊，會在更新紀錄與支持頁說明。</li></ul></section><section><h2>經費用途</h2><p>優先用於伺服器與網域、來源整理與資料校核、功能維護、無障礙與手機體驗、AI 服務及必要的安全與備份成本。</p></section><Link href="/support" className="inline-flex w-fit px-4 py-3 jshs-button-primary">查看支持方式 →</Link></div>; }
function UpdatesContent() { return <div><p className="max-w-3xl text-sm leading-7 text-slate-600">這裡只記錄已經發生、可以回查的資料或產品變更，不用一段模糊文字假裝網站持續更新。</p><div className="mt-5 grid gap-3">{dataChangeLog.map((event) => <article key={event.version} className="rounded-2xl bg-[var(--jshs-muted-surface)] p-5"><p className="text-xs font-black text-[var(--jshs-primary)]">{event.date} · {event.version}</p><h2 className="mt-2 text-lg">{event.change}</h2><p className="mt-2 text-sm leading-6 text-slate-600">影響範圍：{event.districts}。資料集：{event.dataset}。原因：{event.reason}。</p></article>)}</div></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[var(--jshs-muted-surface)] p-5"><span className="block text-xs font-black text-slate-500">{label}</span><strong className="mt-2 block text-2xl text-[var(--jshs-primary)]">{value}</strong></div>; }
