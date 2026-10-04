export type AssistantStreamPayload = Readonly<{
  delta?: string;
  response?: string;
  token?: string;
  content?: string;
  result?: { response?: string; content?: string } | string;
  choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
}>;

export function extractAssistantStreamDelta(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const payload = value as AssistantStreamPayload;
  if (typeof payload.delta === "string") return payload.delta;
  if (typeof payload.response === "string") return payload.response;
  if (typeof payload.token === "string") return payload.token;
  if (typeof payload.content === "string") return payload.content;
  if (typeof payload.result === "string") return payload.result;
  if (payload.result && typeof payload.result === "object") {
    if (typeof payload.result.response === "string") return payload.result.response;
    if (typeof payload.result.content === "string") return payload.result.content;
  }
  const choice = payload.choices?.[0];
  return choice?.delta?.content || choice?.message?.content || "";
}

export function encodeAssistantSse(event: unknown): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function parseAssistantStreamLine(line: string): { delta?: string; done?: boolean; error?: string } {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(":")) return {};
  const data = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
  if (data === "[DONE]") return { done: true };
  try {
    const parsed = JSON.parse(data) as { error?: string };
    if (parsed.error) return { error: parsed.error };
    const delta = extractAssistantStreamDelta(parsed);
    return delta ? { delta } : {};
  } catch {
    return { error: "assistant_invalid_stream" };
  }
}
