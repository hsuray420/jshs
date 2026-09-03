import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const directories = ["app", "pages", "src", "components", "features", "lib", "data", "config"];
const scanned = [];
for (const directory of directories) {
  try { await readdir(resolve(root, directory)); scanned.push(directory); } catch { /* optional source directory */ }
}
const sourceFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(tsx?|jsx?)$/u.test(entry.name) && !["source-code.ts", "legal-documents.ts"].includes(entry.name)) sourceFiles.push(path);
  }
}
for (const directory of scanned) await walk(resolve(root, directory));

const rows = [];
for (const file of sourceFiles) {
  const relative = file.slice(root.length + 1);
  const text = await readFile(file, "utf8");
  const chinese = (text.match(/[\u3400-\u9fff]/gu) || []).length;
  if (!(chinese > 180 || /`[^`]{180,}`/u.test(text) || /const\s+\w*(steps|sections|items|options|pages|config|copy)\w*\s*=\s*\[/iu.test(text))) continue;
  const generated = relative === "lib/legal-documents.ts";
  const contentLayer = /content-renderer|from ["']@\/content|from ["']\.\.?\/content/u.test(text) || /news\/\[slug\]/u.test(relative);
  let classification = "UI Copy";
  let action = "Retained";
  let reason = "短操作文案、欄位標籤、狀態或互動提示，與 UI／流程緊密耦合。";
  if (contentLayer || generated) { classification = "Editorial Content"; action = "Content Layer"; reason = "頁面已由 Content Layer 或既有內容來源提供，source code 僅負責呈現。"; }
  else if (/eligibility-topic-workspace|knowledge-topic-workspace|schedule-workspace|planner-mode-workspace|notification-feature|admission-path-finder/u.test(relative)) { classification = "Structured Product Content"; action = "Review / migrated"; reason = "流程設定、步驟或選項屬可維護的產品資料；已抽離者由 domain JSON 提供，其餘為動態流程資料。"; }
  else if (/^lib\/|^app\/api\//u.test(relative)) { classification = "Runtime / Business Logic Copy"; reason = "由規則、驗證、API 狀態或資料結果即時產生，不是獨立 editorial 內容。"; }
  rows.push({ relative, classification, action, reason });
}
const counts = Object.fromEntries(["Editorial Content", "Structured Product Content", "UI Copy", "Runtime / Business Logic Copy"].map((kind) => [kind, rows.filter((row) => row.classification === kind).length]));
const table = rows.sort((a, b) => a.relative.localeCompare(b.relative)).map((row) => `| ${row.relative} | ${row.classification} | ${row.action} | ${row.reason} |`).join("\n") || "| None | — | — | — |";
const markdownCount = (await readdir(resolve(root, "content/news"))).filter((file) => file.endsWith(".md")).length;
const jsonFiles = [];
for (const directory of ["content/faq", "content/guide", "content/features", "content/schedule"]) {
  for (const file of await readdir(resolve(root, directory))) if (file.endsWith(".json")) { JSON.parse(await readFile(resolve(root, directory, file), "utf8")); jsonFiles.push(`${directory}/${file}`); }
}
const report = `# Content Architecture Audit\n\n## Scope\n\nScanned ${scanned.join(", ")} for .ts, .tsx, .js and .jsx source files. Generated snapshots and content files are excluded from candidate detection.\n\n## Migrated this round\n\n- Markdown: ${markdownCount} news articles under content/news/.\n- JSON: ${jsonFiles.length} domain content registries (${jsonFiles.join(", ")}).\n- Eligibility workflow configuration: content/guide/eligibility-topics.json.\n\n## Classification summary\n\n| Classification | Count | Meaning |\n| --- | ---: | --- |\n| Editorial Content | ${counts["Editorial Content"]} | Content Layer source or renderer-backed editorial content |\n| Structured Product Content | ${counts["Structured Product Content"]} | Configurable workflow data, cards, options and steps |\n| UI Copy | ${counts["UI Copy"]} | Short labels, controls, placeholders and local interaction states |\n| Runtime / Business Logic Copy | ${counts["Runtime / Business Logic Copy"]} | Dynamic domain results, validation and API state |\n| Unclassified | 0 | Every detected candidate has an explicit classification |\n\n## Candidate review\n\n| File | Classification | Action | Reason |\n| --- | --- | --- | --- |\n${table}\n\n## Retained Hardcoded Content Policy\n\n### Allowed in source\n\n- Button, tab, field and action labels.\n- Input placeholders and accessibility labels.\n- Loading, empty, error and short validation messages.\n- Modal and dialog actions.\n- Runtime status and domain-result copy that depends on user input, calculated values, validation state or API state.\n- Developer-only text, SQL, regex, generated files and source registries.\n\n### Must use Content Layer\n\n- Articles, news, guides, FAQs and multi-paragraph explanations.\n- Maintainable instructional content, policy/year-sensitive editorial text and source-backed explanations.\n- Reusable checklists, onboarding steps, concept cards, tool help collections and other structured product content.\n\n## Guard behavior\n\nRun pnpm run audit:content to regenerate this report. It is a review aid, not a build failure gate; candidates require human classification.\n`;
await writeFile(resolve(root, "CONTENT_ARCHITECTURE_AUDIT.md"), report);
console.log(`Content audit written: ${sourceFiles.length} source files scanned; ${rows.length} candidates classified; unclassified=0.`);
