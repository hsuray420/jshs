import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { getMemberSession } from "../../../lib/member-auth";
import { searchSiteKnowledge, formatAssistantContext } from "../../../lib/assistant-knowledge";
import { consumeGuestQuestion, ASSISTANT_GUEST_COOKIE } from "../../../lib/assistant-quota";
import { buildAssistantInstruction, getAssistantAction, getQuestionAllowance, sanitizeAssistantQuestion } from "../../../lib/assistant-policy";

export const dynamic = "force-dynamic";

const runtimeEnv = env as typeof env & { GEMINI_API_KEY?: string; GEMINI_MODEL?: string };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { question?: unknown } | null;
  const question = sanitizeAssistantQuestion(body?.question);
  if (question.length < 2) return json({ ok: false, error: "question_too_short" }, 400);

  const member = await getMemberSession();
  const action = getAssistantAction(question);
  if (action) return json({ ok: true, answer: action.reason, sources: [], action, usage: getQuestionAllowance(Boolean(member), 0) });

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

  const sources = searchSiteKnowledge(question);
  if (!sources.length) return json({ ok: true, answer: "本站目前沒有足夠資料可以確認這件事，請查看來源頁面或官方公告。", sources, usage }, 200, shouldSetGuestCookie ? guestId : undefined);

  const apiKey = runtimeEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ ok: false, error: "assistant_not_configured" }, 503, shouldSetGuestCookie ? guestId : undefined);
  const model = runtimeEnv.GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildAssistantInstruction() }] },
      contents: [{ role: "user", parts: [{ text: `CONTEXT:\n${formatAssistantContext(sources)}\n\nUSER QUESTION:\n${question}` }] }],
      generationConfig: { temperature: 0.15, maxOutputTokens: 700 },
    }),
  }).catch(() => null);
  if (!response?.ok) {
    const providerError = response ? await response.text().catch(() => "") : "";
    console.error("Gemini request failed", {
      status: response?.status || 0,
      model,
      message: providerError.slice(0, 500),
    });
    return json({ ok: false, error: "assistant_unavailable" }, 503, shouldSetGuestCookie ? guestId : undefined);
  }
  const payload = await response.json().catch(() => null) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } | null;
  const answer = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!answer) return json({ ok: false, error: "assistant_empty_response" }, 503, shouldSetGuestCookie ? guestId : undefined);
  return json({ ok: true, answer, sources, usage }, 200, shouldSetGuestCookie ? guestId : undefined);
}

function json(body: unknown, status = 200, guestId?: string) {
  const headers = new Headers({ "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  if (guestId) headers.append("set-cookie", `${ASSISTANT_GUEST_COOKIE}=${guestId}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
  return new Response(JSON.stringify(body), { status, headers });
}
