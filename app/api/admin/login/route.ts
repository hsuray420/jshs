import { redirect } from "next/navigation";
import {
  createAdminSessionCookie,
  hasAdminPasswordConfigured,
  verifyAdminPassword,
} from "../../../admin/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");

  if (!hasAdminPasswordConfigured()) {
    redirect("/admin/login?error=setup");
  }

  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=password");
  }

  await createAdminSessionCookie();
  redirect("/admin");
}
