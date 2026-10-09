import type { Metadata } from "next";
import { AdmissionCalculator } from "@/components/admission-calculator";
import { DistrictGate } from "@/components/district-gate";
import { FeatureHero } from "@/components/feature-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isAdmissionDistrict, type AdmissionDistrict } from "@/lib/admission-score";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = {
  title: "模擬考分數試算｜全國國中升學資訊網",
  description: "以正式會考相同的就學區規則，試算模擬考成績並查看可核對的結果。",
  alternates: { canonical: "/scores/mock/calculator" },
};

export default async function MockScoreCalculatorPage({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  const initialDistrict: AdmissionDistrict | undefined = params.district && isAdmissionDistrict(params.district) ? params.district : undefined;
  return <main className="min-h-screen jshs-page-shell jshs-feature-score">
    <SiteHeader activeHref="/scores/mock" />
    <FeatureHero theme="mock-exam" eyebrow="模擬考" title="模擬考分數試算" description="規則與正式會考相同；請先選擇就學區，再輸入模擬考成績。" illustration="score-calculator" />
    <DistrictGate initialDistrict={params.district}>
      <AdmissionCalculator initialDistrict={initialDistrict} isMember={Boolean(await getMemberSession())} />
    </DistrictGate>
    <SiteFooter />
  </main>;
}
