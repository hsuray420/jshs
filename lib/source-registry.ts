import registryData from "@/data/source-registry.json";

export type CapabilityStatus = "VERIFIED" | "AVAILABLE" | "PARTIAL" | "PENDING" | "UNAVAILABLE";
export const CAPABILITY_STATUS_LABELS: Readonly<Record<CapabilityStatus, string>> = Object.freeze({ VERIFIED: "官方確認", AVAILABLE: "可使用", PARTIAL: "部分資料", PENDING: "尚待確認", UNAVAILABLE: "目前沒有資料" });
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
export function capabilityStatusLabel(status: CapabilityStatus): string { return CAPABILITY_STATUS_LABELS[status]; }
