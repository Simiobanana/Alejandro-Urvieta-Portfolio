ALTER TABLE `projects` ADD `hotspot_x` integer;
ALTER TABLE `projects` ADD `hotspot_y` integer;
ALTER TABLE `projects` ADD `accent_color` text DEFAULT '' NOT NULL;
ALTER TABLE `projects` ADD `preview_url` text DEFAULT '' NOT NULL;
ALTER TABLE `site_settings` ADD `category_colors` text DEFAULT '{}' NOT NULL;
ALTER TABLE `site_settings` ADD `default_presentation` text DEFAULT 'immersive' NOT NULL;
UPDATE `projects` SET `category` = CASE
  WHEN lower(`title`) LIKE '%measure%' OR lower(`title`) LIKE '%bananas%' THEN 'Pure Programming'
  WHEN lower(`title`) LIKE '%há kai%' OR lower(`title`) LIKE '%ká hai%' OR lower(`title`) LIKE '%ka hai%' THEN 'Web Programming'
  WHEN lower(`title`) LIKE '%shield%' OR lower(`title`) LIKE '%environment%' THEN 'Pure Art'
  ELSE 'Engine + Art'
END;
