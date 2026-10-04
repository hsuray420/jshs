import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { getMemberSession } from "../../../lib/member-auth";
import { searchSiteKnowledge, formatAssistantContext } from "../../../lib/assistant-knowledge";
import { consumeGuestQuestion, ASSISTANT_GUEST_COOKIE } from "../../../lib/assistant-quota";
import { buildAssistantInstruction, buildAssistantSearchQuery, getAssistantAction, getAssistantConversationReply, getQuestionAllowance, routeAssistantIntent, sanitizeAssistantQuestion, type AssistantHistoryItem } from "../../../lib/assistant-policy";
import { encodeAssistantSse, parseAssistantStreamLine } from "../../../lib/assistant-stream";

export const dynamic = "force-dynamic";

const runtimeEnv = env as typeof env & {
  AI?: { run(model: string, input: Record<string, unknown>, options?: { stream?: boolean }): Promise<unknown> };
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
  if (action) return body?.stream ? assistantSse({ answer: action.reason, sources: [], action, usage: getQuestionAllowance(Boolean(member), 0) }) : json({ ok: true, answer: action.reason, sources: [], action, usage: getQuestionAllowance(Boolean(member), 0) });
  const conversationReply = getAssistantConversationReply(question);
  if (conversationReply) return body?.stream ? assistantSse({ answer: conversationReply, sources: [], usage: getQuestionAllowance(Boolean(member), 0) }) : json({ ok: true, answer: conversationReply, sources: [], usage: getQuestionAllowance(Boolean(member), 0) });
  const intent = routeAssistantIntent(question, history);

  const cookieStore = await cookies();
  let guestCookie: string | undefined;
  let usage = getQuestionAllowance(Boolean(member), 0);
  if (!member) {
    const guestUsage = await consumeGuestQuestion(cookieStore.get(ASSISTANT_GUEST_COOKIE)?.value);
    const { cookieValue, ...publicUsage } = guestUsage;
    usage = publicUsage;
    guestCookie = cookieValue;
    if (!usage.allowed) return json({ ok: false, error: "guest_limit_reached", remaining: 0, loginPath: "/api/line/login/start" }, 429, guestCookie);
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

  if (intent === "OFFICIAL_SOURCE_REQUIRED" && !sources.length) {
    const result = { ok: true, intent, answer: "目前本站沒有足夠的官方資料可以確認這項規定。請前往官方簡章與規則頁，依你的就學區與學年度查看原始來源。", sources: [], schoolYear: null, usage };
    return body?.stream ? assistantSse(result, guestCookie) : json(result, 200, guestCookie);
  }

  const ai = runtimeEnv.AI;
  if (!ai) return json({ ok: false, error: "assistant_not_configured" }, 503, guestCookie);
  const model = runtimeEnv.WORKERS_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast";
  const prompt = `ROUTING_INTENT: ${intent}\nSITE_RETRIEVAL_STATUS: ${retrievalError ? "failed" : intent === "GENERAL" ? "not_needed" : sources.length ? "found" : "empty"}\nSITE_CONTEXT:\n${formatAssistantContext(sources) || "（沒有提供本站檢索資料）"}\n\nUSER QUESTION:\n${question}`;
  const input = {
    messages: [
      { role: "system", content: buildAssistantInstruction() },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user", content: prompt },
    ],
    temperature: intent === "GENERAL" ? 0.25 : 0.15,
    max_tokens: 2048,
  };
  if (body?.stream) return streamAssistantResponse(ai, model, input, { intent, sources, usage }, guestCookie);
  const payload = await ai.run(model, input).catch((error) => {
    console.error("Workers AI request failed", error instanceof Error ? error.message : "unknown_error");
    return null;
  });
  const answer = extractWorkersAnswer(payload);
  if (!answer) return json({ ok: false, error: "assistant_empty_response" }, 503, guestCookie);
  return json({ ok: true, answer, sources: intent === "GENERAL" ? [] : sources, intent, schoolYear: intent === "GENERAL" ? null : "115", usage }, 200, guestCookie);
}

function streamHeaders(guestCookie?: string) {
  const headers = new Headers({ "cache-control": "no-store", "content-type": "text/event-stream; charset=utf-8", connection: "keep-alive", "x-accel-buffering": "no" });
  if (guestCookie) headers.append("set-cookie", `${ASSISTANT_GUEST_COOKIE}=${guestCookie}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
  return headers;
}

function assistantSse(result: Record<string, unknown>, guestCookie?: string) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const answer = typeof result.answer === "string" ? result.answer : "";
      const meta = Object.fromEntries(Object.entries(result).filter(([key]) => key !== "answer"));
      controller.enqueue(encoder.encode(encodeAssistantSse({ meta })));
      controller.enqueue(encoder.encode(encodeAssistantSse({ delta: answer })));
      controller.enqueue(encoder.encode(encodeAssistantSse("[DONE]")));
      controller.close();
    },
  });
  return new Response(body, { headers: streamHeaders(guestCookie) });
}

async function streamAssistantResponse(ai: NonNullable<typeof runtimeEnv.AI>, model: string, input: Record<string, unknown>, meta: Record<string, unknown>, guestCookie?: string) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      void (async () => {
        try {
          const payload = await ai.run(model, input, { stream: true });
          if (!payload || typeof (payload as ReadableStream<Uint8Array>).getReader !== "function") throw new Error("assistant_stream_unsupported");
          controller.enqueue(encoder.encode(encodeAssistantSse({ meta })));
          const reader = (payload as ReadableStream<Uint8Array>).getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let emitted = false;
          while (true) {
            const chunk = await reader.read();
            buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
            const lines = buffer.split(/\r?\n/u);
            buffer = lines.pop() || "";
            for (const line of lines) {
              const parsed = parseAssistantStreamLine(line);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.done) continue;
              if (parsed.delta) { emitted = true; controller.enqueue(encoder.encode(encodeAssistantSse({ delta: parsed.delta }))); }
            }
            if (chunk.done) break;
          }
          const trailing = parseAssistantStreamLine(buffer);
          if (trailing.error) throw new Error(trailing.error);
          if (trailing.delta) { emitted = true; controller.enqueue(encoder.encode(encodeAssistantSse({ delta: trailing.delta }))); }
          if (!emitted) throw new Error("assistant_stream_empty");
          controller.enqueue(encoder.encode(encodeAssistantSse("[DONE]")));
          controller.close();
        } catch (error) {
          console.error("Workers AI stream failed", error instanceof Error ? error.message : "unknown_error");
          controller.enqueue(encoder.encode(encodeAssistantSse({ error: error instanceof Error ? error.message : "assistant_stream_failed" })));
          controller.close();
        }
      })();
    },
  });
  return new Response(body, { headers: streamHeaders(guestCookie) });
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

function json(body: unknown, status = 200, guestCookie?: string) {
  const headers = new Headers({ "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  if (guestCookie) headers.append("set-cookie", `${ASSISTANT_GUEST_COOKIE}=${guestCookie}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
  return new Response(JSON.stringify(body), { status, headers });
}
