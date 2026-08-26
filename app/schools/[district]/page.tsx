import type { Metadata } from "next";
import { AdmissionHistoryExplorer } from "@/components/admission-history-explorer";
import { CommuteComparison } from "@/components/commute-comparison";
import { SchoolAlumniExplorer } from "@/components/school-alumni-explorer";
import { SchoolCostPlanner } from "@/components/school-cost-planner";
import { SchoolMapExplorer } from "@/components/school-map-explorer";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { schoolDistrictOptions } from "@/lib/school-directory";

const tools = {
  history: ["歷年錄取成績查詢", "查看官方與非官方整理的歷年校科成績。"],
  alumni: ["學長姐分享", "閱讀非官方的最低錄取經驗與學校觀察。"],
  map: ["學校地圖", "依縣市與地址查看學校位置。"],
  cost: ["費用試算", "估算三年就學支出，協助家庭比較生活負擔。"],
  commute: ["通勤比較", "並排比較不同學校的通勤時間與負擔。"],
} as const;
type Tool = keyof typeof tools;
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(tools).map((district) => ({ district })); }
export async function generateMetadata({ params }: { params: Promise<{ district: string }> }): Promise<Metadata> { const { district } = await params; const page = tools[district as Tool]; return page ? { title: `${page[0]}｜查學校`, description: page[1], alternates: { canonical: `/schools/${district}` } } : {}; }
export default async function SchoolToolPage({ params, searchParams }: { params: Promise<{ district: string }>; searchParams: Promise<{ district?: string; schoolCode?: string }> }) {
  const { district: tool } = await params; const query = await searchParams; const page = tools[tool as Tool]; if (!page) return null;
  const content = tool === "history" ? <AdmissionHistoryExplorer districtOptions={schoolDistrictOptions} initialDistrict={query.district} /> : tool === "alumni" ? <SchoolAlumniExplorer districtOptions={schoolDistrictOptions} initialDistrict={query.district} initialSchoolCode={query.schoolCode} /> : tool === "map" ? <SchoolMapExplorer districtOptions={schoolDistrictOptions} initialDistrict={query.district} /> : tool === "cost" ? <SchoolCostPlanner /> : <CommuteComparison districtOptions={schoolDistrictOptions} initialDistrict={query.district} />;
  return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><DistrictGate initialDistrict={query.district}><section className="jshs-hero-section"><div className="mx-auto w-[min(1160px,calc(100%-32px))] py-10"><p className="jshs-eyebrow">查學校 · 獨立工具</p><h1 className="mt-3">{page[0]}</h1><p className="mt-3 max-w-3xl text-base leading-7 jshs-muted-copy">{page[1]}</p></div></section>{content}</DistrictGate><SiteFooter /></main>;
}
