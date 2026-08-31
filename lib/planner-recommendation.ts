export type RecommendationSchool = Readonly<{
  code: string;
  name: string;
  referenceScore: string;
  district?: string;
  department?: string;
  city?: string;
  program?: string;
  ownership?: string;
  groups?: readonly string[];
  area?: string;
  academicYear?: string;
  dataStatus?: string;
  hasQuota?: boolean;
  hasHistoricalData?: boolean;
  sourceName?: string;
  updatedAt?: string;
}>;
