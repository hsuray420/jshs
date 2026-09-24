import Link from "next/link";
import { notFound } from "next/navigation";
import { SchoolDetailClient } from "@/components/school-detail-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRegionById } from "@/lib/region-registry";
import { getSchoolSearchEntryByCode, getSchoolSearchIndex } from "@/lib/school-search-index";
export function generateStaticParams() { return getSchoolSearchIndex().map(s => ({ district: s.code })); }
export async function generateMetadata({ params }: { params: Promise<{ district: string }> }) {
  const value = (await params).district;
  const region = getRegionById(value);
  if (region) return { title: `${region.name}學校資料尚未開放｜全國國中生升學資訊網` };
  const s = getSchoolSearchEntryByCode(value);
  return s ? { title: `${s.name}｜招生科別、交通、住宿與課程｜全國國中生升學資訊網`, description: `${s.name}位於${s.city}${s.area}，${s.ownership}${s.schoolType}、${s.gender}。查看115學年度招生科別、課程方向、交通與住宿公開資訊及資料來源。`, alternates: { canonical: `/schools/${s.code}` } } : {};
}
export default async function SchoolCodePage({ params }: { params: Promise<{ district: string }> }) {
  const value = (await params).district;
  const region = getRegionById(value);
  if (region?.schoolDataStatus === "unavailable") {
    return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><section className="mx-auto w-[min(880px,calc(100%-32px))] py-16"><p className="jshs-eyebrow">找學校 · 尚未開放</p><h1 className="mt-3 text-4xl font-black">{region.name}目前尚未開放</h1><p className="mt-4 text-base leading-8 jshs-muted-copy">我們正在依正式簡章整理此區資料。完成並通過資料驗證後，才會開放學校查詢、正式招生資料分析與相關找校功能。</p><div className="mt-6 flex flex-wrap gap-3"><Link className="jshs-button-primary px-4 py-3" href="/schools">查看已開放學校資料</Link><Link className="jshs-button-secondary px-4 py-3" href={`/tools?district=${region.id}`}>前往積分試算</Link></div></section><SiteFooter /></main>;
  }
  const s = getSchoolSearchEntryByCode(value);
  if (!s) notFound();
  return <main className="jshs-page-shell jshs-feature-school"><SiteHeader activeHref="/schools" /><div className="sv-root"><SchoolDetailClient code={s.code} /></div><SiteFooter /></main>;
}
