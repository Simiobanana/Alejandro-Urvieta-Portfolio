CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'Otro' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`outcome` text DEFAULT 'Proyecto personal' NOT NULL,
	`stack` text DEFAULT '[]' NOT NULL,
	`href` text DEFAULT '#' NOT NULL,
	`repo` text,
	`media_url` text,
	`media_type` text,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 100 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
