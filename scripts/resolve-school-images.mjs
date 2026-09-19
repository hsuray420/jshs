import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schoolsPath = path.join(root, "content/schools/generated/schools-by-code.json");
const coordinatesPath = path.join(root, "content/schools/school-geocode-cache.json");
const manualPath = path.join(root, "content/schools/school-media.json");
const cachePath = path.join(root, "content/schools/generated/school-image-cache.json");
const imageRoot = path.join(root, "public/media/schools");
const now = new Date();
const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString();
const headers = { accept: "application/json", "user-agent": "JSHS-school-image-resolver/1.0 (https://jshs.cc)" };

const normalize = (value) => String(value || "").normalize("NFKC").toLowerCase().replaceAll("台", "臺").replace(/[^\p{Letter}\p{Number}]+/gu, "");
const json = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const schools = json(schoolsPath);
const coordinates = json(coordinatesPath);
const manual = json(manualPath);
const existing = fs.existsSync(cachePath) ? json(cachePath) : {};
const args = new Set(process.argv.slice(2));
const requestedCodes = process.argv.filter((value) => /^\d{6}[A-Z\d]?$/.test(value));
const candidates = Object.values(schools).filter((school) => !requestedCodes.length || requestedCodes.includes(school.code)).slice(0, Number(process.env.JSHS_IMAGE_LIMIT || (requestedCodes.length ? requestedCodes.length : 10)));

async function getJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function identityRecord(school) {
  const coordinate = coordinates[school.code];
  if (!coordinate || coordinate.verificationStatus !== "verified" || !Number.isFinite(coordinate.latitude) || !Number.isFinite(coordinate.longitude)) return null;
  return { address: school.address || "", latitude: coordinate.latitude, longitude: coordinate.longitude };
}

async function findOsmEntity(school, identity) {
  const query = `[out:json][timeout:20];nwr[amenity=school](around:500,${identity.latitude},${identity.longitude});out center tags;`;
  const payload = await getJson(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  const expectedName = normalize(school.name);
  const expectedAddress = normalize(school.address);
  const matches = (payload.elements || []).map((element) => {
    const tags = element.tags || {};
    const nameMatch = normalize(tags.name) === expectedName;
    const addressMatch = expectedAddress && [tags["addr:full"], tags["addr:street"], tags["addr:district"]].some((value) => normalize(value) && expectedAddress.includes(normalize(value)));
    const linked = tags.wikidata || tags.wikipedia || tags.wikimedia_commons;
    return { element, tags, score: (nameMatch ? 4 : 0) + (addressMatch ? 2 : 0) + (linked ? 1 : 0) };
  }).filter((item) => item.score >= 4).sort((a, b) => b.score - a.score);
  if (!matches.length || (matches.length > 1 && matches[0].score === matches[1].score)) return null;
  const match = matches[0];
  return { id: `${match.element.type}/${match.element.id}`, tags: match.tags };
}

async function getWikidataImage(qid) {
  if (!/^Q\d+$/.test(qid || "")) return null;
  const payload = await getJson(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  const entity = payload.entities?.[qid];
  const fileName = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  return typeof fileName === "string" ? fileName : null;
}

async function getCommonsImage(fileName) {
  if (!fileName) return null;
  const params = new URLSearchParams({ action: "query", format: "json", prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: "1200", titles: `File:${fileName}` });
  const payload = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const page = Object.values(payload.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  const metadata = info?.extmetadata || {};
  if (!info?.thumburl || !/^image\/(jpeg|png|webp)$/i.test(info.mime || "") || !metadata.LicenseShortName?.value) return null;
  return { thumbnail: info.thumburl, medium: info.thumburl, original: info.url, mime: info.mime, author: metadata.Artist?.value || metadata.Credit?.value || "", license: metadata.LicenseShortName.value, licenseUrl: metadata.LicenseUrl?.value || "", sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName.replaceAll(" ", "_"))}` };
}

async function resolve(school) {
  const identity = identityRecord(school);
  if (!identity) return unresolved(school, "missing_verified_identity");
  if (manual[school.code]) return unresolved(school, "manual_media_has_priority");
  try {
    const osm = await findOsmEntity(school, identity);
    if (!osm) return unresolved(school, "no_exact_osm_entity", identity);
    let fileName = osm.tags.wikidata ? await getWikidataImage(osm.tags.wikidata) : null;
    let image = fileName ? await getCommonsImage(fileName) : null;
    if (!image && osm.tags.wikimedia_commons?.startsWith("File:")) {
      fileName = osm.tags.wikimedia_commons.slice(5);
      image = await getCommonsImage(fileName);
    }
    if (!image) return unresolved(school, "no_licensed_linked_image", identity, { osm: osm.id, wikidata: osm.tags.wikidata, commons: osm.tags.wikimedia_commons, wikipedia: osm.tags.wikipedia });
    const extension = image.mime.split("/")[1] === "jpeg" ? "jpg" : image.mime.split("/")[1];
    const localPath = path.join(imageRoot, `${school.code}.${extension}`);
    fs.mkdirSync(imageRoot, { recursive: true });
    const response = await fetch(image.thumbnail, { headers: { "user-agent": headers["user-agent"] } });
    if (!response.ok || !response.body) return unresolved(school, "image_download_failed", identity);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 8_000_000) return unresolved(school, "image_too_large", identity);
    fs.writeFileSync(localPath, bytes);
    return { schoolCode: school.code, schoolName: school.name, status: "resolved", image: { thumbnail: image.thumbnail, medium: image.thumbnail, original: image.original, localPath: `/media/schools/${school.code}.${extension}` }, source: "wikimedia-commons", sourceEntity: { osm: osm.id, wikidata: osm.tags.wikidata, commons: fileName ? `File:${fileName}` : osm.tags.wikimedia_commons, wikipedia: osm.tags.wikipedia }, attribution: { author: image.author, license: image.license, licenseUrl: image.licenseUrl, sourceUrl: image.sourceUrl }, confidence: osm.tags.wikidata ? "very_high" : "high", identity, resolvedAt: now.toISOString(), expiresAt };
  } catch (error) {
    if (args.has("--strict")) throw error;
    return unresolved(school, error instanceof Error ? error.message.slice(0, 160) : "resolver_error", identity);
  }
}

function unresolved(school, reason, identity, sourceEntity) {
  return { schoolCode: school.code, schoolName: school.name, status: "unresolved", source: "placeholder", sourceEntity, confidence: "low", identity, resolvedAt: now.toISOString(), expiresAt, reason };
}

for (const school of candidates) {
  if (existing[school.code]?.status === "resolved" && !args.has("--refresh")) continue;
  const result = await resolve(school);
  existing[school.code] = result;
  console.log(`${school.code} ${school.name}: ${result.status} (${result.confidence})`);
}

fs.mkdirSync(path.dirname(cachePath), { recursive: true });
fs.writeFileSync(cachePath, `${JSON.stringify(existing, null, 2)}\n`);
