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
      <FeatureHero theme="analytics" eyebrow="成績分析" title="把會考與免試規則整理清楚。" description="集中查看 15 個就學區的積分試算、規則、摘要與資格條件；沒有來源的資料不會被推估成結果。" illustration="score-calculator" status={<><span>會考積分</span><span>15 區試算</span><span>來源優先</span></>} />
      <ScoreFeatureEntry />
      <ScoreFeatureList area="admission" />
      <SiteFooter />
    </main>
  );
}
