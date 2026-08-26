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

test("assistant handles basic greetings locally without requiring site retrieval", async () => {
  const policy = await read("lib/assistant-policy.ts");
  const route = await read("app/api/assistant/route.ts");
  const ui = await read("components/ai-assistant.tsx");
  assert.match(policy, /getAssistantConversationReply/);
  assert.match(policy, /你好|嗨/);
  assert.match(route, /getAssistantConversationReply/);
  assert.match(ui, /fixed.*bottom|fixed.*right/s);
  assert.match(ui, /aria-expanded/);
});

test("assistant routes general questions separately from site education data and site help", async () => {
  const policy = await read("lib/assistant-policy.ts");
  const route = await read("app/api/assistant/route.ts");
  assert.match(policy, /AssistantIntent/);
  assert.match(policy, /GENERAL.*SITE_EDUCATION_DATA.*SITE_HELP/s);
  assert.match(policy, /routeAssistantIntent/);
  assert.match(route, /intent !== "GENERAL"/);
  assert.match(route, /ROUTING_INTENT/);
  assert.match(route, /history/);
});

test("assistant prompt keeps general model knowledge available and treats site data as context", async () => {
  const policy = await read("lib/assistant-policy.ts");
  const ui = await read("components/ai-assistant.tsx");
  assert.match(policy, /一般知識/);
  assert.match(policy, /額外上下文/);
  assert.doesNotMatch(policy, /只能根據 CONTEXT/);
  assert.match(ui, /問我升學問題，或任何你想問的事情/);
  assert.match(ui, /一般 AI · 升學資料助手/);
});

test("assistant sends the current question once and isolates general replies from prior site context", async () => {
  const policy = await read("lib/assistant-policy.ts");
  const ui = await read("components/ai-assistant.tsx");
  assert.match(policy, /只針對本次 USER QUESTION/);
  assert.match(ui, /historySource = isRetry/);
  assert.match(ui, /current question out of history/);
});

test("assistant stream proxy parses each Gemini data line and flushes the final buffer", async () => {
  const route = await read("app/api/assistant/route.ts");
  assert.match(route, /event\.split\(\/\\r\?\\n/);
  assert.match(route, /if \(buffer\.trim\(\)\) enqueueGeminiEvent/);
});

test("assistant keeps the composer at the bottom and limits general request context", async () => {
  const css = await read("app/globals.css");
  const ui = await read("components/ai-assistant.tsx");
  const route = await read("app/api/assistant/route.ts");
  assert.match(css, /\.ai-chat-window > form \{[^}]*order: 3/);
  assert.match(ui, /history\.slice\(-6\)/);
  assert.match(route, /intent === "GENERAL" \? 420 : 700/);
});
