import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { projects, customSections, siteSettings } from "../db/schema";
import type { StoredProject, StoredSection } from "./content-types";
import { defaultSettings, defaultPalette, type Settings } from "./site-settings";
function json<T>(value:string|null,fallback:T):T {try{return JSON.parse(value||"null")??fallback;}catch{return fallback;}}
export function serializeProject(row:typeof projects.$inferSelect):StoredProject {
  return {...row,titleEs:row.titleEs||row.title,descriptionEs:row.descriptionEs||row.description,outcomeEs:row.outcomeEs||row.outcome,repo:row.repo||"",mediaUrl:row.mediaUrl||"",mediaType:row.mediaType||"",mediaAlt:row.mediaAlt||"",accentColor:row.accentColor||"",previewUrl:row.previewUrl||"",stack:json(row.stack,[]),details:json(row.details,[]),detailsEs:json(row.detailsEs,[]),media:json(row.media,[])};
}
export function serializeSection(row:typeof customSections.$inferSelect):StoredSection {
  return {...row,kind:row.kind as StoredSection["kind"],href:row.href||"",linkLabelEn:row.linkLabelEn||"",linkLabelEs:row.linkLabelEs||"",mediaUrl:row.mediaUrl||"",mediaType:row.mediaType||"",media:json(row.media,[]),items:json(row.items,[])};
}
export async function readProjects(admin=false){return (await getDb().select().from(projects).where(admin?undefined:eq(projects.published,true)).orderBy(asc(projects.sortOrder),asc(projects.id))).map(serializeProject);}
export async function readSections(admin=false){return (await getDb().select().from(customSections).where(admin?undefined:eq(customSections.published,true)).orderBy(asc(customSections.sortOrder),asc(customSections.id))).map(serializeSection);}
export async function readSettings():Promise<Settings>{const [row]=await getDb().select().from(siteSettings).where(eq(siteSettings.id,1));if(!row)return defaultSettings;const palette=json<Partial<Settings["palette"]>>(row.palette,{});const categoryColors=json<Partial<Settings["categoryColors"]>>(row.categoryColors,{});return {...defaultSettings,...row,revealStyle:row.revealStyle as Settings["revealStyle"],defaultPresentation:row.defaultPresentation as Settings["defaultPresentation"],categoryColors:{...defaultSettings.categoryColors,...categoryColors},palette:{dark:{...defaultPalette.dark,...palette.dark},light:{...defaultPalette.light,...palette.light}}};}
export async function loadPublicContent(){const [projects,sections,settings]=await Promise.all([readProjects(),readSections(),readSettings()]);return {projects,sections,settings};}
