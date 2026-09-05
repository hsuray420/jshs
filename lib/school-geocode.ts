import cache from "@/content/schools/school-geocode-cache.json";

export type SchoolCoordinate = Readonly<{
  schoolCode: string;
  schoolName?: string;
  latitude: number;
  longitude: number;
  originalAddress?: string;
  normalizedAddress: string;
  provider?: string;
  source: string;
  sourceType?: string;
  matchedAddress?: string;
  matchedPlaceName?: string;
  cityMatch?: boolean;
  districtMatch?: boolean;
  addressMatch?: boolean;
  verificationStatus?: "verified";
  verifiedAt: string;
}>;

/** Only independently verified, address-matched records may enter the public map. */
export function getSchoolCoordinate(code: string, address: string): SchoolCoordinate | null {
  const record = (cache as Readonly<Record<string, SchoolCoordinate>>)[code];
  const normalizeAddress = (value: string) => value.normalize("NFKC").replace(/^\[?\d{3,6}\]?\s*/, "").replace(/\s+/g, "").replaceAll("台", "臺").replaceAll("恒", "恆").replace(/[一壹]段/g, "1段").replace(/[二貳]段/g, "2段").replace(/[三參]段/g, "3段").replace(/[四肆]段/g, "4段").replace(/[五伍]段/g, "5段").replace(/[六陸]段/g, "6段").replace(/[七柒]段/g, "7段").replace(/[八捌]段/g, "8段").replace(/[九玖]段/g, "9段").replace(/[十拾]段/g, "10段").replace(/(\d+)之(\d+)/g, "$1-$2").replace(/(\d+)號之(\d+)/g, "$1-$2號").replace(/(\d+)樓/g, "$1F").replace(/\d+鄰/g, "").replace(/[号]/g, "號");
  const expectedAddress = normalizeAddress(address);
  const recordAddress = normalizeAddress(record?.normalizedAddress || "");
  if (!record || record.schoolCode !== code || record.verificationStatus !== "verified" || recordAddress !== expectedAddress || !record.source || !(record.provider || record.sourceType) || !Number.isFinite(Date.parse(record.verifiedAt))) return null;
  if (!Number.isFinite(record.latitude) || Math.abs(record.latitude) > 90 || !Number.isFinite(record.longitude) || Math.abs(record.longitude) > 180) return null;
  try { if (!['https:', 'http:'].includes(new URL(record.source).protocol)) return null; } catch { return null; }
  return record;
}
