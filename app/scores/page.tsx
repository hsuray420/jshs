import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { ScoreFeatureEntry, ScoreFeatureList } from "@/components/score-feature-entry";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "成績分析｜全國國中生升學資訊網",
  description: "從模擬考到會考積分，集中查看你的成績與升學位置。",
  alternates: { canonical: "/scores" },
};

export default function ScoresPage() {
  return (
    <main className="min-h-screen jshs-page-shell jshs-feature-score">
      <SiteHeader activeHref="/scores" />
      <FeatureHero theme="tools" eyebrow="成績分析" title="從模擬考到會考積分，集中整理。" description="模考紀錄、成績趨勢、落點參考與 15 就學區免試積分放在同一個入口；沒有來源的資料不會被推估成結果。" illustration="score-calculator" status={<><span>模考入口</span><span>15 區積分</span><span>來源優先</span></>} />
      <ScoreFeatureEntry />
      <ScoreFeatureList />
      <SiteFooter />
    </main>
  );
}
