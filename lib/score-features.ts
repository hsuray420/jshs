import type { MenuItem } from "./site-map";
import scoreFeatureCatalog from "../content/score-features.json" with { type: "json" };

export type ScoreFeatureArea = "mock" | "admission";

export type ScoreFeature = Readonly<{
  key: string;
  area: ScoreFeatureArea;
  label: string;
  href: string;
  description: string;
  status: "available" | "entry" | "pending-data";
}>;

export type ScoreFeatureAreaRecord = Readonly<{
  key: ScoreFeatureArea;
  label: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
}>;

const catalog = scoreFeatureCatalog as { areas: readonly ScoreFeatureAreaRecord[]; features: readonly ScoreFeature[] };

export const scoreFeatureAreas = Object.freeze([...catalog.areas]);
export const scoreFeatureRegistry = Object.freeze([...catalog.features]);

export function getScoreFeatures(area: ScoreFeatureArea) {
  return scoreFeatureRegistry.filter((feature) => feature.area === area);
}

export function scoreFeaturesToMenuItems(area: ScoreFeatureArea): readonly MenuItem[] {
  return getScoreFeatures(area).map(({ label, href, description }) => ({ label, href, description }));
}
