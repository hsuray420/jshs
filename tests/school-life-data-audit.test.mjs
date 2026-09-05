import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("school-life research has a single auditable master list and coverage gate", async () => {
  await access(new URL("scripts/school-life-audit.mjs", root));
  const source = await read("scripts/school-life-audit.mjs");
  assert.match(source, /tp[\s\S]*taoyuan-lienchiang[\s\S]*kinmen/);
  assert.match(source, /Google Maps/);
  assert.match(source, /NOT_PUBLICLY_FOUND/);
  assert.match(source, /duplicate/i);
  assert.match(source, /依學校公告|請洽學校|交通便利/);
});

test("school-life source ledger only permits school-level, dated research records", async () => {
  await access(new URL("data\/school-life\/records.json", root));
  const ledger = JSON.parse(await read("data/school-life/records.json"));
  assert.equal(ledger.schemaVersion, "1.0");
  assert.ok(Array.isArray(ledger.records));
});

test("life research remains an audit ledger without overwriting canonical admission data", async () => {
  const [repository, ledger] = await Promise.all([read("lib/school-repository.ts"), read("data/school-life/records.json")]);
  assert.doesNotMatch(repository, /school-life\/records/);
  assert.match(ledger, /school_code/);
});
