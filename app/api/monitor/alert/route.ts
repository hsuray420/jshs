import { notifyLineAdmins } from "../../../../lib/line";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expectedSecret = process.env.MONITOR_ALERT_SECRET;
  const providedSecret = request.headers.get("x-monitor-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await safeJson(request);
  const level = String(body.level || "warning").slice(0, 30);
  const message = String(body.message || "伺服器狀態異常").slice(0, 500);
  const url = String(body.url || request.url).slice(0, 300);
  const timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

  const result = await notifyLineAdmins(
    [`網站告警`, `等級：${level}`, `訊息：${message}`, `網址：${url}`, `時間：${timestamp}`].join("\n"),
  );

  return Response.json({ ok: true, line: result });
}

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "monitor-alert",
    configured: Boolean(process.env.MONITOR_ALERT_SECRET),
    method: "POST",
  });
}

async function safeJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
