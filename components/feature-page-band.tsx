type FeatureTone = "school" | "score" | "planner" | "guide";

const featureLabels: Record<FeatureTone, string> = {
  school: "找學校",
  score: "算成績",
  planner: "我的志願",
  guide: "升學指南",
};

export function FeaturePageBand({ tone }: { tone: FeatureTone }) {
  return <div className={`jshs-feature-page-band is-${tone}`} aria-label={`${featureLabels[tone]}功能區`}><div className="jshs-container"><span>{featureLabels[tone]}</span></div></div>;
}
