import type { Metadata } from "next";
import { SOURCE_FILES } from "../../../lib/source-code";
import { requireAdmin } from "../auth";
import "../styles.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "程式碼｜管理後台",
  description: "管理後台查看目前部署包含的網站程式碼。",
};

export default async function AdminCodePage({
  searchParams,
}: {
  searchParams: Promise<{ file?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const current =
    SOURCE_FILES.find((file) => file.path === params.file) ?? SOURCE_FILES[0];

  return (
    <main className="admin-module-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Code</p>
          <h1>程式碼檢視</h1>
          <p className="admin-muted">管理員：{admin.user.displayName}</p>
        </div>
        <div className="admin-actions">
          <a href="/admin">回後台</a>
          <a href="/api/health">健康檢查</a>
          <a href={admin.signOutPath}>登出</a>
        </div>
      </header>

      <section className="admin-code-layout">
        <aside className="admin-panel">
          <p className="admin-eyebrow">Files</p>
          <h2>{SOURCE_FILES.length} 個檔案</h2>
          <nav className="admin-code-list">
            {SOURCE_FILES.map((file) => (
              <a key={file.path} href={`/admin/code?file=${encodeURIComponent(file.path)}`}>
                {file.path}
              </a>
            ))}
          </nav>
        </aside>

        <article className="admin-panel admin-code-file">
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Current File</p>
              <h2>{current.path}</h2>
            </div>
            <span className="admin-badge ok">{current.content.length.toLocaleString("zh-TW")} 字元</span>
          </div>
          <pre>{current.content}</pre>
        </article>
      </section>
    </main>
  );
}
