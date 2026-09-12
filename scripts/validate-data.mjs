import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENABLED_SCHOOL_REGIONS, REGION_REGISTRY, UNAVAILABLE_SCHOOL_REGIONS, loadEnabledRegionalSchools } from "../lib/school-data/regional-loader.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const loaded = loadEnabledRegionalSchools(root);

if (loaded.audit.errors.length) errors.push(...loaded.audit.errors);
if (ENABLED_SCHOOL_REGIONS.length !== 5) errors.push(`expected 5 available school-data regions, got ${ENABLED_SCHOOL_REGIONS.length}`);
if (UNAVAILABLE_SCHOOL_REGIONS.length !== 10) errors.push(`expected 10 unavailable school-data regions, got ${UNAVAILABLE_SCHOOL_REGIONS.length}`);

const expectedAvailable = ["tp", "taoyuan-lienchiang", "hsinchu-miaoli", "ct", "kaohsiung"];
const actualAvailable = ENABLED_SCHOOL_REGIONS.map((region) => region.code);
for (const code of expectedAvailable) if (!actualAvailable.includes(code)) errors.push(`missing available school-data region: ${code}`);
for (const code of actualAvailable) if (!expectedAvailable.includes(code)) errors.push(`unexpected available school-data region: ${code}`);

for (const region of REGION_REGISTRY) {
  if (region.schoolDataStatus === "available") {
    const csv = path.join(root, region.csvPath);
    if (!fs.existsSync(csv)) errors.push(`${region.id}: available CSV does not exist: ${region.csvPath}`);
  } else if (region.csvPath) {
    errors.push(`${region.id}: unavailable region must not include csvPath`);
  }
}

const generatedMetadataPath = path.join(root, "content", "schools", "generated", "metadata.json");
if (fs.existsSync(generatedMetadataPath)) {
  const metadata = JSON.parse(fs.readFileSync(generatedMetadataPath, "utf8"));
  if (metadata.sourceModel !== "regional_csv_registry_available_only") errors.push("generated metadata sourceModel is not registry-only CSV");
  if (metadata.enabledRegionCount !== 5) errors.push(`generated metadata enabledRegionCount expected 5, got ${metadata.enabledRegionCount}`);
  if (metadata.unavailableRegionCount !== 10) errors.push(`generated metadata unavailableRegionCount expected 10, got ${metadata.unavailableRegionCount}`);
}

const scanFiles = [
  "lib/school-data/regional-loader.mjs",
  "scripts/school-csv-source.mjs",
  "scripts/generate-schools.mjs",
  "components/school-explorer.tsx",
  "app/districts/page.tsx",
  "app/schools/page.tsx",
];
const forbidden = [/schools_master\.csv/, /school_admission_records\.csv/, /csv\s*\?\?\s*legacy/i, /catch\s*\([^)]*\)\s*{[^}]*old/i, /fallback.*schools\.csv/i];
for (const relative of scanFiles) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  for (const pattern of forbidden) if (pattern.test(source)) errors.push(`${relative}: forbidden legacy/fallback reference ${pattern}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  schoolDataAvailableRegions: ENABLED_SCHOOL_REGIONS.map((region) => region.code),
  schoolDataUnavailableRegions: UNAVAILABLE_SCHOOL_REGIONS.map((region) => region.code),
  sourceRows: loaded.rows.length,
  schools: loaded.schools.length,
}, null, 2));
