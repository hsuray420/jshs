import Link from "next/link";
import { PageContainer } from "@/components/ui/layout";
import { scoreFeatureAreas, getScoreFeatures, type ScoreFeatureArea } from "@/lib/score-features";

export function ScoreFeatureEntry() {
  return (
    <section className="jshs-score-entry" aria-labelledby="score-entry-title">
      <div className="jshs-score-entry-heading">
        <p className="jshs-eyebrow">成績分析</p>
        <h2 id="score-entry-title">現在想先處理哪件事？</h2>
        <p>從模擬考到會考積分，用同一個成績分析入口整理。</p>
      </div>
      <div className="jshs-score-entry-grid">
        {scoreFeatureAreas.map((area) => <ScoreAreaCard key={area.key} areaKey={area.key} />)}
      </div>
    </section>
  );
}

function ScoreAreaCard({ areaKey }: { areaKey: ScoreFeatureArea }) {
  const area = scoreFeatureAreas.find((item) => item.key === areaKey);
  if (!area) return null;
  const features = getScoreFeatures(areaKey);
  return (
    <article className={`jshs-score-entry-card is-${area.key}`}>
      <p className="jshs-score-entry-label">{area.label}</p>
      <h3>{area.title}</h3>
      <p>{area.description}</p>
      <Link href={area.primaryHref} className="jshs-button-primary px-5">{area.primaryLabel}</Link>
      <div aria-label={`${area.label}快速捷徑`} className="jshs-score-entry-shortcuts">
        {features.slice(area.key === "mock" ? 1 : 1, area.key === "mock" ? 4 : 3).map((feature) => (
          <Link key={feature.key} href={feature.href}>{feature.label}</Link>
        ))}
      </div>
    </article>
  );
}

export function ScoreFeatureList({ area }: { area?: ScoreFeatureArea }) {
  const features = area ? getScoreFeatures(area) : scoreFeatureAreas.flatMap((item) => getScoreFeatures(item.key));
  return (
    <PageContainer as="section" className="jshs-feature-workspace">
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <Link key={feature.key} href={feature.href} className="p-5 jshs-surface-card">
            <strong>{feature.label}</strong>
            <p className="mt-2 text-sm leading-6 jshs-muted-copy">{feature.description}</p>
            <small className="mt-4 inline-flex text-xs font-bold text-[var(--jshs-primary)]">
              {feature.status === "available" ? "可使用" : feature.status === "pending-data" ? "等待可驗證資料" : "入口已建立"}
            </small>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
