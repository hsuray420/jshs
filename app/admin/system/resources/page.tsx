import Link from "next/link";
import { requireAdmin } from "../../auth";
import { listSchoolMediaMetadata } from "../../../../db/school-media-store";
import { getLatestLineVerification } from "../../../../db/member-identity-store";
import { checkImageKitHealth } from "../../../../lib/imagekit-server";
import { D1_DATABASES, ADMIN_EXTERNAL_LINKS, checkD1Binding, type ResourceStatus } from "../../../../lib/system-resources";
import { getLatestCanonicalSchoolCommit } from "../../../../lib/school-github-sync";
import { ImageKitSmokeTrigger } from "../../../../components/imagekit-smoke-trigger";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number | null) {
  if (bytes === null) return "目前無法取得";
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatDate(value: string | null) {
  if (!value) return "尚無記錄";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
}

function ResourceCard({ title, status, label, details, href, linkLabel }: {
  title: string;
  status: ResourceStatus;
  label: string;
  details: string[];
  href?: string;
  linkLabel?: string;
}) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <h2 className="font-bold text-slate-900">{title}</h2>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "ready" ? "bg-emerald-50 text-emerald-700" : status === "attention" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{label}</span>
    </div>
    <ul className="mt-4 space-y-2 text-sm text-slate-600">{details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
    {href && <a className="mt-4 inline-block text-sm font-semibold text-blue-700 underline" href={href} target="_blank" rel="noreferrer">{linkLabel ?? "開啟管理頁"}</a>}
  </article>;
}

export default async function AdminSystemResourcesPage() {
  await requireAdmin();
  const [d1Health, imageKit, github, lineVerification, schoolMedia] = await Promise.all([
    Promise.all(D1_DATABASES.map((database) => checkD1Binding(database.binding))),
    checkImageKitHealth(),
    getLatestCanonicalSchoolCommit("north").catch(() => ({ configured: true, connected: false, contentsRead: false, commit: null })),
    getLatestLineVerification().then((checkedAt) => ({ checkedAt, failed: false })).catch(() => ({ checkedAt: null, failed: true })),
    listSchoolMediaMetadata().then((images) => ({ count: images.filter((image) => image.storage_provider === "imagekit").length, failed: false })).catch(() => ({ count: null, failed: true })),
  ]);

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div className="mb-7">
      <Link href="/admin" className="text-sm font-semibold text-blue-700">← 返回管理後台</Link>
      <h1 className="mt-3 text-3xl font-black text-slate-900">系統資源</h1>
      <p className="mt-2 text-sm text-slate-600">健康狀態只根據實際連線測試或上次成功記錄顯示；未知用量不以固定數字代替。</p>
      <ImageKitSmokeTrigger />
    </div>

    <section aria-labelledby="database-title">
      <h2 id="database-title" className="mb-3 text-lg font-bold text-slate-900">Cloudflare D1</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {D1_DATABASES.map((database, index) => {
          const health = d1Health[index];
          const label = !health.configured ? "尚未設定" : health.connected ? "連線與查詢正常" : "查詢失敗";
          const status: ResourceStatus = !health.configured ? "unconfigured" : health.connected ? "ready" : "attention";
          return <ResourceCard key={database.binding} title={database.name} status={status} label={label} details={[
            `Binding：${database.binding}`,
            `用途：${database.purpose}`,
            `SELECT 1：${health.connected ? "成功" : health.configured ? "失敗" : "未設定"}`,
            `資料庫大小：${formatBytes(health.sizeBytes)}`,
            "未顯示百分比：Cloudflare 方案上限未經可靠 API 確認。",
          ]} href={ADMIN_EXTERNAL_LINKS.hosting || undefined} linkLabel="開啟 Cloudflare 管理頁" />;
        })}
      </div>
      <p className="mt-3 text-sm text-slate-600">此環境採用乾淨初始化的三域資料庫；不使用舊 D1 fallback，也不會執行 legacy data migration。</p>
    </section>

    <section aria-labelledby="services-title" className="mt-8">
      <h2 id="services-title" className="mb-3 text-lg font-bold text-slate-900">外部服務</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <ResourceCard title="ImageKit" status={!imageKit.configured ? "unconfigured" : imageKit.connected ? "ready" : "attention"} label={!imageKit.configured ? "尚未設定" : imageKit.connected ? "API 探測成功" : "API 探測失敗"} details={[
          `API 設定：${imageKit.configured ? "已設定" : "未設定"}`,
          `Files API 實際探測：${!imageKit.configured ? "未執行" : imageKit.connected ? "成功" : `失敗${imageKit.status ? `（HTTP ${imageKit.status}）` : ""}`}`,
          `D1 中 ImageKit 圖片 metadata：${schoolMedia.failed ? "查詢失敗" : `${schoolMedia.count} 筆`}（不是 ImageKit 帳戶總用量）`,
          "未顯示 ImageKit 儲存用量：此探測不提供帳戶總量。",
        ]} href={ADMIN_EXTERNAL_LINKS.imagekit || undefined} />
        <ResourceCard title="GitHub 官方資料" status={!github.configured ? "unconfigured" : github.connected ? "ready" : "attention"} label={!github.configured ? "未設定或無法驗證" : github.connected ? "Contents repository API 可讀" : "API 讀取失敗"} details={[
          `Contents API 實際讀取：${github.contentsRead ? "成功" : github.configured ? "失敗" : "GitHub Token 未設定"}`,
          `Commit history API：${github.commit ? "讀取成功" : "無法取得"}`,
          `最新學校 CSV commit：${github.commit?.sha ? github.commit.sha.slice(0, 12) : "無法取得"}`,
          `Commit 時間：${formatDate(github.commit?.date ?? null)}`,
          ...(github.commit?.message ? [`Commit 摘要：${github.commit.message}`] : []),
        ]} href={github.commit?.url || ADMIN_EXTERNAL_LINKS.github || undefined} linkLabel="開啟 GitHub" />
        <ResourceCard title="LINE Login / 好友驗證" status="attention" label={process.env.LINE_LOGIN_CHANNEL_ID && process.env.LINE_LOGIN_CHANNEL_SECRET && process.env.LINE_CHANNEL_ACCESS_TOKEN ? "設定完成（非即時健康檢查）" : "設定不完整"} details={[
          `LINE Login channel：${process.env.LINE_LOGIN_CHANNEL_ID && process.env.LINE_LOGIN_CHANNEL_SECRET ? "已設定" : "未設定"}`,
          `好友驗證 Messaging API token：${process.env.LINE_CHANNEL_ACCESS_TOKEN ? "已設定" : "未設定"}`,
          `最近一次好友驗證記錄：${lineVerification.failed ? "資料庫查詢失敗" : formatDate(lineVerification.checkedAt)}`,
          "此頁不呼叫 LINE API；記錄時間代表最近一筆好友狀態檢查，不是即時連線測試。",
        ]} href={ADMIN_EXTERNAL_LINKS.lineDevelopers || undefined} />
      </div>
    </section>
  </main>;
}
