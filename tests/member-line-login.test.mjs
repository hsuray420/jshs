import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("會員中心提供 LINE 註冊／登入而非佔位按鈕", async () => {
  const account = await read("components/account-center.tsx");
  assert.match(account, /使用 LINE 註冊／登入/);
  assert.match(account, /\/api\/line\/login\/start/);
  assert.match(account, /LINE 會員/);
  assert.doesNotMatch(account, /登入服務將在帳號系統開放後啟用/);
});

test("LINE 會員 OAuth 使用獨立 callback、state cookie 與會員 session", async () => {
  const [start, callback, auth, line] = await Promise.all([
    read("app/api/line/login/start/route.ts"),
    read("app/api/line/login/callback/route.ts"),
    read("lib/member-auth.ts"),
    read("lib/line.ts"),
  ]);
  assert.match(start, /jshs_member_line_oauth_state/);
  assert.match(start, /callbackPath/);
  assert.match(callback, /expectedState/);
  assert.match(callback, /verifyLineIdToken/);
  assert.match(callback, /createMemberSessionCookie/);
  assert.doesNotMatch(callback, /ADMIN_LINE_USER_IDS|allowlist/);
  assert.match(auth, /httpOnly: true/);
  assert.match(auth, /sameSite: "lax"/);
  assert.match(auth, /secure: true/);
  assert.match(line, /callbackPath/);
});
