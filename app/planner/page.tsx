import type { Metadata } from "next";
import { PlannerWorkspace } from "@/components/planner-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAdmissionHistoryRecord } from "@/lib/admission-history";
import { getMemberSession } from "@/lib/member-auth";
import { schoolDirectory } from "@/lib/school-directory";

const title = "我的升學規劃｜收藏、志願與待辦";
const description = "整理收藏校科、志願結構、待辦清單與重要日期；個人規劃需要 LINE 會員登入，內容不建立公開搜尋頁面。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/planner" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  const member = await getMemberSession();
  const plannerSchools = schoolDirectory.map((school) => ({
    history: getAdmissionHistoryRecord(school.districtCode, school.code),
    district: school.districtCode,
    code: school.code,
    name: school.name,
    program: school.program,
    department: school.departmentsRaw,
    courseDirection: school.courseDirection,
    commuteInfo: school.commuteInfo,
    quota: school.quota,
    referenceScore: getAdmissionHistoryRecord(school.districtCode, school.code)?.referenceScore || "",
    dataStatus: school.dataStatus,
    academicYear: school.academicYear,
  }));
  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref="/planner" />
      <DistrictGate initialDistrict={params.district}>
        <PlannerWorkspace schools={plannerSchools} isMember={Boolean(member)} />
      </DistrictGate>
      <SiteFooter />
    </main>
  );
}
