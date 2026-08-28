import { readFile } from "node:fs/promises";

const files = ["content/managed-content.json", "content/site-map.json"];
const forbidden = [/TODO/i, /FIXME/i, /lorem ipsum/i, /請輸入名詞說明/, /必要資料/];
const issues = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const pattern of forbidden) if (pattern.test(text)) issues.push(`${file}: ${pattern}`);
}
if (issues.length) { console.error(`Production placeholder check failed:\n${issues.join("\n")}`); process.exit(1); }
console.log("Production placeholder check passed.");
