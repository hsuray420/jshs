import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("AI policy routes score requests to the existing tools instead of calculating", async () => {
  const source = await read("lib/assistant-policy.ts");
  assert.match(source, /\/tools/);
  assert.match(source, /\/tools\/placement/);
  assert.match(source, /成績|積分|分數|落點/);
  assert.match(source, /AssistantAction|action/);
});

test("AI policy allows only two anonymous questions and unlimited member questions", async () => {
  const source = await read("lib/assistant-policy.ts");
  assert.match(source, /ANONYMOUS_QUESTION_LIMIT\s*=\s*2/);
  assert.match(source, /isMember/);
  assert.match(source, /unlimited/);
});

test("assistant API authenticates members, uses the guest cookie, and calls Gemini server-side", async () => {
  const source = await read("app/api/assistant/route.ts");
  assert.match(source, /getMemberSession/);
  assert.match(source, /ASSISTANT_GUEST_COOKIE|jshs_ai_guest/);
  assert.match(source, /GEMINI_API_KEY/);
  assert.match(source, /generativelanguage\.googleapis\.com/);
  assert.match(source, /LINE|本站|網站內容/);
  assert.doesNotMatch(source, /calculateAdmissionScore/);
});

test("assistant UI submits questions and renders source links and feature actions", async () => {
  const source = await read("components/ai-assistant.tsx");
  assert.match(source, /api\/assistant/);
  assert.match(source, /sources/);
  assert.match(source, /action/);
  assert.match(source, /登入|兩次|會員/);
});
