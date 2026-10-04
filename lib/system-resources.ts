export type ResourceStatus = "ready" | "attention" | "unconfigured";

function safeExternalUrl(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch { return ""; }
}

export const ADMIN_EXTERNAL_LINKS = Object.freeze({
  hosting: safeExternalUrl(process.env.ADMIN_HOSTING_DASHBOARD_URL),
  supabase: safeExternalUrl(process.env.SUPABASE_DASHBOARD_URL),
  imagekit: safeExternalUrl(process.env.IMAGEKIT_DASHBOARD_URL),
  github: safeExternalUrl(process.env.GITHUB_REPOSITORY_URL),
  lineDevelopers: safeExternalUrl(process.env.LINE_DEVELOPERS_DASHBOARD_URL),
  lineOfficialAccount: safeExternalUrl(process.env.LINE_OA_DASHBOARD_URL),
});

export function providerStatus(configured: boolean): { status: ResourceStatus; label: string } {
  return configured ? { status: "ready", label: "已設定" } : { status: "unconfigured", label: "尚未設定" };
}
