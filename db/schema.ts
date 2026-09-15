import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const projects = sqliteTable("projects", { code:text("code").notNull().default(""), accent:text("accent").notNull().default("cyan"), media:text("media").notNull().default("[]"), id: integer("id").primaryKey({ autoIncrement:true }), title:text("title").notNull(), titleEs:text("title_es"), category:text("category").notNull().default("Otro"), description:text("description").notNull().default(""), descriptionEs:text("description_es"), outcome:text("outcome").notNull().default("Proyecto personal"), outcomeEs:text("outcome_es"), details:text("details").notNull().default("[]"), detailsEs:text("details_es").notNull().default("[]"), stack:text("stack").notNull().default("[]"), href:text("href").notNull().default("#"), repo:text("repo"), mediaUrl:text("media_url"), mediaType:text("media_type"), mediaAlt:text("media_alt"), featured:integer("featured",{mode:"boolean"}).notNull().default(false), published:integer("published",{mode:"boolean"}).notNull().default(true), sortOrder:integer("sort_order").notNull().default(100), createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`) });

export const customSections = sqliteTable("custom_sections", {
  kind: text("kind").notNull().default("custom"),
  media: text("media").notNull().default("[]"),
  items: text("items").notNull().default("[]"),
  id: integer("id").primaryKey({ autoIncrement: true }),
  eyebrowEn: text("eyebrow_en").notNull().default("FEATURED NOTE"),
  eyebrowEs: text("eyebrow_es").notNull().default("NOTA DESTACADA"),
  titleEn: text("title_en").notNull(),
  titleEs: text("title_es").notNull(),
  bodyEn: text("body_en").notNull().default(""),
  bodyEs: text("body_es").notNull().default(""),
  linkLabelEn: text("link_label_en"),
  linkLabelEs: text("link_label_es"),
  href: text("href"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(100),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const siteSettings = sqliteTable("site_settings", {
  palette: text("palette").notNull().default("{}"),
  previewSeconds: integer("preview_seconds").notNull().default(6),
  revealStyle: text("reveal_style").notNull().default("pixels"),
  id: integer("id").primaryKey().default(1),
  accentCyan: text("accent_cyan").notNull().default("#31e9ff"),
  accentViolet: text("accent_violet").notNull().default("#9d6cff"),
  motionLevel: integer("motion_level").notNull().default(2),
  heroTitleEn: text("hero_title_en").notNull().default("I engineer playable ideas."),
  heroTitleEs: text("hero_title_es").notNull().default("Convierto ideas en experiencias jugables."),
  heroTextEn: text("hero_text_en").notNull().default("Game and software developer focused on Unity, C# and Unreal Engine 5."),
  heroTextEs: text("hero_text_es").notNull().default("Desarrollador de videojuegos y software enfocado en Unity, C# y Unreal Engine 5."),
  availabilityEn: text("availability_en").notNull().default("Available for new opportunities"),
  availabilityEs: text("availability_es").notNull().default("Disponible para nuevas oportunidades"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
