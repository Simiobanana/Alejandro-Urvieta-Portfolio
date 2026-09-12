import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { projects } from "../../../db/schema";
import { requireEditor } from "../../../lib/editor-auth";

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  return String(value ?? "").split("\n").map((v) => v.trim()).filter(Boolean);
}
function serialize(project: typeof projects.$inferSelect) {
  return { ...project, stack: JSON.parse(project.stack || "[]"), details: JSON.parse(project.details || "[]"), detailsEs: JSON.parse(project.detailsEs || "[]") };
}
export async function GET() {
  try { const rows = await getDb().select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id)); return Response.json({ projects: rows.map(serialize) }); }
  catch (error) { return Response.json({ projects: [], error: error instanceof Error ? error.message : "Database unavailable" }); }
}
export async function POST(request: Request) {
  const access = await requireEditor(request); if (!access.ok) return Response.json({ error: access.message }, { status: access.status });
  const body = await request.json() as Record<string, unknown>, title = String(body.title ?? "").trim(), description = String(body.description ?? "").trim();
  if (!title || !description) return Response.json({ error: "El título y la descripción en inglés son obligatorios." }, { status: 400 });
  const tags = Array.isArray(body.stack) ? body.stack.map(String).filter(Boolean) : String(body.stack ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  const [project] = await getDb().insert(projects).values({ title, titleEs:String(body.titleEs??title).trim(), description, descriptionEs:String(body.descriptionEs??description).trim(), outcome:String(body.outcome??"Personal project").trim(), outcomeEs:String(body.outcomeEs??body.outcome??"Proyecto personal").trim(), details:JSON.stringify(list(body.details)), detailsEs:JSON.stringify(list(body.detailsEs)), category:String(body.category??"Programming"), stack:JSON.stringify(tags), href:String(body.href??"#"), repo:body.repo?String(body.repo):null, mediaUrl:body.mediaUrl?String(body.mediaUrl):null, mediaType:body.mediaType?String(body.mediaType):null, mediaAlt:body.mediaAlt?String(body.mediaAlt):null, featured:Boolean(body.featured), published:body.published!==false, sortOrder:Number(body.sortOrder??100) }).returning();
  return Response.json({ project: serialize(project) }, { status: 201 });
}
