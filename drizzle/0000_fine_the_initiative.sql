CREATE TABLE `admin_files` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_files_object_key_unique` ON `admin_files` (`object_key`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL
);
