export type ImageConfidence = "very_high" | "high" | "medium" | "low";

export type SchoolImageRecord = Readonly<{
  schoolCode: string;
  schoolName: string;
  status: "resolved" | "unresolved" | "review";
  image?: Readonly<{ thumbnail: string; medium: string; original: string; localPath?: string }>;
  source: "jshs-verified" | "openstreetmap" | "wikidata" | "wikimedia-commons" | "wikipedia" | "placeholder";
  sourceEntity?: Readonly<{ osm?: string; wikidata?: string; commons?: string; wikipedia?: string }>;
  attribution?: Readonly<{ author?: string; license: string; licenseUrl?: string; sourceUrl: string }>;
  confidence: ImageConfidence;
  identity?: Readonly<{ address: string; latitude: number; longitude: number }>;
  resolvedAt: string;
  expiresAt: string;
}>;

export const confidenceRank: Record<ImageConfidence, number> = { low: 0, medium: 1, high: 2, very_high: 3 };

export function isDisplayableSchoolImage(record: SchoolImageRecord | undefined, expected: { code: string; name: string; address: string; latitude?: number; longitude?: number }): boolean {
  if (!record || record.status !== "resolved" || confidenceRank[record.confidence] < confidenceRank.medium || record.schoolCode !== expected.code || !record.image?.thumbnail || !record.attribution?.license || !record.attribution.sourceUrl) return false;
  if (record.identity && expected.latitude !== undefined && expected.longitude !== undefined && Math.hypot(record.identity.latitude - expected.latitude, record.identity.longitude - expected.longitude) > 0.01) return false;
  return true;
}
