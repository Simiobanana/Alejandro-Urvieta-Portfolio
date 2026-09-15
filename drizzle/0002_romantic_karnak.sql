ALTER TABLE `custom_sections` ADD `kind` text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE `custom_sections` ADD `media` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `custom_sections` ADD `items` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `accent` text DEFAULT 'cyan' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `media` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `palette` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `preview_seconds` integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `reveal_style` text DEFAULT 'pixels' NOT NULL;