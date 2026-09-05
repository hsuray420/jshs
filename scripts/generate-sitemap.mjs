import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const districtMetadata = await readJson("public/it_hs/district-metadata.json");
const routeMetadata = await readJson("content/route-metadata.json");

const updatedAt = districtMetadata.updatedAt;
const staticEntries = routeMetadata.routes
  .filter((route) => route.indexable && route.sitemap)
  .map((route) => entry(route.pathname, updatedAt, route.changefreq, route.priority));
const schools = await readJson("content/schools/generated/schools.json");
const schoolEntries = schools.map((school) => entry(`/schools/${school.code}`, "2026-09-01", "monthly", "0.7"));
const entries = [...staticEntries, ...schoolEntries];
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
