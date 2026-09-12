import { notFound, permanentRedirect } from "next/navigation";
import { getSchoolSearchEntryByCode } from "@/lib/school-search-index";
export default async function LegacySchoolDetail({ params }: { params: Promise<{ district: string; code: string }> }) { const s = getSchoolSearchEntryByCode((await params).code); if (!s) notFound(); permanentRedirect(`/schools/${s.code}`); }
