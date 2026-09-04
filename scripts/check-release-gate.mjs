import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const required = ["app/not-found.tsx", "app/error.tsx", "app/manifest.ts", "public/favicon.svg", "public/og-image.svg", "public/robots.txt", "public/sitemap.xml"];
const runtimeFiles = ["app/not-found.tsx", "app/error.tsx", "app/page.tsx", "app/trust/page.tsx", "app/trust/[slug]/page.tsx", "public/it_hs/guide.htm", "public/it_hs/guide.js", "public/it_5/it_5.html", "public/jshs/jshs.html"];
const forbidden = [[/coming\s+soon/iu, "Coming soon"], [/功能開發中/u, "功能開發中"], [/lorem ipsum/iu, "Lorem ipsum"], [/placeholder\s+text/iu, "placeholder text"]];
const missing = [];
for (const file of required) { try { await access(resolve(root, file)); } catch { missing.push(file); } }
const issues = missing.map((file) => `missing required release surface: ${file}`);
for (const file of runtimeFiles) {
  let source;
  try { source = await readFile(resolve(root, file), "utf8"); } catch { continue; }
  for (const [pattern, label] of forbidden) if (pattern.test(source)) issues.push(`${file}: ${label}`);
}
if (issues.length) { console.error(`Release gate failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`); process.exitCode = 1; }
else console.log(`Release gate passed: ${required.length} required surfaces and ${runtimeFiles.length} runtime files checked.`);
