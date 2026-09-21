import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireEditor } from "@/lib/editor-auth";
import { readSettings } from "@/lib/content-repository";
import { settingsInput, readInput, inputError } from "@/lib/content-validation";
export async function GET(request:Request){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});try{return Response.json({settings:await readSettings()},{headers:{"Cache-Control":"no-store"}});}catch(error){return inputError(error);}}
export async function PUT(request:Request){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});try{const body=await readInput(request,settingsInput);const values={...body,id:1,palette:JSON.stringify(body.palette),categoryColors:JSON.stringify(body.categoryColors),updatedAt:sql`CURRENT_TIMESTAMP`};await getDb().insert(siteSettings).values(values).onConflictDoUpdate({target:siteSettings.id,set:values});return Response.json({settings:await readSettings()});}catch(error){return inputError(error);}}
