import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { getMemberSession } from "../../../lib/member-auth";
import { searchSiteKnowledge, formatAssistantContext } from "../../../lib/assistant-knowledge";
import { consumeGuestQuestion, ASSISTANT_GUEST_COOKIE } from "../../../lib/assistant-quota";
import { buildAssistantInstruction, buildAssistantSearchQuery, getAssistantAction, getAssistantConversationReply, getQuestionAllowance, routeAssistantIntent, sanitizeAssistantQuestion, type AssistantHistoryItem } from "../../../lib/assistant-policy";

export const dynamic = "force-dynamic";

const runtimeEnv = env as typeof env & {
  AI?: { run(model: string, input: Record<string, unknown>): Promise<unknown> };
  WORKERS_AI_MODEL?: string;
};
type Source = Readonly<{ title: string; url: string; snippet: string }>;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { question?: unknown; stream?: boolean; history?: unknown } | null;
  const question = sanitizeAssistantQuestion(body?.question);
  const history = sanitizeHistory(body?.history);
  if (question.length < 2) return json({ ok: false, error: "question_too_short" }, 400);

  const member = await getMemberSession();
  const action = getAssistantAction(question);
  if (action) return json({ ok: true, answer: action.reason, sources: [], action, usage: getQuestionAllowance(Boolean(member), 0) });
  const conversationReply = getAssistantConversationReply(question);
  if (conversationReply) return json({ ok: true, answer: conversationReply, sources: [], usage: getQuestionAllowance(Boolean(member), 0) });
  const intent = routeAssistantIntent(question, history);

  const cookieStore = await cookies();
  let guestId = cookieStore.get(ASSISTANT_GUEST_COOKIE)?.value;
  let shouldSetGuestCookie = false;
  let usage = getQuestionAllowance(Boolean(member), 0);
  if (!member) {
    if (!guestId || !/^[0-9a-f-]{36}$/i.test(guestId)) {
      guestId = crypto.randomUUID();
      shouldSetGuestCookie = true;
    }
    usage = await consumeGuestQuestion(guestId);
    if (!usage.allowed) return json({ ok: false, error: "guest_limit_reached", remaining: 0, loginPath: "/api/line/login/start" }, 429);
  }

  let sources: readonly Source[] = [];
  let retrievalError = false;
  if (intent !== "GENERAL") {
    try {
      sources = searchSiteKnowledge(buildAssistantSearchQuery(question, history));
    } catch (error) {
      retrievalError = true;
      console.error("Assistant site retrieval failed", error instanceof Error ? error.message : "unknown_error");
    }
  }

  const ai = runtimeEnv.AI;
  if (!ai) return json({ ok: false, error: "assistant_not_configured" }, 503, shouldSetGuestCookie ? guestId : undefined);
  const model = runtimeEnv.WORKERS_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast";
  const prompt = `ROUTING_INTENT: ${intent}\nSITE_RETRIEVAL_STATUS: ${retrievalError ? "failed" : intent === "GENERAL" ? "not_needed" : sources.length ? "found" : "empty"}\nSITE_CONTEXT:\n${formatAssistantContext(sources) || "（沒有提供本站檢索資料）"}\n\nUSER QUESTION:\n${question}`;
  const payload = await ai.run(model, {
    messages: [
      { role: "system", content: buildAssistantInstruction() },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user", content: prompt },
    ],
    temperature: intent === "GENERAL" ? 0.25 : 0.15,
    max_tokens: 2048,
  }).catch((error) => {
    console.error("Workers AI request failed", error instanceof Error ? error.message : "unknown_error");
    return null;
  });
  const answer = extractWorkersAnswer(payload);
  if (!answer) return json({ ok: false, error: "assistant_empty_response" }, 503, shouldSetGuestCookie ? guestId : undefined);
  return json({ ok: true, answer, sources: intent === "GENERAL" ? [] : sources, intent, usage }, 200, shouldSetGuestCookie ? guestId : undefined);
}

function extractWorkersAnswer(payload: unknown): string {
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";
  const record = payload as { response?: unknown; result?: unknown; choices?: Array<{ message?: { content?: unknown } }> };
  if (typeof record.response === "string") return record.response.trim();
  if (typeof record.result === "string") return record.result.trim();
  if (record.result && typeof record.result === "object" && typeof (record.result as { response?: unknown }).response === "string") return ((record.result as { response: string }).response).trim();
  const content = record.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

function sanitizeHistory(value: unknown): readonly AssistantHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { role?: unknown; content?: unknown } => Boolean(item) && typeof item === "object")
    .map((item): AssistantHistoryItem => ({ role: item.role === "assistant" ? "assistant" : "user", content: sanitizeAssistantQuestion(item.content) }))
    .filter((item) => item.content.length > 0)
    .slice(-6);
}

function json(body: unknown, status = 200, guestId?: string) {
  const headers = new Headers({ "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  if (guestId) headers.append("set-cookie", `${ASSISTANT_GUEST_COOKIE}=${guestId}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
  return new Response(JSON.stringify(body), { status, headers });
}
