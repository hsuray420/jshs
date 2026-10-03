import type { Metadata } from "next";
import { FeatureHero } from "@/components/feature-hero";
import { MockExamWorkspace } from "@/components/mock-exam-workspace";
import { MockScoreEmptyState } from "@/components/mock-score-empty-state";
import { ScoreFeatureList } from "@/components/score-feature-entry";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = {
  title: "模擬考中心｜全國國中升學資訊網",
  description: "建立、保存與分析自己的模擬考紀錄。",
  alternates: { canonical: "/scores/mock" },
};

export default async function MockScoresPage() {
  const isMember = Boolean(await getMemberSession());
  return (
    <main className="min-h-screen jshs-page-shell jshs-feature-mock-exam">
      <SiteHeader activeHref="/scores/mock" />
      <FeatureHero theme="mock-exam" eyebrow="模擬考" title="模擬考中心" description="建立、編輯與保存模擬考成績，再查看科目趨勢；本站不捏造答案、排名或錄取預測。" illustration="score-history" />
      <MockScoreEmptyState />
      <MockExamWorkspace isMember={isMember} />
      <ScoreFeatureList area="mock" />
      <SiteFooter />
    </main>
  );
}
