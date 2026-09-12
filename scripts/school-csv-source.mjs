import fs from "node:fs";
import path from "node:path";
import { ENABLED_SCHOOL_REGIONS } from "../lib/school-data/regional-loader.mjs";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const bundledSourceDir = path.join(projectRoot, "content", "schools", "regions");

export function getSchoolCsvSourceDir() {
  const sourceDir = path.resolve(process.env.JSHS_CSV_SOURCE_DIR || bundledSourceDir);
  const missing = ENABLED_SCHOOL_REGIONS
    .map((region) => path.join(region.folder, region.file))
    .filter((file) => !fs.existsSync(path.join(sourceDir, file)));
  if (missing.length) throw new Error(`School regional CSV source is incomplete: ${sourceDir}; missing ${missing.join(", ")}`);
  return sourceDir;
}

export function projectPath(...parts) { return path.join(projectRoot, ...parts); }
export const enabledRegions = ENABLED_SCHOOL_REGIONS;
export const regionalCsvFiles = Object.fromEntries(ENABLED_SCHOOL_REGIONS.map((region) => [region.code, `${region.folder}/${region.file}`]));

export function regionalCsvPath(code) {
  const relative = regionalCsvFiles[code];
  if (!relative) throw new Error(`Unknown school district CSV: ${code}`);
  return path.join(schoolCsvSourceDir, relative);
}

export function regionalAdmissionHistoryPath(code) {
  const relative = regionalCsvFiles[code];
  if (!relative) throw new Error(`Unknown school district CSV: ${code}`);
  return path.join(schoolCsvSourceDir, path.dirname(relative), "admission-history.csv");
}
export const schoolCsvSourceDir = getSchoolCsvSourceDir();
