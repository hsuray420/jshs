import { ensureAdminSchema, getD1 } from "./admin-store";

export const CONTENT_TYPES = [
  "knowledge_term",
  "knowledge_card",
  "schedule_task",
  "site_notice",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
export type ContentStatus = "draft" | "published";

export type ContentEntry = Readonly<{
  id: string;
  content_type: ContentType;
  slug: string;
  title: string;
  summary: string;
  body_json: string;
  status: ContentStatus;
  published_at: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
}>;

export type ContentRevision = Readonly<{
  id: string;
  content_id: string;
  content_type: ContentType;
  slug: string;
  title: string;
  summary: string;
  body_json: string;
  status: ContentStatus;
  revision: number;
  created_by: string;
  created_at: string;
}>;

const DEFAULT_CONTENT: ReadonlyArray<{
  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  body: Record<string, string>;
}> = [
  { type: "knowledge_term", slug: "超額比序", title: "超額比序", summary: "當申請人數超過名額時，依招生區公告的項目與順序比較，不是全國共用一張表。", body: { body: "當申請人數超過名額時，依招生區公告的項目與順序比較，不是全國共用一張表。" } },
  { type: "knowledge_term", slug: "序位", title: "序位", summary: "依適用規則與同區申請資料產生的排序位置；本站的試算不能取代正式公告序位。", body: { body: "依適用規則與同區申請資料產生的排序位置；本站的試算不能取代正式公告序位。" } },
  { type: "knowledge_term", slug: "免試入學", title: "免試入學", summary: "不以單一入學考試分發為唯一依據，而是依各區規則與志願選填辦理。", body: { body: "不以單一入學考試分發為唯一依據，而是依各區規則與志願選填辦理。" } },
  { type: "knowledge_term", slug: "挑戰適中穩定", title: "挑戰／適中／穩定", summary: "規劃候選校科的溝通分層，不是錄取保證，也不代表某校一定屬於哪一層。", body: { body: "規劃候選校科的溝通分層，不是錄取保證，也不代表某校一定屬於哪一層。" } },
  { type: "knowledge_term", slug: "群科", title: "群科", summary: "技術型高中把相近的學習內容分成群科，實際課程仍要看學校與科別的課程資料。", body: { body: "技術型高中把相近的學習內容分成群科，實際課程仍要看學校與科別的課程資料。" } },
  { type: "knowledge_card", slug: "免試入學", title: "3 分鐘看懂免試入學", summary: "先理解就學區、規則、積分與志願的關係，再進入適用地區。", body: { eyebrow: "免試入學", href: "/news/rules" } },
  { type: "knowledge_card", slug: "迷思", title: "常見迷思破解", summary: "分清楚官方規則、歷年參考、推估與不能保證的事情。", body: { eyebrow: "迷思", href: "/trust" } },
  { type: "knowledge_card", slug: "經驗", title: "過來人經驗談", summary: "把選校時常遇到的學習、通勤、家庭討論問題整理成提問。", body: { eyebrow: "經驗", href: "/news/parents" } },
  { type: "knowledge_card", slug: "影音", title: "短影音系列", summary: "每次只理解一個概念：適合在通勤或等待時快速複習。", body: { eyebrow: "影音", href: "/news" } },
  { type: "knowledge_card", slug: "podcast", title: "Podcast／語音版", summary: "把文章轉成可以朗讀的重點，先聽結論再回看來源。", body: { eyebrow: "podcast", href: "/news" } },
  { type: "knowledge_card", slug: "科系地圖", title: "未來銜接大學科系地圖", summary: "從學制與群科看後續可能路徑，不把任何一條路說成唯一答案。", body: { eyebrow: "科系地圖", href: "/news/career" } },
  { type: "schedule_task", slug: "read-rules", title: "讀完適用就學區規則", summary: "確認比序項目、志願數量與重要截止日。", body: { detail: "確認比序項目、志願數量與重要截止日。" } },
  { type: "schedule_task", slug: "try-schools", title: "建立三層候選校科", summary: "至少各放一個挑戰、適中與穩定選項。", body: { detail: "至少各放一個挑戰、適中與穩定選項。" } },
  { type: "schedule_task", slug: "check-score", title: "完成一次成績試算", summary: "留下年度、區域與待補欄位，避免混用規則。", body: { detail: "留下年度、區域與待補欄位，避免混用規則。" } },
  { type: "schedule_task", slug: "family-meeting", title: "完成一次家庭討論", summary: "記下學生想要的學習內容與家庭需要確認的條件。", body: { detail: "記下學生想要的學習內容與家庭需要確認的條件。" } },
];

export async function ensureContentSchema() {
  await ensureAdminSchema();
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS content_entries (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      body_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft',
      published_at TEXT,
      updated_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(content_type, slug)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS content_revisions (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      body_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL,
      revision INTEGER NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_content_entries_public
      ON content_entries(content_type, status, updated_at)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_content_revisions_entry
      ON content_revisions(content_id, revision DESC)`),
  ]);
  const now = new Date().toISOString();
  await db.batch(DEFAULT_CONTENT.map((item) => db.prepare(`INSERT OR IGNORE INTO content_entries
    (id, content_type, slug, title, summary, body_json, status, published_at, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'published', ?, 'system', ?, ?)`)
    .bind(`system-${item.type}-${item.slug}`, item.type, item.slug, item.title, item.summary, JSON.stringify(item.body), now, now, now)));
}

export async function listContentEntries(options: { type?: ContentType; status?: ContentStatus } = {}) {
  await ensureContentSchema();
  const conditions = ["1 = 1"];
  const values: string[] = [];
  if (options.type) { conditions.push("content_type = ?"); values.push(options.type); }
  if (options.status) { conditions.push("status = ?"); values.push(options.status); }
  const result = await getD1()
    .prepare(`SELECT * FROM content_entries WHERE ${conditions.join(" AND ")} ORDER BY content_type, updated_at DESC`)
    .bind(...values)
    .all<ContentEntry>();
  return result.results ?? [];
}

export async function listPublishedContent(type: ContentType) {
  return listContentEntries({ type, status: "published" });
}

export async function getContentEntry(id: string) {
  await ensureContentSchema();
  return getD1().prepare("SELECT * FROM content_entries WHERE id = ? LIMIT 1").bind(id).first<ContentEntry>();
}

export async function saveContentEntry(input: {
  id?: string;
  contentType: ContentType;
  slug: string;
  title: string;
  summary: string;
  bodyJson: string;
  status: ContentStatus;
  updatedBy: string;
}) {
  await ensureContentSchema();
  const now = new Date().toISOString();
  const id = input.id || crypto.randomUUID();
  const publishedAt = input.status === "published" ? now : null;
  await getD1().prepare(`INSERT INTO content_entries
    (id, content_type, slug, title, summary, body_json, status, published_at, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(content_type, slug) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      body_json = excluded.body_json,
      status = excluded.status,
      published_at = CASE WHEN excluded.status = 'published' THEN excluded.published_at ELSE content_entries.published_at END,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at`)
    .bind(id, input.contentType, input.slug, input.title, input.summary, input.bodyJson, input.status, publishedAt, input.updatedBy, now, now)
    .run();
  const entry = await getD1().prepare("SELECT * FROM content_entries WHERE content_type = ? AND slug = ? LIMIT 1")
    .bind(input.contentType, input.slug).first<ContentEntry>();
  if (!entry) throw new Error("content_entry_save_failed");
  await createRevision(entry, input.updatedBy);
  return entry;
}

export async function publishContentEntry(id: string, updatedBy: string) {
  const entry = await getContentEntry(id);
  if (!entry) return null;
  return saveContentEntry({
    id: entry.id,
    contentType: entry.content_type,
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    bodyJson: entry.body_json,
    status: "published",
    updatedBy,
  });
}

export async function unpublishContentEntry(id: string, updatedBy: string) {
  const entry = await getContentEntry(id);
  if (!entry) return null;
  return saveContentEntry({
    id: entry.id,
    contentType: entry.content_type,
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    bodyJson: entry.body_json,
    status: "draft",
    updatedBy,
  });
}

export async function listContentRevisions(contentId: string) {
  await ensureContentSchema();
  const result = await getD1().prepare(`SELECT * FROM content_revisions
    WHERE content_id = ? ORDER BY revision DESC LIMIT 30`).bind(contentId).all<ContentRevision>();
  return result.results ?? [];
}

async function createRevision(entry: ContentEntry, createdBy: string) {
  const latest = await getD1().prepare(`SELECT MAX(revision) AS revision FROM content_revisions WHERE content_id = ?`)
    .bind(entry.id).first<{ revision: number | null }>();
  await getD1().prepare(`INSERT INTO content_revisions
    (id, content_id, content_type, slug, title, summary, body_json, status, revision, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), entry.id, entry.content_type, entry.slug, entry.title, entry.summary, entry.body_json, entry.status, (latest?.revision || 0) + 1, createdBy, new Date().toISOString())
    .run();
}

export function parseContentBody<T extends Record<string, unknown>>(entry: Pick<ContentEntry, "body_json">, fallback: T): T {
  try {
    const value = JSON.parse(entry.body_json);
    return value && typeof value === "object" ? { ...fallback, ...value } as T : fallback;
  } catch {
    return fallback;
  }
}

export function isContentType(value: string): value is ContentType {
  return CONTENT_TYPES.includes(value as ContentType);
}
