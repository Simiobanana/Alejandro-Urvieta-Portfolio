import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { projects } from "../../../db/schema";
function serialize(project: typeof projects.$inferSelect) {
  return { ...project, stack: JSON.parse(project.stack || "[]"), details: JSON.parse(project.details || "[]"), detailsEs: JSON.parse(project.detailsEs || "[]") };
}
export async function GET() {
  try { const rows = await getDb().select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id)); return Response.json({ projects: rows.map(serialize) }); }
  catch (error) { return Response.json({ projects: [], error: error instanceof Error ? error.message : "Database unavailable" }); }
}
