import { createHash } from "node:crypto";

export const capabilityStatuses = Object.freeze(["VERIFIED", "AVAILABLE", "PARTIAL", "PENDING", "UNAVAILABLE"]);
const officialHistoryTypes = new Set(["official", "school_official", "committee_official"]);
const officialMetrics = new Set(["official_minimum_score", "official_admission_result", "official_rank"]);

export function hashSourceContent(content) {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

function validateDate(value) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validationResult(fatalIssues, warnings = []) {
  return Object.freeze({ fatalIssues: Object.freeze(fatalIssues), warnings: Object.freeze(warnings) });
}

export function validateSourceRegistry(records, previousRecords = [], districtCodes = []) {
  const fatalIssues = [];
  const warnings = [];
  const knownDistricts = new Set(districtCodes);
  const ids = new Set();
  const previousById = new Map(previousRecords.map((record) => [record.id, record]));
  for (const record of records) {
    if (!record.id || ids.has(record.id)) fatalIssues.push(`DUPLICATE_SOURCE_ID:${record.id || "missing"}`);
    ids.add(record.id);
    if (record.district !== "all" && !knownDistricts.has(record.district)) fatalIssues.push(`UNKNOWN_DISTRICT:${record.id}:${record.district}`);
    if (!capabilityStatuses.includes(record.status)) fatalIssues.push(`INVALID_SOURCE_STATUS:${record.id}`);
    if (!record.dataset || !record.issuer || !record.sourceUrl) fatalIssues.push(`INCOMPLETE_SOURCE:${record.id}`);
    if (!validateDate(record.retrievedAt) || !validateDate(record.lastCheckedAt) || !validateDate(record.verifiedAt)) fatalIssues.push(`INVALID_SOURCE_DATE:${record.id}`);
    const previous = previousById.get(record.id);
    if (previous?.snapshot?.contentHash && record.snapshot?.contentHash && previous.snapshot.contentHash !== record.snapshot.contentHash) warnings.push(`SOURCE_HASH_CHANGED:${record.id}`);
  }
  return validationResult(fatalIssues, warnings);
}

export function validateOfficialInformationRecords(records, registry, districtCodes) {
  const fatalIssues = [];
  const registryById = new Map(registry.map((source) => [source.id, source]));
  const knownDistricts = new Set(districtCodes);
  const ids = new Set();
  for (const record of records) {
    if (!record.id || ids.has(record.id)) fatalIssues.push(`DUPLICATE_OFFICIAL_INFORMATION_ID:${record.id || "missing"}`);
    ids.add(record.id);
    if (!knownDistricts.has(record.district)) fatalIssues.push(`UNKNOWN_DISTRICT:${record.id}:${record.district}`);
    const source = registryById.get(record.sourceId);
    if (!source) fatalIssues.push(`MISSING_SOURCE:${record.id}:${record.sourceId || "missing"}`);
    if (record.sourceType === "official_original" && (!record.sourceUrl || !source)) fatalIssues.push(`OFFICIAL_SOURCE_REQUIRED:${record.id}`);
    if (record.schoolYear !== record.dataSchoolYear && record.yearStatus !== "previous_year_reference") fatalIssues.push(`YEAR_MASQUERADE:${record.id}:${record.dataSchoolYear}->${record.schoolYear}`);
    if (record.yearStatus === "previous_year_reference" && record.schoolYear === record.dataSchoolYear) fatalIssues.push(`INVALID_PREVIOUS_YEAR_REFERENCE:${record.id}`);
    if (!validateDate(record.publishDate) || !validateDate(record.updatedAt)) fatalIssues.push(`INVALID_OFFICIAL_INFORMATION_DATE:${record.id}`);
  }
  return validationResult(fatalIssues);
}

export function validateAdmissionHistoryRecords(records, registry, schoolKeys) {
  const fatalIssues = [];
  const registryById = new Map(registry.map((source) => [source.id, source]));
  const ids = new Set();
  for (const record of records) {
    if (!record.id || ids.has(record.id)) fatalIssues.push(`DUPLICATE_HISTORY_ID:${record.id || "missing"}`);
    ids.add(record.id);
    if (!schoolKeys.has(`${record.district}:${record.schoolCode}`)) fatalIssues.push(`UNKNOWN_SCHOOL:${record.id}:${record.district}:${record.schoolCode}`);
    const source = registryById.get(record.sourceId);
    if (!source) fatalIssues.push(`MISSING_SOURCE:${record.id}:${record.sourceId || "missing"}`);
    if (officialHistoryTypes.has(record.sourceType)) {
      if (!record.sourceUrl || !source || !officialHistoryTypes.has(source.sourceType)) fatalIssues.push(`OFFICIAL_HISTORY_SOURCE_REQUIRED:${record.id}`);
      if (!officialMetrics.has(record.metricType)) fatalIssues.push(`OFFICIAL_METRIC_REQUIRED:${record.id}`);
    }
    if (record.sourceType === "community" && officialMetrics.has(record.metricType)) fatalIssues.push(`COMMUNITY_CANNOT_BE_OFFICIAL:${record.id}`);
    if (record.schoolYear !== record.dataSchoolYear && record.yearStatus !== "previous_year_reference") fatalIssues.push(`YEAR_MASQUERADE:${record.id}:${record.dataSchoolYear}->${record.schoolYear}`);
    if (!validateDate(record.verifiedAt) || !validateDate(record.retrievedAt)) fatalIssues.push(`INVALID_HISTORY_DATE:${record.id}`);
  }
  return validationResult(fatalIssues);
}

export function validateVocationalGroupRecords(records, registry, knownPrograms) {
  const fatalIssues = [];
  const registryById = new Map(registry.map((source) => [source.id, source]));
  for (const record of records) {
    if (!record.id || !record.name || !record.groupId || !record.groupName) fatalIssues.push(`INCOMPLETE_VOCATIONAL_GROUP:${record.id || "missing"}`);
    if (!knownPrograms.has(record.name)) fatalIssues.push(`UNKNOWN_PROGRAM:${record.id}:${record.name}`);
    if (!registryById.has(record.sourceId)) fatalIssues.push(`MISSING_SOURCE:${record.id}:${record.sourceId || "missing"}`);
  }
  return validationResult(fatalIssues);
}

function statusFor(sources, dataset) {
  const matching = sources.filter((source) => source.dataset === dataset);
  if (matching.some((source) => source.status === "VERIFIED" && source.sourceType !== "community")) return "VERIFIED";
  if (matching.some((source) => source.status === "AVAILABLE")) return "AVAILABLE";
  if (matching.some((source) => source.status === "PARTIAL")) return "PARTIAL";
  if (matching.some((source) => source.status === "PENDING")) return "PENDING";
  return "UNAVAILABLE";
}

export function deriveDistrictCapability(district, { sourceRegistry, schoolDirectoryStatus = "UNAVAILABLE", mapStatus = "UNAVAILABLE", plannerStatus = "UNAVAILABLE" }) {
  const sources = sourceRegistry.filter((source) => source.district === district || source.district === "all");
  const latest = sources.map((source) => source.verifiedAt || source.lastCheckedAt || source.retrievedAt).filter(Boolean).sort().at(-1) || "";
  return Object.freeze({
    admissionRules: statusFor(sources, "admission_rules"),
    schoolDirectory: schoolDirectoryStatus,
    admissionHistory: statusFor(sources, "admission_history"),
    schedule: statusFor(sources, "schedule"),
    map: mapStatus,
    planner: plannerStatus,
    sourceYear: sources.map((source) => source.schoolYear).filter(Boolean).sort().at(-1) || "",
    lastVerifiedAt: latest,
  });
}
