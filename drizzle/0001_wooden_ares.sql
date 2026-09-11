CREATE TABLE `custom_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`eyebrow_en` text DEFAULT 'FEATURED NOTE' NOT NULL,
	`eyebrow_es` text DEFAULT 'NOTA DESTACADA' NOT NULL,
	`title_en` text NOT NULL,
	`title_es` text NOT NULL,
	`body_en` text DEFAULT '' NOT NULL,
	`body_es` text DEFAULT '' NOT NULL,
	`link_label_en` text,
	`link_label_es` text,
	`href` text,
	`media_url` text,
	`media_type` text,
	`published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 100 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`accent_cyan` text DEFAULT '#31e9ff' NOT NULL,
	`accent_violet` text DEFAULT '#9d6cff' NOT NULL,
	`motion_level` integer DEFAULT 2 NOT NULL,
	`hero_title_en` text DEFAULT 'I engineer playable ideas.' NOT NULL,
	`hero_title_es` text DEFAULT 'Convierto ideas en experiencias jugables.' NOT NULL,
	`hero_text_en` text DEFAULT 'Game and software developer focused on Unity, C# and Unreal Engine 5.' NOT NULL,
	`hero_text_es` text DEFAULT 'Desarrollador de videojuegos y software enfocado en Unity, C# y Unreal Engine 5.' NOT NULL,
	`availability_en` text DEFAULT 'Available for new opportunities' NOT NULL,
	`availability_es` text DEFAULT 'Disponible para nuevas oportunidades' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `title_es` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `description_es` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `outcome_es` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `details` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `details_es` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `media_alt` text;