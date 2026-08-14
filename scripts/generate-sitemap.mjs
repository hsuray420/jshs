import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { toSchoolRecords } from "../lib/school-catalog.mjs";

const root = process.cwd();
const [newsCatalog, districtMetadata, centralCsv] = await Promise.all([
  readJson("content/news.json"),
  readJson("public/it_hs/district-metadata.json"),
  readFile(resolve(root, "public/it_hs/ct/schools.csv"), "utf8"),
]);

const updatedAt = districtMetadata.updatedAt;
const staticEntries = [
  entry("/", updatedAt, "weekly", "1.0"),
  entry("/it_5/it_5.html", updatedAt, "weekly", "0.7"),
  entry("/news", newsCatalog.updatedAt, "weekly", "0.9"),
  ...["exam", "rules", "strategy", "schools", "career", "parents"].map((slug) => entry(`/news/${slug}`, newsCatalog.updatedAt, "weekly", "0.8")),
  entry("/schools", updatedAt, "weekly", "0.9"),
  entry("/tools", updatedAt, "weekly", "0.9"),
  entry("/districts", updatedAt, "weekly", "0.9"),
];
const newsEntries = newsCatalog.articles.map((article) => entry(`/news/${article.slug}`, article.updatedAt, "monthly", "0.8"));
const centralSchoolEntries = toSchoolRecords(centralCsv).map((school) => entry(`/schools/ct/${school.code}`, districtMetadata.districts.ct.updatedAt, "monthly", "0.7"));
const entries = [...staticEntries, ...newsEntries, ...centralSchoolEntries];
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
