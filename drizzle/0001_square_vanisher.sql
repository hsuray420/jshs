CREATE TABLE `important_dates` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`event_date` text NOT NULL,
	`send_at` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`sent_at` text,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `member_notification_preferences` (
	`line_user_id` text PRIMARY KEY NOT NULL,
	`planner_finalized_enabled` integer DEFAULT 0 NOT NULL,
	`score_calculated_enabled` integer DEFAULT 0 NOT NULL,
	`important_date_enabled` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`event_key` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`title` text NOT NULL,
	`body_template` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planner_confirmations` (
	`planner_id` text PRIMARY KEY NOT NULL,
	`item_count` integer NOT NULL,
	`state_json` text NOT NULL,
	`confirmed_at` text NOT NULL
);
