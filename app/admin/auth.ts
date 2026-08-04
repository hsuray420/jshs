import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";

export async function requireAdmin() {
  const user = await requireChatGPTUser("/admin");
  const allowedEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedEmails.includes(user.email.toLowerCase())) {
    return { user, allowed: false, signOutPath: chatGPTSignOutPath("/") };
  }

  return { user, allowed: true, signOutPath: chatGPTSignOutPath("/") };
}
