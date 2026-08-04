import { redirect } from "next/navigation";
import { clearAdminSessionCookie } from "../../../admin/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await clearAdminSessionCookie();
  redirect("/admin/login?logged_out=1");
}

export async function POST() {
  await clearAdminSessionCookie();
  redirect("/admin/login?logged_out=1");
}
