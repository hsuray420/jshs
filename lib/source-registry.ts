import registryData from "@/data/source-registry.json";

export type CapabilityStatus = "VERIFIED" | "AVAILABLE" | "PARTIAL" | "PENDING" | "UNAVAILABLE";
export type RegistrySourceType = "official_original" | "jshs_curated" | "community";
export type SourceRegistryRecord = Readonly<{
  id: string;
  dataset: string;
  district: string;
  schoolYear: string;
  issuer: string;
  sourceUrl: string;
  sourceDocumentPath?: string;
  sourceType: RegistrySourceType;
  ingestionMode: "MANUAL" | "MANUAL_VERIFIED" | "AUTOMATED";
  status: CapabilityStatus;
  retrievedAt: string;
  lastCheckedAt: string;
  verifiedAt: string;
  snapshot: Readonly<{ contentHash: string; contentType: string; byteSize: number }> | null;
}>;

export const sourceRegistry: readonly SourceRegistryRecord[] = Object.freeze(registryData.sources as unknown as readonly SourceRegistryRecord[]);
export function getSource(sourceId: string): SourceRegistryRecord | undefined { return sourceRegistry.find((source) => source.id === sourceId); }
