import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const notificationSettings = sqliteTable("notification_settings", {
  eventKey: text("event_key").primaryKey(),
  enabled: integer("enabled").notNull().default(1),
  title: text("title").notNull(),
  bodyTemplate: text("body_template").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const memberNotificationPreferences = sqliteTable("member_notification_preferences", {
  lineUserId: text("line_user_id").primaryKey(),
  plannerFinalizedEnabled: integer("planner_finalized_enabled").notNull().default(0),
  scoreCalculatedEnabled: integer("score_calculated_enabled").notNull().default(0),
  importantDateEnabled: integer("important_date_enabled").notNull().default(0),
  weeklyReportEnabled: integer("weekly_report_enabled").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const importantDates = sqliteTable("important_dates", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  eventDate: text("event_date").notNull(),
  sendAt: text("send_at").notNull(),
  enabled: integer("enabled").notNull().default(1),
  sentAt: text("sent_at"),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_important_dates_dispatch").on(table.enabled, table.sendAt, table.sentAt)]);

export const plannerConfirmations = sqliteTable("planner_confirmations", {
  plannerId: text("planner_id").primaryKey(),
  itemCount: integer("item_count").notNull(),
  stateJson: text("state_json").notNull(),
  confirmedAt: text("confirmed_at").notNull(),
});
