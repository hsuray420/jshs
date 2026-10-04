import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  pictureUrl: text("picture_url").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  lastLoginAt: text("last_login_at").notNull(),
});

export const userIdentities = sqliteTable("user_identities", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  unique("user_identities_provider_user_unique").on(table.provider, table.providerUserId),
  index("idx_user_identities_user").on(table.userId),
]);

export const lineFriendships = sqliteTable("line_friendships", {
  userId: text("user_id").primaryKey(),
  isFriend: integer("is_friend").notNull().default(0),
  checkedAt: text("checked_at").notNull(),
});

export const accountSettings = sqliteTable("account_settings", {
  userId: text("user_id").notNull(),
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
}, (table) => [unique("account_settings_user_key_unique").on(table.userId, table.settingKey)]);

export const favorites = sqliteTable("favorites", {
  userId: text("user_id").notNull(),
  schoolCode: text("school_code").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  unique("favorites_user_school_unique").on(table.userId, table.schoolCode),
  index("idx_favorites_user_created").on(table.userId, table.createdAt),
]);

export const memberNotificationPreferences = sqliteTable("member_notification_preferences", {
  userId: text("user_id").primaryKey(),
  plannerFinalizedEnabled: integer("planner_finalized_enabled").notNull().default(1),
  scoreCalculatedEnabled: integer("score_calculated_enabled").notNull().default(1),
  importantDateEnabled: integer("important_date_enabled").notNull().default(1),
  weeklyReportEnabled: integer("weekly_report_enabled").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
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
  academicYear: text("academic_year").notNull().default("116"),
  district: text("district").notNull().default("all"),
  status: text("status").notNull().default("pending"),
  sourceUrl: text("source_url").notNull().default(""),
  sourcePages: text("source_pages").notNull().default(""),
  version: integer("version").notNull().default(1),
  verifiedAt: text("verified_at"),
}, (table) => [index("idx_important_dates_dispatch").on(table.enabled, table.sendAt, table.sentAt)]);
