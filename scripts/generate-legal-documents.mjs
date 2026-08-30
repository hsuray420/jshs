import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const documentPaths = {
  privacy: "content/trust/privacy.txt",
  terms: "content/trust/terms.txt",
};

const documents = Object.fromEntries(
  await Promise.all(
    Object.entries(documentPaths).map(async ([name, path]) => [name, await readFile(resolve(root, path), "utf8")]),
  ),
);

const output = `// This file is generated from content/trust/*.txt. Do not edit it manually.\nexport const LEGAL_DOCUMENTS = ${JSON.stringify(documents, null, 2)} as const;\n`;

await writeFile(resolve(root, "lib/legal-documents.ts"), output, "utf8");
console.log("Generated lib/legal-documents.ts from complete legal source documents.");
