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
