import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { MockScoreEmptyState } from "@/components/mock-score-empty-state";
import { ScoreFeatureList } from "@/components/score-feature-entry";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "模擬考中心｜成績分析｜全國國中生升學資訊網",
  description: "集中查看模擬考入口、資料狀態與下一步。",
  alternates: { canonical: "/scores/mock" },
};

export default function MockScoresPage() {
  return (
    <main className="min-h-screen jshs-page-shell jshs-feature-score">
      <SiteHeader activeHref="/scores/mock" />
      <FeatureHero theme="tools" eyebrow="成績分析 · 模擬考" title="模擬考中心" description="對答案、我的模考、成績趨勢與落點參考會集中在這裡；目前只顯示已建立的入口與資料狀態。" illustration="score-history" />
      <MockScoreEmptyState />
      <ScoreFeatureList area="mock" />
      <SiteFooter />
    </main>
  );
}
