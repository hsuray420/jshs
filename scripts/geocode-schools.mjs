#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "../lib/school-data/pipeline.mjs";
import { schoolCsvSourceDir, projectPath } from "./school-csv-source.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = schoolCsvSourceDir;
const runtimeDir = projectPath("content", "schools");
const masterPath = path.join(sourceDir, "schools_master.csv");
const cachePath = path.join(runtimeDir, "school-geocode-cache.json");
const reviewPath = path.join(runtimeDir, "geocode-review-queue.json");
const retryPath = path.join(runtimeDir, "geocode-retry-queue.json");
const metadataPath = path.join(runtimeDir, "generated/geocode-metadata.json");
const providerCachePath = path.join(runtimeDir, "generated/geocode-provider-cache.json");

const args = new Set(process.argv.slice(2));
const resume = args.has("--resume");
const today = new Date().toISOString().slice(0, 10);
const tgosQueryKey = process.env.TGOS_QUERY_KEYSTR || "Lcq/FkX+iuVFat3SJ4GVHloiu9meTVNcU4inAmvF0bo=";
const tgosAddressKey = process.env.TGOS_ADDRESS_KEYSTR || "MdhrUWtcA+7EZ0vw79s5XDGsvF2TEuCiksirp6JmsoU=";

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function toHalfWidth(value) {
  return String(value || "").replace(/[０-９]/g, (char) => String(char.charCodeAt(0) - 0xff10));
}

export function normalizeAddress(value) {
  const originalAddress = String(value || "").trim();
  const normalizedAddress = toHalfWidth(originalAddress)
    .normalize("NFKC")
    .replace(/^\[?\d{3,6}\]?\s*/, "")
    .replace(/\s+/g, "")
    .replaceAll("台", "臺")
    .replaceAll("恒", "恆")
    .replaceAll("－", "-")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replace(/[一壹]段/g, "1段")
    .replace(/[二貳]段/g, "2段")
    .replace(/[三參]段/g, "3段")
    .replace(/[四肆]段/g, "4段")
    .replace(/[五伍]段/g, "5段")
    .replace(/[六陸]段/g, "6段")
    .replace(/[七柒]段/g, "7段")
    .replace(/[八捌]段/g, "8段")
    .replace(/[九玖]段/g, "9段")
    .replace(/[十拾]段/g, "10段")
    .replace(/(\d+)之(\d+)/g, "$1-$2")
    .replace(/(\d+)號之(\d+)/g, "$1-$2號")
    .replace(/(\d+)樓/g, "$1F")
    .replace(/\d+鄰/g, "")
    .replace(/[号]/g, "號");
  return { originalAddress, normalizedAddress };
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replaceAll("台", "臺")
    .replace(/國立|市立|縣立|私立|財團法人|股份有限公司/g, "")
    .replace(/高級中等學校|高級中學/g, "高中")
    .replace(/\s+/g, "");
}

function addressCore(value) {
  return normalizeAddress(value).normalizedAddress
    .replace(/^[^縣市]+[縣市]/, "")
    .replace(/^[^區鄉鎮市]+[區鄉鎮市]/, "")
    .replace(/^[^路街道大道巷弄段號]+[里村]/, "");
}

function roadHouse(value) {
  const core = addressCore(value);
  if (!/[路街道大道段巷弄]/.test(core)) return core.replace(/[里村]/g, "");
  return core.match(/(.+?[路街道大道段巷弄])(\d+(?:-\d+)?號?)/)?.slice(1).join("") || core;
}

function cityOf(candidate) {
  return normalizeAddress(candidate.city || candidate.county || "").normalizedAddress;
}

function districtOf(candidate) {
  return normalizeAddress(candidate.town || candidate.suburb || candidate.city_district || "").normalizedAddress;
}

function hasTaiwanCoordinate(candidate) {
  return Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude)
    && candidate.latitude >= 21.7 && candidate.latitude <= 26.4
    && candidate.longitude >= 118 && candidate.longitude <= 123;
}

