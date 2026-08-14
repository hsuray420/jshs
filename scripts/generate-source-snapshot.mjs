import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "lib/source-code.ts");
const sourceRoots = ["app", "components", "content", "db", "lib", "scripts", "worker"];
const allowedExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".ts", ".tsx"]);
const excluded = new Set(["lib/source-code.ts"]);

const paths = (await Promise.all(sourceRoots.map((directory) => walk(resolve(root, directory))))).flat()
  .map((path) => relative(root, path).replaceAll("\\", "/"))
  .filter((path) => allowedExtensions.has(extname(path)) && !excluded.has(path))
  .sort();
const files = await Promise.all(paths.map(async (path) => ({ path, content: await readFile(resolve(root, path), "utf8") })));
const next = `export type SourceFile = { path: string; content: string };\n\nexport const SOURCE_FILES: SourceFile[] = ${JSON.stringify(files, null, 2)};\n`;
const current = await readFile(outputPath, "utf8").catch(() => "");
if (current !== next) await writeFile(outputPath, next, "utf8");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return nested.flat();
}
