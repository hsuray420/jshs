import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const adminFiles = sqliteTable("admin_files", {
  id: text("id").primaryKey(),
  objectKey: text("object_key").notNull().unique(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  category: text("category").notNull().default("general"),
  visibility: text("visibility").notNull().default("public"),
  description: text("description").notNull().default(""),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull(),
});
