import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = new URL("../styles/guide-tailwind.css", import.meta.url);
const outputPath = new URL("../public/it_hs/guide-tailwind.css", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const result = await postcss([tailwindcss({ base: projectRoot })]).process(source, {
  from: fileURLToPath(sourcePath),
  to: fileURLToPath(outputPath),
});

await writeFile(outputPath, result.css);