function validateCandidate(school, candidate) {
  const expectedCity = normalizeAddress(school.city).normalizedAddress;
  const expectedDistrict = normalizeAddress(school.area).normalizedAddress;
  const matchedAddress = candidate.matchedAddress || "";
  const matchedName = candidate.matchedPlaceName || "";
  const expectedName = normalizeName(school.name);
  const candidateName = normalizeName(matchedName);
  const cityMatch = cityOf(candidate) === expectedCity || normalizeAddress(matchedAddress).normalizedAddress.includes(expectedCity);
  const districtMatch = districtOf(candidate) === expectedDistrict || normalizeAddress(matchedAddress).normalizedAddress.includes(expectedDistrict);
  const addressMatch = roadHouse(matchedAddress) === roadHouse(school.address);
  const nameMatch = !candidateName || expectedName.includes(candidateName) || candidateName.includes(expectedName) || candidate.code === school.code || (school.name.includes("進修部") && addressMatch);
  const coordinateMatch = hasTaiwanCoordinate(candidate);
  return { cityMatch, districtMatch, addressMatch, nameMatch, coordinateMatch, verified: cityMatch && districtMatch && addressMatch && nameMatch && coordinateMatch };
}

function toSchool(row) {
  return {
    code: row["學校代碼"],
    name: row["學校名稱"],
    city: row["縣市"],
    area: row["區"],
    address: row["地址"],
    mapUrl: row["Google地圖"],
  };
}

