import type { ReactNode } from "react";
import type { FeatureThemeName } from "@/lib/feature-themes";
import { featureThemes } from "@/lib/feature-themes";
import { FeatureIllustration, type FeatureIllustrationName } from "@/components/feature-illustrations";
import { PageContainer } from "@/components/ui/layout";

export function FeatureHero({ title, eyebrow, description, theme, illustration, actions, status, sourceInfo }: { title: string; eyebrow: string; description: string; theme: FeatureThemeName; illustration: FeatureIllustrationName; actions?: ReactNode; status?: ReactNode; sourceInfo?: ReactNode }) {
  const tokens = featureThemes[theme];
  return <PageContainer as="section" className={`jshs-feature-hero is-${theme}`} style={{ "--feature-primary": tokens.primary, "--feature-primary-hover": tokens.primaryHover, "--feature-surface": tokens.surface, "--feature-surface-strong": tokens.surfaceStrong, "--feature-border": tokens.border, "--feature-text": tokens.text, "--feature-accent": tokens.illustrationAccent } as React.CSSProperties}>
    <div className="jshs-feature-hero-copy"><p className="jshs-feature-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="jshs-feature-description">{description}</p>{status || sourceInfo || actions ? <div className="jshs-feature-hero-meta">{status}{sourceInfo}{actions}</div> : null}</div>
    <FeatureIllustration name={illustration} theme={theme} />
  </PageContainer>;
}
