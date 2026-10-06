import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("assistant API emits raw SSE [DONE] without JSON-wrapping quotes", async () => {
  const route = await readFile(new URL("../app/api/assistant/route.ts", import.meta.url), "utf8");
  assert.match(route, /controller\.enqueue\(encoder\.encode\("data: \[DONE\]\\n\\n"\)\)/);
  assert.doesNotMatch(route, /send\("\[DONE\]"\)/);
});

test("assistant client handles raw [DONE], quoted [DONE], and accepts completed stream", async () => {
  const client = await readFile(new URL("../components/ai-assistant.tsx", import.meta.url), "utf8");
  assert.match(client, /data === "\[DONE\]" \|\| data === `"\[DONE\]"`/);
  assert.match(client, /if \(answer\.trim\(\)\) completed = true/);
  assert.match(client, /if \(!answer\.trim\(\)\) throw/);
});
