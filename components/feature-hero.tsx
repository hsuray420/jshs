import type { ReactNode } from "react";
import type { FeatureThemeName } from "@/lib/feature-themes";
import { featureThemes } from "@/lib/feature-themes";
import { FeatureIllustration, type FeatureIllustrationName } from "@/components/feature-illustrations";
import { PageContainer } from "@/components/ui/layout";

type HeroProps = { title: string; eyebrow: string; description: string; theme: FeatureThemeName; illustration: FeatureIllustrationName; actions?: ReactNode; status?: ReactNode; sourceInfo?: ReactNode };

function Hero({ compact = false, title, eyebrow, description, theme, illustration, actions, status, sourceInfo }: HeroProps & { compact?: boolean }) {
  const tokens = featureThemes[theme];
  return <PageContainer as="section" className={`jshs-feature-hero is-${theme}${compact ? " is-compact" : ""}`} style={{ "--feature-primary": tokens.primary, "--feature-primary-hover": tokens.primaryHover, "--feature-surface": tokens.surface, "--feature-surface-strong": tokens.surfaceStrong, "--feature-border": tokens.border, "--feature-text": tokens.text, "--feature-accent": tokens.illustrationAccent } as React.CSSProperties}>
    <div className="jshs-feature-hero-copy"><p className="jshs-feature-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="jshs-feature-description">{description}</p>{status || sourceInfo || actions ? <div className="jshs-feature-hero-meta">{status}{sourceInfo}{actions}</div> : null}</div>
    <FeatureIllustration name={illustration} theme={theme} />
  </PageContainer>;
}

export function FeatureHero(props: HeroProps) { return <Hero {...props} />; }
export function CompactFeatureHero(props: HeroProps) { return <Hero {...props} compact />; }
