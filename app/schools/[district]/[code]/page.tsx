import { notFound, permanentRedirect } from "next/navigation";
import { getSchoolByCode } from "@/lib/school-repository";
export default async function LegacySchoolDetail({ params }: { params: Promise<{ district: string; code: string }> }) { const s = getSchoolByCode((await params).code); if (!s) notFound(); permanentRedirect(`/schools/${s.code}`); }
