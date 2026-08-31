import type { Metadata } from "next";
import { AdmissionCalculator } from "@/components/admission-calculator";
import { DistrictGate } from "@/components/district-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureHero } from "@/components/feature-hero";
import { isAdmissionDistrict, type AdmissionDistrict } from "@/lib/admission-score";
import { getMemberSession } from "@/lib/member-auth";

const title = "算成績｜116 學年度積分試算";
const description = "依就學區規則完成 116 學年度積分試算，查看同分比序資料並把結果帶到我的志願。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tools" },
  openGraph: { type: "website", locale: "zh_TW", url: "/tools", siteName: "全國國中升學資訊網", title, description },
};

export default async function ToolsPage({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const params = await searchParams;
  const initialDistrict: AdmissionDistrict | undefined = params.district && isAdmissionDistrict(params.district) ? params.district : undefined;
  return (
    <main className="min-h-screen jshs-page-shell jshs-feature-score">
      <SiteHeader activeHref="/tools" />
      <FeatureHero theme="tools" eyebrow="免試入學積分" title="算成績，掌握下一步" description="依就學區規則完成積分試算，查看同分比序資料，再把可信結果帶進志願規劃。" illustration="score-calculator" status={<><span>15 區試算</span><span>官方規則優先</span><span>保留規則年度</span></>} />
      <DistrictGate initialDistrict={params.district}>
        <AdmissionCalculator initialDistrict={initialDistrict} isMember={Boolean(await getMemberSession())} />
      </DistrictGate>
      <SiteFooter />
    </main>
  );
}
