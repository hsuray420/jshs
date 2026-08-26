export type RecommendationSchool = Readonly<{
  code: string;
  name: string;
  referenceScore: string;
  district?: string;
  department?: string;
}>;

export type PlannerRecommendations = Readonly<{
  challenge: RecommendationSchool[];
  stable: RecommendationSchool[];
  safe: RecommendationSchool[];
}>;

export function buildPlannerRecommendations(schools: readonly RecommendationSchool[], score: number): PlannerRecommendations {
  const usable = schools
    .map((school) => ({ school, reference: Number.parseFloat(school.referenceScore) }))
    .filter(({ reference }) => Number.isFinite(reference));
  const unique = usable.filter(({ school }, index) => usable.findIndex((item) => item.school.code === school.code) === index);
  const challenge = unique.filter(({ reference }) => reference > score).sort((a, b) => a.reference - b.reference).slice(0, 8).map(({ school }) => school);
  const stable = unique.filter(({ reference }) => reference <= score).sort((a, b) => score - a.reference - (score - b.reference)).slice(0, 8).map(({ school }) => school);
  const used = new Set([...challenge, ...stable].map((school) => school.code));
  const safe = unique
    .filter(({ school }) => !used.has(school.code))
    .sort((a, b) => a.reference - b.reference)
    .slice(0, 8)
    .map(({ school }) => school);
  return { challenge, stable, safe };
}
