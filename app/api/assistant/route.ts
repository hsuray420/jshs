import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { getMemberSession } from "../../../lib/member-auth";
import { searchSiteKnowledge, formatAssistantContext } from "../../../lib/assistant-knowledge";
import { consumeGuestQuestion, ASSISTANT_GUEST_COOKIE } from "../../../lib/assistant-quota";
import { buildAssistantInstruction, buildAssistantSearchQuery, getAssistantAction, getAssistantConversationReply, getQuestionAllowance, routeAssistantIntent, sanitizeAssistantQuestion, type AssistantHistoryItem } from "../../../lib/assistant-policy";

export const dynamic = "force-dynamic";

const runtimeEnv = env as typeof env & { GEMINI_API_KEY?: string; GEMINI_MODEL?: string };
type Source = Readonly<{ title: string; url: string; snippet: string }>;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { question?: unknown; stream?: boolean; history?: unknown } | null;
  const wantsStream = body?.stream === true;
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

  const apiKey = runtimeEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ ok: false, error: "assistant_not_configured" }, 503, shouldSetGuestCookie ? guestId : undefined);
  const model = runtimeEnv.GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const endpoint = wantsStream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const requestBody = {
    systemInstruction: { parts: [{ text: buildAssistantInstruction() }] },
    contents: [
      ...history.map((item) => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content }] })),
      { role: "user", parts: [{ text: `ROUTING_INTENT: ${intent}\nSITE_RETRIEVAL_STATUS: ${retrievalError ? "failed" : intent === "GENERAL" ? "not_needed" : sources.length ? "found" : "empty"}\nSITE_CONTEXT:\n${formatAssistantContext(sources) || "（沒有提供本站檢索資料）"}\n\nUSER QUESTION:\n${question}` }] },
    ],
    generationConfig: { temperature: 0.15, maxOutputTokens: 700 },
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody),
  }).catch(() => null);
  if (!response?.ok) {
    const providerError = response ? await response.text().catch(() => "") : "";
    const errorCode = response?.status === 429 ? "assistant_rate_limited" : response?.status && response.status >= 500 ? "assistant_unavailable" : "assistant_unavailable";
    console.error("Gemini request failed", {
      status: response?.status || 0,
      model,
      message: providerError.slice(0, 500),
    });
    return json({ ok: false, error: errorCode }, response?.status === 429 ? 429 : 503, shouldSetGuestCookie ? guestId : undefined);
  }
  if (wantsStream) return proxyGeminiStream(response, sources, usage, intent, shouldSetGuestCookie ? guestId : undefined);
  const payload = await response.json().catch(() => null) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } | null;
  const answer = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!answer) return json({ ok: false, error: "assistant_empty_response" }, 503, shouldSetGuestCookie ? guestId : undefined);
  return json({ ok: true, answer, sources: intent === "GENERAL" ? [] : sources, intent, usage }, 200, shouldSetGuestCookie ? guestId : undefined);
}

function proxyGeminiStream(response: Response, sources: readonly Source[], usage: unknown, intent: string, guestId?: string) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: { sources: intent === "GENERAL" ? [] : sources, intent, usage } })}\n\n`));
      const reader = response.body?.getReader();
      if (!reader) { controller.enqueue(encoder.encode("data: [DONE]\n\n")); controller.close(); return; }
      let buffer = "";
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const event of events) {
            const data = event.replace(/^data:\s*/, "").trim();
            if (!data || data === "[DONE]") continue;
            const payload = JSON.parse(data) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
            const delta = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
            if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
          }
        }
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "assistant_unavailable" })}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  const headers = new Headers({ "cache-control": "no-store", "content-type": "text/event-stream; charset=utf-8", "x-accel-buffering": "no" });
  if (guestId) headers.append("set-cookie", `${ASSISTANT_GUEST_COOKIE}=${guestId}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
  return new Response(stream, { headers });
}

function sanitizeHistory(value: unknown): readonly AssistantHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { role?: unknown; content?: unknown } => Boolean(item) && typeof item === "object")
    .map((item): AssistantHistoryItem => ({ role: item.role === "assistant" ? "assistant" : "user", content: sanitizeAssistantQuestion(item.content) }))
    .filter((item) => item.content.length > 0)
    .slice(-12);
}

function json(body: unknown, status = 200, guestId?: string) {
  const headers = new Headers({ "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  if (guestId) headers.append("set-cookie", `${ASSISTANT_GUEST_COOKIE}=${guestId}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
  return new Response(JSON.stringify(body), { status, headers });
}
