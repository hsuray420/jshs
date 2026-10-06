import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const assetsDir = new URL("../dist/client/assets/", import.meta.url);
const publicTarget = new URL("../public/app/globals.css", import.meta.url);
const distTarget = new URL("../dist/client/app/globals.css", import.meta.url);

const files = await readdir(assetsDir);
const cssFile = files.find((file) => /^index-[\w-]+\.css$/.test(file));

if (!cssFile) {
  throw new Error("Could not find the built app stylesheet in dist/client/assets.");
}

const css = await readFile(join(assetsDir.pathname, cssFile), "utf8");
const banner = `/* Generated from dist/client/assets/${cssFile}. Do not edit directly. */\n@import url("/design-tokens.css");\n`;

for (const target of [publicTarget, distTarget]) {
  await mkdir(dirname(target.pathname), { recursive: true });
  await writeFile(target, `${banner}${css}`);
}

console.log(`Published app stylesheet from ${cssFile} to /app/globals.css.`);

// Vite can leave modulepreload references to JS chunks that were pruned because they only carried CSS
// (for example the shared schools-v2 stylesheet). Emit empty ES modules so those preloads return 200, not 404.
const manifestFiles = ["../dist/server/__vite_rsc_assets_manifest.js", "../dist/server/ssr/__vite_rsc_assets_manifest.js"];
const referenced = new Set();
for (const manifest of manifestFiles) {
  const source = await readFile(new URL(manifest, import.meta.url), "utf8").catch(() => "");
  for (const match of source.matchAll(/\/assets\/([\w.-]+\.js)/g)) referenced.add(match[1]);
}
const existing = new Set(await readdir(assetsDir));
const stubbed = [];
for (const name of referenced) {
  if (existing.has(name)) continue;
  await writeFile(new URL(name, assetsDir), "export {};\n");
  stubbed.push(name);
}
if (stubbed.length) console.log(`Emitted empty modules for pruned CSS-only chunks: ${stubbed.join(", ")}.`);
