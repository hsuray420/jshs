import { readFile } from "node:fs/promises";

import {
  findForbiddenPublicMarkers,
  validateDistrictMetadata,
  validateSitemap,
} from "../lib/content-trust.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [metadataText, sitemap, robots, fiveYearPage, guideScript, centralScript] = await Promise.all([
  read("public/it_hs/district-metadata.json"),
  read("public/sitemap.xml"),
  read("public/robots.txt"),
  read("public/it_5/it_5.html"),
  read("public/it_hs/guide.js"),
  read("public/it_hs/ct/it_hs.js"),
]);

const metadata = JSON.parse(metadataText);
const issues = [
  ...validateDistrictMetadata(metadata),
  ...validateSitemap(sitemap, metadata.canonicalOrigin),
  ...findForbiddenPublicMarkers({
    "public/it_5/it_5.html": fiveYearPage,
    "public/it_hs/guide.js": guideScript,
    "public/it_hs/ct/it_hs.js": centralScript,
  }),
];

const expectedSitemap = `Sitemap: ${metadata.canonicalOrigin}/sitemap.xml`;
if (!robots.includes(expectedSitemap)) issues.push(`robots.txt must include ${expectedSitemap}`);

if (issues.length > 0) {
  console.error("Content trust validation failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Content trust validation passed for ${Object.keys(metadata.districts).length} districts.`);
}
