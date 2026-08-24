export type LineVerifiedProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
};

type LineTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type LineVerifyResponse = {
  sub?: string;
  name?: string;
  picture?: string;
  email?: string;
  error?: string;
  error_description?: string;
};

export function getLineLoginConfig() {
  return {
    channelId: process.env.LINE_LOGIN_CHANNEL_ID || "",
    channelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET || "",
  };
}

export function getAllowedLineUserIds() {
  return csvEnv("ADMIN_LINE_USER_IDS");
}

export function getAlertLineUserIds(fallbackUserId?: string) {
  const configured = csvEnv("LINE_ALERT_USER_IDS");
  if (configured.length) return configured;
  return fallbackUserId ? [fallbackUserId] : [];
}

export function hasLineLoginConfigured() {
  const config = getLineLoginConfig();
  return Boolean(config.channelId && config.channelSecret);
}

export function hasLineMessagingConfigured() {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN);
}

export function buildLineAuthorizeUrl({
  origin,
  state,
  callbackPath = "/api/admin/line/callback",
}: {
  origin: string;
  state: string;
  callbackPath?: string;
}) {
  const { channelId } = getLineLoginConfig();
  const redirectUri = `${origin}${callbackPath}`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: redirectUri,
    state,
    scope: "profile openid",
    bot_prompt: "normal",
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

export async function exchangeLineCode({
  code,
  origin,
  callbackPath = "/api/admin/line/callback",
}: {
  code: string;
  origin: string;
  callbackPath?: string;
}) {
  const { channelId, channelSecret } = getLineLoginConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: `${origin}${callbackPath}`,
    client_id: channelId,
    client_secret: channelSecret,
  });

  const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await response.json()) as LineTokenResponse;
  if (!response.ok || !data.id_token) {
    throw new Error(data.error_description || data.error || "line_token_failed");
  }
  return data;
}

export async function verifyLineIdToken(idToken: string): Promise<LineVerifiedProfile> {
  const { channelId } = getLineLoginConfig();
  const body = new URLSearchParams({
    id_token: idToken,
    client_id: channelId,
  });

  const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await response.json()) as LineVerifyResponse;
  if (!response.ok || !data.sub) {
    throw new Error(data.error_description || data.error || "line_verify_failed");
  }

  return {
    userId: data.sub,
    displayName: data.name || "LINE 使用者",
    pictureUrl: data.picture,
    email: data.email,
  };
}

export async function pushLineText(to: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { ok: false, skipped: true };

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`line_push_failed:${response.status}:${detail}`);
  }
  return { ok: true };
}

export async function notifyLineAdmins(text: string, fallbackUserId?: string) {
  const targets = getAlertLineUserIds(fallbackUserId);
  if (!targets.length || !hasLineMessagingConfigured()) {
    return { ok: false, skipped: true, sent: 0 };
  }

  let sent = 0;
  for (const userId of targets) {
    await pushLineText(userId, text);
    sent += 1;
  }
  return { ok: true, sent };
}

function csvEnv(key: string) {
  return (process.env[key] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