function parseTgosJsonp(text) {
  const match = text.match(/^[^(]+\(([\s\S]*)\)\s*;?\s*$/);
  if (!match) throw new Error("Invalid TGOS JSONP response");
  return Function(`"use strict";return (${match[1]});`)();
}

async function tgosQuery(city, area, page) {
  const expr = area ? `[TOWN]='${area}' AND [COUNTY]='${city}'` : `[COUNTY]='${city}'`;
  const url = new URL("https://gis.tgos.tw/TGQuery/TGQuery.ashx");
  url.search = new URLSearchParams({
    op: "att",
    res: "SCHOOL.cfg",
    layer: "dbo.SCHOOL_F",
    EXPR: expr,
    page: String(page),
    keystr: tgosQueryKey,
    jsonp: "cb",
  }).toString();
  const response = await fetch(url, {
    headers: {
      referer: "https://stats.moe.gov.tw/edugissys/default.aspx",
      "user-agent": "jshs-school-geocode/1.0 (https://jshs.cc)",
      accept: "application/javascript",
    },
  });
  if ([408, 425, 429, 500, 502, 503, 504].includes(response.status)) {
    return { status: "retryable", reason: `provider_http_${response.status}`, source: url.href, candidates: [] };
  }
  const text = await response.text();
  if (!response.ok) return { status: "manual_review", reason: `provider_http_${response.status}`, source: url.href, candidates: [] };
  if (text.includes("Invalid Key")) return { status: "retryable", reason: "provider_invalid_key", source: url.href, candidates: [] };
  const parsed = parseTgosJsonp(text);
  if (!parsed) return { status: "ok", source: url.href, candidates: [], pages: 1 };
  const candidates = (parsed?.Feature || []).map((feature) => {
    const values = feature.Values || {};
    return {
      provider: "moe_tgos_school_layer",
      source: url.href,
      code: values.CODE || "",
      matchedPlaceName: String(values.NAME || "").trim(),
      city: values.COUNTY || "",
      town: values.TOWN || "",
      matchedAddress: String(values.ADDRESS || "").trim(),
      longitude: Number(values.E || values.LON),
      latitude: Number(values.N || values.LAT),
    };
  });
  return { status: "ok", source: url.href, candidates, pages: Number(parsed.Page || parsed.Pages || parsed.totalPage || 1) || 1 };
}

async function tgosAddressQuery(school) {
  const url = new URL("https://gis.tgos.tw/TGAddress/TGAddress.aspx");
  url.search = new URLSearchParams({
    oAddress: school.address,
    oSRS: "EPSG:4326",
    oResultDataType: "jsonp",
    pnum: "10",
    keystr: tgosAddressKey,
    jsonp: "cb",
  }).toString();
  const response = await fetch(url, {
    headers: {
      referer: "https://stats.moe.gov.tw/edugissys/default.aspx",
      "user-agent": "jshs-school-geocode/1.0 (https://jshs.cc)",
      accept: "application/javascript",
    },
  });
  if ([408, 425, 429, 500, 502, 503, 504].includes(response.status)) {
    return { status: "retryable", reason: `address_provider_http_${response.status}`, source: url.href, candidates: [] };
  }
  const text = await response.text();
  if (!response.ok) return { status: "manual_review", reason: `address_provider_http_${response.status}`, source: url.href, candidates: [] };
  if (text.includes("Invalid Key")) return { status: "retryable", reason: "address_provider_invalid_key", source: url.href, candidates: [] };
  const parsed = parseTgosJsonp(text);
  const candidates = (parsed?.AddressList || []).map((item) => ({
    provider: "tgos_address_locator",
    source: url.href,
    code: "",
    matchedPlaceName: "",
    city: item.COUNTY || "",
    town: item.TOWN || "",
    matchedAddress: String(item.FULL_ADDR || "").trim(),
    longitude: Number(item.X),
    latitude: Number(item.Y),
  }));
  return { status: "ok", source: url.href, candidates };
}

async function fetchTgosCandidates(school, providerCache) {
  const cacheKey = `${school.city}\u0000${school.area}`;
  if (resume && providerCache[cacheKey]) return providerCache[cacheKey];
  const pages = [];
  let first = await tgosQuery(school.city, school.area, 1);
  if (first.status !== "ok") return first;
  pages.push(first);
  for (let page = 2; page <= first.pages; page += 1) {
    const next = await tgosQuery(school.city, school.area, page);
    if (next.status !== "ok") return next;
    pages.push(next);
  }
  const result = { status: "ok", source: first.source, candidates: pages.flatMap((page) => page.candidates) };
  providerCache[cacheKey] = result;
  writeJson(providerCachePath, providerCache);
  return result;
}

async function fetchAddressCandidates(school, providerCache) {
  const cacheKey = `address\u0000${school.address}`;
  if (resume && providerCache[cacheKey]) return providerCache[cacheKey];
  const result = await tgosAddressQuery(school);
  providerCache[cacheKey] = result;
  writeJson(providerCachePath, providerCache);
  return result;
}

function verifiedRecord(school, candidate, checks) {
  const normalized = normalizeAddress(school.address);
  return {
    schoolCode: school.code,
    schoolName: school.name,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    originalAddress: normalized.originalAddress,
    normalizedAddress: normalized.normalizedAddress,
    provider: candidate.provider,
    source: candidate.source,
    sourceType: candidate.provider,
    matchedAddress: candidate.matchedAddress,
    matchedPlaceName: candidate.matchedPlaceName,
    cityMatch: checks.cityMatch,
    districtMatch: checks.districtMatch,
    addressMatch: checks.addressMatch,
    verificationStatus: "verified",
    verifiedAt: today,
  };
}

async function geocodeSchool(school, providerCache) {
  const provider = await fetchTgosCandidates(school, providerCache);
  if (provider.status === "retryable") return { type: "retry", reason: provider.reason, candidates: provider.candidates || [] };
  if (provider.status !== "ok") return { type: "review", reason: provider.reason || "provider_error", candidates: provider.candidates || [] };
  const codeMatches = provider.candidates.filter((candidate) => candidate.code === school.code);
  const addressMatches = provider.candidates.filter((candidate) => roadHouse(candidate.matchedAddress) === roadHouse(school.address));
  const candidates = codeMatches.length ? codeMatches : addressMatches;
  if (candidates.length === 1) {
    const candidate = candidates[0];
    const checks = validateCandidate(school, candidate);
    if (checks.verified) return { type: "verified", record: verifiedRecord(school, candidate, checks) };
  }
  const addressProvider = await fetchAddressCandidates(school, providerCache);
  if (addressProvider.status === "retryable") return { type: "retry", reason: addressProvider.reason, candidates: addressProvider.candidates || [] };
  if (addressProvider.status === "ok") {
    const verifiedAddressCandidates = addressProvider.candidates.map((candidate) => ({ candidate, checks: validateCandidate(school, candidate) })).filter((entry) => entry.checks.verified);
    if (verifiedAddressCandidates.length === 1) return { type: "verified", record: verifiedRecord(school, verifiedAddressCandidates[0].candidate, verifiedAddressCandidates[0].checks) };
    if (verifiedAddressCandidates.length > 1) return { type: "review", reason: "multiple_candidates", candidates: verifiedAddressCandidates.map((entry) => entry.candidate) };
  }
  if (!candidates.length) return { type: "review", reason: provider.candidates.length ? "no_address_or_code_match" : "no_result", candidates: provider.candidates };
  if (candidates.length > 1) return { type: "review", reason: "multiple_candidates", candidates };
  const checks = validateCandidate(school, candidates[0]);
  const reason = !checks.cityMatch ? "city_mismatch" : !checks.districtMatch ? "district_mismatch" : !checks.addressMatch ? "address_mismatch" : !checks.nameMatch ? "place_name_mismatch" : "coordinate_out_of_range";
  return { type: "review", reason, candidates };
}

function isVerifiedForSchool(school, record) {
  if (!record || record.schoolCode !== school.code || record.verificationStatus !== "verified") return false;
  if (!Number.isFinite(record.latitude) || !Number.isFinite(record.longitude)) return false;
  if (!record.provider || !record.source || !record.verifiedAt) return false;
  return normalizeAddress(record.originalAddress || record.normalizedAddress).normalizedAddress === normalizeAddress(school.address).normalizedAddress;
}

function counters(entries) {
  return entries.reduce((acc, entry) => ({ ...acc, [entry.reason]: (acc[entry.reason] || 0) + 1 }), {});
}

const master = parseCsv(fs.readFileSync(masterPath, "utf8")).rows.map(toSchool);
const cache = readJson(cachePath, {});
const providerCache = readJson(providerCachePath, {});
const verified = {};
const review = [];
const retry = [];
let sharedCampusCoordinates = 0;
let addressNormalizationWarnings = 0;

for (const school of master) {
  const existing = cache[school.code];
  if (resume && isVerifiedForSchool(school, existing)) {
    verified[school.code] = existing;
    continue;
  }
  const result = await geocodeSchool(school, providerCache);
  if (result.type === "verified") verified[school.code] = result.record;
  else if (result.type === "retry") retry.push({ schoolCode: school.code, schoolName: school.name, address: school.address, reason: result.reason, candidates: result.candidates });
  else review.push({ schoolCode: school.code, schoolName: school.name, address: school.address, reason: result.reason, candidates: result.candidates });
  if ((Object.keys(verified).length + review.length + retry.length) % 25 === 0) {
    writeJson(cachePath, Object.fromEntries(Object.entries(verified).sort(([a], [b]) => a.localeCompare(b))));
    writeJson(reviewPath, review);
    writeJson(retryPath, retry);
    console.log(`geocode progress ${Object.keys(verified).length}/${master.length} verified, ${review.length} review, ${retry.length} retry`);
  }
}

const coordinateKeys = new Map();
for (const record of Object.values(verified)) {
  const key = `${record.latitude.toFixed(7)},${record.longitude.toFixed(7)}`;
  coordinateKeys.set(key, (coordinateKeys.get(key) || 0) + 1);
}
sharedCampusCoordinates = [...coordinateKeys.values()].filter((count) => count > 1).reduce((sum, count) => sum + count, 0);

const orderedVerified = Object.fromEntries(Object.entries(verified).sort(([a], [b]) => a.localeCompare(b)));
const reviewCounters = counters(review);
const retryCounters = counters(retry);
const report = {
  total: master.length,
  verified: Object.keys(verified).length,
  review: review.length,
  retry: retry.length,
  failed: 0,
  coverage: Object.keys(verified).length / master.length,
  sharedCampusCoordinates,
  addressNormalizationWarnings,
  cityMismatch: reviewCounters.city_mismatch || 0,
  districtMismatch: reviewCounters.district_mismatch || 0,
  addressMismatch: reviewCounters.address_mismatch || 0,
  multipleCandidates: reviewCounters.multiple_candidates || 0,
  noResult: reviewCounters.no_result || 0,
  retryable: retryCounters,
  provider: "moe_tgos_school_layer",
  generatedAt: new Date().toISOString(),
};

writeJson(cachePath, orderedVerified);
writeJson(reviewPath, review);
writeJson(retryPath, retry);
writeJson(metadataPath, report);

console.log(`TOTAL = ${report.total}`);
console.log(`VERIFIED = ${report.verified}`);
console.log(`REVIEW = ${report.review}`);
console.log(`RETRY = ${report.retry}`);
console.log(`FAILED = ${report.failed}`);
console.log(`COVERAGE = ${(report.coverage * 100).toFixed(2)}%`);
console.log(`CITY_MISMATCH = ${report.cityMismatch}`);
console.log(`DISTRICT_MISMATCH = ${report.districtMismatch}`);
console.log(`ADDRESS_MISMATCH = ${report.addressMismatch}`);
console.log(`MULTIPLE_CANDIDATES = ${report.multipleCandidates}`);
console.log(`NO_RESULT = ${report.noResult}`);
