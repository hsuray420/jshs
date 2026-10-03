import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { ScoreFeatureEntry, ScoreFeatureList } from "@/components/score-feature-entry";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "成績分析｜全國國中升學資訊網",
  description: "集中查看會考與免試積分、規則、摘要與資格條件。",
  alternates: { canonical: "/scores" },
};

export default function ScoresPage() {
  return (
    <main className="min-h-screen jshs-page-shell jshs-feature-score">
      <SiteHeader activeHref="/scores" />
      <FeatureHero theme="analytics" eyebrow="成績分析" title="把會考與免試規則整理清楚。" description="查看已驗證就學區的會考與積分試算；其他區域資料驗證中，完成驗證後才開放使用。" illustration="score-calculator" status={<><span>會考積分</span><span>7 區開放試算</span><span>8 區資料驗證中</span></>} />
      <ScoreFeatureEntry />
      <ScoreFeatureList area="admission" />
      <SiteFooter />
    </main>
  );
}
