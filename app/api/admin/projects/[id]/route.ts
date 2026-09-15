import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { requireEditor } from "@/lib/editor-auth";
import { projectInput, readInput, inputError } from "@/lib/content-validation";
import { serializeProject } from "@/lib/content-repository";
type Context={params:Promise<{id:string}>};
export async function PUT(request:Request,context:Context){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});const id=Number((await context.params).id);if(!Number.isSafeInteger(id)||id<1)return Response.json({error:"ID inválido."},{status:400});try{const body=await readInput(request,projectInput);const [row]=await getDb().update(projects).set({...{...body,details:JSON.stringify(body.details),detailsEs:JSON.stringify(body.detailsEs),stack:JSON.stringify(body.stack),media:JSON.stringify(body.media)},updatedAt:sql`CURRENT_TIMESTAMP`}).where(eq(projects.id,id)).returning();return row?Response.json({project:serializeProject(row)}):Response.json({error:"No encontrado."},{status:404});}catch(error){return inputError(error);}}
export async function DELETE(request:Request,context:Context){const access=await requireEditor(request);if(!access.ok)return Response.json({error:access.message},{status:access.status});const id=Number((await context.params).id);if(!Number.isSafeInteger(id)||id<1)return Response.json({error:"ID inválido."},{status:400});try{const rows=await getDb().delete(projects).where(eq(projects.id,id)).returning({id:projects.id});return rows.length?Response.json({ok:true}):Response.json({error:"No encontrado."},{status:404});}catch(error){return inputError(error);}}
