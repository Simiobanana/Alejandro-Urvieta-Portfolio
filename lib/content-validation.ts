import { z } from "zod";
import { colorLabels, defaultPalette, defaultSettings } from "./site-settings";
import { projectCategories } from "./content-types";

const short = z.string().trim().max(500);
const long = z.string().max(20000);
export const safeLink = z.string().max(2048).refine(value => {
  if (!value || value.startsWith("#")) return true;
  if (/[\\\u0000-\u0020]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return ["https:", "mailto:", "tel:"].includes(new URL(value).protocol); } catch { return false; }
}, "Usa https://, una ruta local, mailto: o tel:.");
const mediaUrl = safeLink.refine(v => !v || v.startsWith("https://") || (v.startsWith("/") && !v.startsWith("//")), "Archivo: usa https:// o una ruta local.");
const media = z.array(z.object({id:short.min(1),url:mediaUrl,type:short,alt:short.default(""),poster:mediaUrl.optional()})).max(50).default([]);
const order = z.number().int().min(-100000).max(100000).default(100);
const hex = z.string().regex(/^#[\da-fA-F]{6}$/);
export const projectInput = z.object({
  title:short.min(1),titleEs:short.default(""),category:z.enum(projectCategories).default("Pure Programming"),description:long.min(1),descriptionEs:long.default(""),
  outcome:long.default(""),outcomeEs:long.default(""),details:z.array(long).max(50).default([]),detailsEs:z.array(long).max(50).default([]),stack:z.array(short).max(50).default([]),
  href:safeLink.default(""),repo:safeLink.default(""),mediaUrl:mediaUrl.default(""),mediaType:short.default(""),mediaAlt:short.default(""),media,
  featured:z.boolean().default(false),published:z.boolean().default(true),sortOrder:order,code:short.default(""),accent:z.enum(["cyan","violet","amber","lime","rose"]).default("cyan"),
  hotspotX:z.number().int().min(5).max(95).nullable().default(null),hotspotY:z.number().int().min(5).max(95).nullable().default(null),accentColor:z.union([hex,z.literal("")]).default(""),previewUrl:mediaUrl.default(""),
});
export const sectionInput = z.object({
  kind:z.enum(["hero","highlights","work","profile","experience","contact","custom"]).default("custom"),
  eyebrowEn:short.default(""),eyebrowEs:short.default(""),titleEn:short.default(""),titleEs:short.default(""),bodyEn:long.default(""),bodyEs:long.default(""),
  linkLabelEn:short.default(""),linkLabelEs:short.default(""),href:safeLink.default(""),mediaUrl:mediaUrl.default(""),mediaType:short.default(""),media,
  items:z.array(z.object({titleEn:short,titleEs:short,bodyEn:long,bodyEs:long,label:short,href:safeLink})).max(100).default([]),published:z.boolean().default(true),sortOrder:order,
});
const palette = z.object(Object.fromEntries(Object.keys(colorLabels).map(k => [k,hex])) as Record<keyof typeof colorLabels,typeof hex>);
export const settingsInput = z.object({
  accentCyan:hex.default(defaultSettings.accentCyan),accentViolet:hex.default(defaultSettings.accentViolet),motionLevel:z.number().int().min(0).max(2),
  heroTitleEn:short.default(defaultSettings.heroTitleEn),heroTitleEs:short.default(defaultSettings.heroTitleEs),heroTextEn:long.default(defaultSettings.heroTextEn),heroTextEs:long.default(defaultSettings.heroTextEs),
  availabilityEn:short,availabilityEs:short,palette:z.object({dark:palette,light:palette}).default(defaultPalette),radarCooldownSeconds:z.number().int().min(1).max(300).default(15),previewSeconds:z.number().int().min(0).max(60),revealStyle:z.enum(["pixels","fade","rise","none"]),
  categoryColors:z.object({pureProgramming:hex,webProgramming:hex,engineArt:hex,pureArt:hex}).default(defaultSettings.categoryColors),defaultPresentation:z.enum(["immersive","standard"]).default("immersive"),
});
export async function readInput<T extends z.ZodTypeAny>(request:Request,schema:T):Promise<z.output<T>> {
  if (Number(request.headers.get("content-length")||0)>512000) throw new Error("INPUT_TOO_LARGE");
  const reader=request.body?.getReader(); let size=0; const chunks:Uint8Array[]=[];
  if (!reader) throw new Error("INVALID_INPUT");
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>512000){await reader.cancel();throw new Error("INPUT_TOO_LARGE");}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return schema.parse(JSON.parse(new TextDecoder().decode(bytes)));
}
export function inputError(error:unknown){
  if(error instanceof z.ZodError)return Response.json({error:error.issues.map(i=>`${i.path.join(".")}: ${i.message}`).join("; ")},{status:400});
  if(error instanceof SyntaxError || (error instanceof Error&&error.message==="INVALID_INPUT"))return Response.json({error:"El contenido enviado no es válido."},{status:400});
  if(error instanceof Error&&error.message==="INPUT_TOO_LARGE")return Response.json({error:"El contenido supera el límite permitido."},{status:413});
  console.error("Content operation failed",error instanceof Error?error.name:"UnknownError");
  return Response.json({error:"No se pudo guardar el cambio. Inténtalo nuevamente."},{status:500});
}
