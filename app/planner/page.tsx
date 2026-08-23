import type { Metadata } from "next";
import { PlannerWorkspace } from "@/components/planner-workspace";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { schoolDirectory } from "@/lib/school-directory";

const title = "我的升學規劃｜收藏、志願與待辦";
const description = "整理收藏校科、志願結構、待辦清單與重要日期；個人規劃保存在使用中的瀏覽器，不建立公開搜尋頁面。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/planner" },
  robots: { index: false, follow: false },
};

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  const plannerSchools = schoolDirectory.map((school) => ({
    district: school.districtCode,
    code: school.code,
    name: school.name,
    program: school.program,
    department: school.departmentsRaw,
    courseDirection: school.courseDirection,
    commuteInfo: school.commuteInfo,
    quota: school.quota,
    referenceScore: school.referenceScore,
    dataStatus: school.dataStatus,
    academicYear: school.academicYear,
  }));
  return (
    <main className="min-h-screen jshs-page-shell">
      <SiteHeader activeHref="/planner" />
      <DistrictGate initialDistrict={params.district}>
        <PlannerWorkspace schools={plannerSchools} />
      </DistrictGate>
      <SiteFooter />
    </main>
  );
}
