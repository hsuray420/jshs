import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("LINE 會員登入完成前必須驗證官方帳號好友狀態", async () => {
  const [line, start, callback, auth, account] = await Promise.all([
    read("lib/line.ts"),
    read("app/api/line/login/start/route.ts"),
    read("app/api/line/login/callback/route.ts"),
    read("lib/member-auth.ts"),
    read("components/account-center.tsx"),
  ]);

  assert.match(line, /getLineFriendStatus/);
  assert.match(line, /v2\/bot\/profile/);
  assert.match(start, /botPrompt: "aggressive"/);
  assert.match(callback, /getLineFriendStatus/);
  assert.match(callback, /line_friend_required/);
  assert.match(callback, /friendVerifiedAt/);
  assert.match(auth, /friendVerifiedAt/);
  assert.match(account, /加入官方 LINE 好友/);
  assert.match(account, /重新確認好友資格/);
});

test("算成績的每個功能都有自己的 canonical route", async () => {
  const [siteMap, tools, summary, history, placement, rules, calculator] = await Promise.all([
    read("content/site-map.json"),
    read("app/tools/page.tsx"),
    read("app/tools/summary/page.tsx"),
    read("app/tools/history/page.tsx"),
    read("app/tools/placement/page.tsx"),
    read("app/tools/rules/page.tsx"),
    read("components/admission-calculator.tsx"),
  ]);

  for (const path of ["/tools", "/tools/rules", "/tools/summary", "/tools/history", "/tools/placement"]) {
    assert.match(siteMap, new RegExp(path.replaceAll("/", "\\/")));
  }
  for (const source of [tools, summary, history, placement, rules]) assert.match(source, /SiteHeader/);
  assert.match(calculator, /jshs_score_history/);
  assert.match(calculator, /jshs_score_latest/);
});

test("重要日程的 canonical menu routes preserve merged capabilities", async () => {
  const paths = ["timeline", "now", "tasks"];
  const [siteMap, schedule] = await Promise.all([
    read("content/site-map.json"),
    read("components/schedule-workspace.tsx"),
  ]);

  for (const path of paths) {
    await access(new URL(`app/schedule/${path}/page.tsx`, root));
    assert.match(siteMap, new RegExp(`/schedule/${path}`));
  }
  for (const path of ["countdown", "compare", "export", "open-days"]) {
    await access(new URL(`app/schedule/${path}/page.tsx`, root));
    assert.match(await read(`app/schedule/${path}/page.tsx`), /redirect\(/);
  }
  assert.match(siteMap, /\/schools\/open-days/);
  assert.match(schedule, /view/);
  assert.match(schedule, /jshs_schedule_open_days/);
  assert.match(schedule, /新增開放日|加入校園開放日/);
  assert.match(schedule, /官方來源|個人活動/);
});
