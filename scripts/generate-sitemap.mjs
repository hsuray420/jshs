import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { toSchoolRecords } from "../lib/school-catalog.mjs";

const root = process.cwd();
const districtMetadata = await readJson("public/it_hs/district-metadata.json");
const routeMetadata = await readJson("content/route-metadata.json");

const updatedAt = districtMetadata.updatedAt;
const staticEntries = routeMetadata.routes
  .filter((route) => route.indexable && route.sitemap)
  .map((route) => entry(route.pathname, updatedAt, route.changefreq, route.priority));
const schoolEntries = Object.entries(districtMetadata.districts).flatMap(([districtCode, district]) => {
  const file = districtCode === "tp" ? "schools_tp.csv" : districtCode === "taoyuan-lienchiang" ? "schools_tl.csv" : "schools.csv";
  return readFile(resolve(root, `public/it_hs/${districtCode}/${file}`), "utf8")
    .then((csv) => toSchoolRecords(csv).map((school) => entry(`/schools/${districtCode}/${school.code}`, district.updatedAt, "monthly", "0.7")));
});
const schoolEntryGroups = await Promise.all(schoolEntries);
const entries = [...staticEntries, ...schoolEntryGroups.flat()];
const uniqueEntries = [...new Map(entries.map((item) => [item.path, item])).values()];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueEntries.map(toXml).join("\n")}
</urlset>
`;

await writeFile(resolve(root, "public/sitemap.xml"), xml, "utf8");

function entry(path, lastmod, changefreq, priority) {
  return Object.freeze({ path, lastmod, changefreq, priority });
}

function toXml(item) {
  return `    <url>
        <loc>https://jshs.cc${item.path}</loc>
        <lastmod>${item.lastmod}</lastmod>
        <changefreq>${item.changefreq}</changefreq>
        <priority>${item.priority}</priority>
    </url>`;
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}
