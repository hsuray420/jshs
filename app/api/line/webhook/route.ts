const textEncoder = new TextEncoder();

async function verifyLineSignature(body: string, signature: string | null) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return { configured: false, valid: false };
  if (!signature) return { configured: true, valid: false };

  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, textEncoder.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  return { configured: true, valid: signature === expected };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");
  const verification = await verifyLineSignature(body, signature);

  if (!verification.configured) {
    return Response.json(
      {
        ok: false,
        status: "setup_required",
        message: "LINE_CHANNEL_SECRET is not configured yet.",
      },
      { status: 503 },
    );
  }

  if (!verification.valid) {
    return Response.json(
      { ok: false, status: "invalid_signature" },
      { status: 401 },
    );
  }

  return Response.json({
    ok: true,
    status: "received",
    next: "Connect LINE reply logic after channel access token is configured.",
  });
}

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "line-webhook",
    configured: Boolean(process.env.LINE_CHANNEL_SECRET),
    method: "POST",
  });
}
