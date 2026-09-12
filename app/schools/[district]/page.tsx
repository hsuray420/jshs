import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchoolByCode, getSchools } from "@/lib/school-repository";
import { SchoolDetail, schoolPageMetadata } from "@/components/school-detail";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRegionById } from "@/lib/region-registry";
export function generateStaticParams() { return getSchools().map(s => ({ district: s.code })); }
export async function generateMetadata({ params }: { params: Promise<{ district: string }> }) {
  const value = (await params).district;
  const region = getRegionById(value);
  if (region) return { title: `${region.name}學校資料尚未開放｜全國國中升學資訊網` };
  const s = getSchoolByCode(value);
  return s ? schoolPageMetadata(s) : {};
}
export default async function SchoolCodePage({ params }: { params: Promise<{ district: string }> }) {
  const value = (await params).district;
  const region = getRegionById(value);
  if (region?.schoolDataStatus === "unavailable") {
    return <main className="min-h-screen jshs-page-shell"><SiteHeader activeHref="/schools" /><section className="mx-auto w-[min(880px,calc(100%-32px))] py-16"><p className="jshs-eyebrow">找學校 · 尚未開放</p><h1 className="mt-3 text-4xl font-black">{region.name}目前尚未開放</h1><p className="mt-4 text-base leading-8 jshs-muted-copy">我們正在依正式簡章整理此區資料。完成並通過資料驗證後，才會開放學校查詢、正式招生資料分析與相關找校功能。</p><div className="mt-6 flex flex-wrap gap-3"><Link className="jshs-button-primary px-4 py-3" href="/schools">查看已開放學校資料</Link><Link className="jshs-button-secondary px-4 py-3" href={`/tools?district=${region.id}`}>前往積分試算</Link></div></section><SiteFooter /></main>;
  }
  const s = getSchoolByCode(value);
  if (!s) notFound();
  return <SchoolDetail school={s} />;
}
