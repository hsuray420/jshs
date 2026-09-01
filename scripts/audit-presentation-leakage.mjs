import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components", "content", "public/it_5", "public/jshs"];
const ignored = new Set(["lib/source-code.ts"]);
const sourceExtensions = new Set([".tsx", ".ts", ".js", ".jsx", ".html", ".txt"]);
const forbidden = [
  /\btarget_choice_score\b/u,
  /\bnearby_score\b/u,
  /\bsum\(subject_scores\)/u,
  /\bPARTIAL_DATA_INTERNAL\b/u,
  />\s*(?:undefined|null|NaN|\[object Object\])\s*</u,
  /資料\s*[:：]\s*\{["'{]/u,
  /debug text/u,
];

const issues = [];
for (const scanRoot of scanRoots) {
  for await (const file of walk(join(root, scanRoot))) {
    const rel = relative(root, file);
    if (ignored.has(rel) || !sourceExtensions.has(extname(file))) continue;
    const text = await readFile(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(text)) issues.push(`${rel}: ${pattern}`);
    }
  }
}

if (issues.length) {
  console.error(`Presentation leakage audit failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Presentation leakage audit passed: known internal markers are not exposed in public surfaces.");

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "dist", ".wrangler"].includes(entry.name)) continue;
      yield* walk(path);
    } else {
      yield path;
    }
  }
}
