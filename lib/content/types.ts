export type ContentStatus = "draft" | "published" | "archived";

export type ContentSource = Readonly<{ label: string; url: string; note?: string }>;

export type ContentMetadata = Readonly<{
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  academicYear?: string;
  status: ContentStatus;
  publishedAt?: string;
  updatedAt?: string;
  sources?: readonly ContentSource[];
  [key: string]: unknown;
}>;

export type ContentDocument<T extends ContentMetadata = ContentMetadata> = Readonly<{
  metadata: T;
  content: string;
  path: string;
}>;
