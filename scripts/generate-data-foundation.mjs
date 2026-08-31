import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const metadata = JSON.parse(await readFile(resolve(root, "public/it_hs/district-metadata.json"), "utf8"));
const guideCatalog = JSON.parse(await readFile(resolve(root, "data/admission-guides.json"), "utf8"));
const hash = (buffer) => `sha256:${createHash("sha256").update(buffer).digest("hex")}`;
const checkedAt = guideCatalog.updatedAt;

const guideSources = await Promise.all(guideCatalog.guides.map(async (guide) => {
  const content = await readFile(resolve(root, `public${guide.file}`));
  const district = metadata.districts[guide.code];
  return {
    id: `guide-${guide.code}-${guideCatalog.academicYear}`,
    dataset: "admission_rules",
    district: guide.code,
    schoolYear: guideCatalog.academicYear,
    issuer: district.sourceName,
    sourceUrl: guide.sourceUrl,
    sourceDocumentPath: guide.file,
    sourceType: "official_original",
    ingestionMode: "MANUAL_VERIFIED",
    status: "VERIFIED",
    retrievedAt: checkedAt,
    lastCheckedAt: checkedAt,
    verifiedAt: checkedAt,
    snapshot: { contentHash: hash(content), contentType: "application/pdf", byteSize: content.byteLength },
  };
}));

const registry = [
  ...guideSources,
  { id: "school-directory-115", dataset: "school_directory", district: "all", schoolYear: "115", issuer: "各區公開招生資料與學校來源", sourceUrl: "/schools", sourceType: "jshs_curated", ingestionMode: "MANUAL_VERIFIED", status: "AVAILABLE", retrievedAt: metadata.updatedAt, lastCheckedAt: metadata.updatedAt, verifiedAt: metadata.updatedAt, snapshot: null },
  ...Object.keys(metadata.districts).map((district) => ({ id: `history-community-${district}-115`, dataset: "admission_history", district, schoolYear: "115", issuer: "非官方社群整理", sourceUrl: `/it_hs/${district}/admission-history.csv`, sourceType: "community", ingestionMode: "MANUAL", status: "PARTIAL", retrievedAt: metadata.updatedAt, lastCheckedAt: metadata.updatedAt, verifiedAt: "", snapshot: null })),
  { id: "schedule-115", dataset: "schedule", district: "all", schoolYear: "115", issuer: "各就學區招生委員會", sourceUrl: "/admission-guides/schedule", sourceType: "official_original", ingestionMode: "MANUAL_VERIFIED", status: "PARTIAL", retrievedAt: metadata.updatedAt, lastCheckedAt: metadata.updatedAt, verifiedAt: metadata.updatedAt, snapshot: null },
  { id: "coordinates-osm", dataset: "school_coordinates", district: "all", schoolYear: "", issuer: "OpenStreetMap / Overpass", sourceUrl: "https://www.openstreetmap.org/", sourceType: "jshs_curated", ingestionMode: "AUTOMATED", status: "PARTIAL", retrievedAt: metadata.updatedAt, lastCheckedAt: metadata.updatedAt, verifiedAt: "", snapshot: null },
  { id: "official-portals-115", dataset: "official_links", district: "all", schoolYear: "115", issuer: "各就學區官方網站", sourceUrl: "/admission-guides", sourceType: "official_original", ingestionMode: "MANUAL_VERIFIED", status: "AVAILABLE", retrievedAt: metadata.updatedAt, lastCheckedAt: metadata.updatedAt, verifiedAt: metadata.updatedAt, snapshot: null },
  { id: "vocational-programs-115", dataset: "vocational_groups", district: "all", schoolYear: "115", issuer: "現有學校目錄", sourceUrl: "/schools/groups", sourceType: "jshs_curated", ingestionMode: "MANUAL", status: "PARTIAL", retrievedAt: metadata.updatedAt, lastCheckedAt: metadata.updatedAt, verifiedAt: "", snapshot: null },
  { id: "recommendation-inputs", dataset: "recommendation_inputs", district: "all", schoolYear: "", issuer: "JSHS", sourceUrl: "/planner/recommend", sourceType: "jshs_curated", ingestionMode: "MANUAL", status: "UNAVAILABLE", retrievedAt: "2026-08-31", lastCheckedAt: "2026-08-31", verifiedAt: "", snapshot: null },
];

await writeFile(resolve(root, "data/source-registry.json"), `${JSON.stringify({ schemaVersion: "1.0", generatedAt: checkedAt, sources: registry }, null, 2)}\n`, "utf8");
console.log(`Generated data foundation registry: ${registry.length} sources, ${guideSources.length} hashed official documents.`);
