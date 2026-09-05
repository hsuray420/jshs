import { notFound } from "next/navigation";
import { getSchoolByCode, getSchools } from "@/lib/school-repository";
import { SchoolDetail, schoolPageMetadata } from "@/components/school-detail";
export function generateStaticParams() { return getSchools().map(s => ({ district: s.code })); }
export async function generateMetadata({ params }: { params: Promise<{ district: string }> }) { const s = getSchoolByCode((await params).district); return s ? schoolPageMetadata(s) : {}; }
export default async function SchoolCodePage({ params }: { params: Promise<{ district: string }> }) { const s = getSchoolByCode((await params).district); if (!s) notFound(); return <SchoolDetail school={s} />; }
