import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("privacy policy and terms routes render the complete repository documents", async () => {
  const [page, privacy, terms] = await Promise.all([
    read("app/trust/[slug]/page.tsx"),
    read("content/trust/privacy.txt"),
    read("content/trust/terms.txt"),
  ]);

  assert.match(page, /privacy: \{ title: "隱私權政策"/);
  assert.match(page, /terms: \{ title: "服務條款"/);
  assert.doesNotMatch(page, /privacy: "\/trust\/credibility"/);
  assert.doesNotMatch(page, /terms: "\/trust\/credibility"/);
  assert.match(page, /LEGAL_DOCUMENTS/);
  assert.doesNotMatch(page, /node:fs|readFileSync|content\/trust\//);
  assert.match(page, /whitespace-pre-wrap/);
  assert.ok(privacy.length > 5_000, "privacy policy must remain complete");
  assert.ok(terms.length > 5_000, "terms must remain complete");
  assert.match(privacy, /十八、隱私權政策更新/);
  assert.match(terms, /第十九條　準據法與爭議處理/);
});
