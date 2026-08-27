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

test("assistant API authenticates members, uses the guest cookie, and calls Workers AI server-side", async () => {
  const source = await read("app/api/assistant/route.ts");
  const wrangler = await read("wrangler.jsonc");
  assert.match(source, /getMemberSession/);
  assert.match(source, /ASSISTANT_GUEST_COOKIE|jshs_ai_guest/);
  assert.match(source, /runtimeEnv\.AI|ai\.run/);
  assert.match(source, /WORKERS_AI_MODEL/);
  assert.match(source, /@cf\/meta\/llama-3\.1-8b-instruct-fast/);
  assert.match(source, /LINE|本站|網站內容/);
  assert.doesNotMatch(source, /GEMINI_API_KEY|generativelanguage\.googleapis\.com/);
  assert.match(wrangler, /"ai"\s*:\s*\{\s*"binding"\s*:\s*"AI"/s);
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

test("assistant handles English greetings locally so they receive a complete reply", async () => {
  const policy = await read("lib/assistant-policy.ts");
  assert.match(policy, /hello\|hallo\|hi/);
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

test("assistant provider returns one complete Workers AI answer instead of a fragile provider stream", async () => {
  const route = await read("app/api/assistant/route.ts");
  assert.match(route, /await ai\.run/);
  assert.match(route, /extractWorkersAnswer/);
  assert.doesNotMatch(route, /proxyGeminiStream/);
});

test("assistant keeps the composer at the bottom and limits general request context", async () => {
  const css = await read("app/globals.css");
  const ui = await read("components/ai-assistant.tsx");
  const route = await read("app/api/assistant/route.ts");
  assert.match(css, /\.ai-chat-window > form \{[^}]*order: 3/);
  assert.match(ui, /history\.slice\(-6\)/);
  assert.match(route, /max_tokens: 2048/);
});

test("assistant rejects an empty Workers AI answer before it reaches the UI", async () => {
  const route = await read("app/api/assistant/route.ts");
  assert.match(route, /assistant_empty_response/);
  assert.match(route, /!answer/);
});

test("assistant client uses the unary provider path so completed replies are validated before display", async () => {
  const ui = await read("components/ai-assistant.tsx");
  assert.match(ui, /question, stream: false, history/);
});

test("會員 AI 對話寫入 D1，訪客對話留在本機", async () => {
  const [layout, client, api, store] = await Promise.all([
    read("app/layout.tsx"), read("components/ai-assistant.tsx"), read("app/api/assistant/conversations/route.ts"), read("db/ai-conversation-store.ts"),
  ]);
  assert.match(layout, /getMemberSession/);
  assert.match(client, /\/api\/assistant\/conversations/);
  assert.match(api, /getMemberSession/);
  assert.match(api, /member_required/);
  assert.match(store, /CREATE TABLE IF NOT EXISTS member_ai_conversations/);
  assert.match(client, /getAllConversations/);
});

test("assistant shows rotating thinking states while waiting for a complete reply", async () => {
  const ui = await read("components/ai-assistant.tsx");
  const css = await read("app/globals.css");
  assert.match(ui, /正在思考|正在整理|正在檢查/);
  assert.match(ui, /setInterval/);
  assert.match(ui, /aria-live="polite"/);
  assert.match(css, /ai-chat-thinking/);
});
