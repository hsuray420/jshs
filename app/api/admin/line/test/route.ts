import { redirect } from "next/navigation";
import { requireAdmin } from "../../../../admin/auth";
import { notifyLineAdmins } from "../../../../../lib/line";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const origin = new URL(request.url).origin;
  await notifyLineAdmins(
    [
      "LINE 通知測試",
      `操作：${admin.user.displayName}`,
      `時間：${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
      `後台：${origin}/admin`,
    ].join("\n"),
    admin.user.lineUserId,
  );
  redirect("/admin?tested=line");
}
